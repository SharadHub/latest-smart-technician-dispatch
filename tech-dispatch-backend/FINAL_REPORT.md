# Tech Dispatch — Final Project Report

## Project Information
- **Project Title:** Tech Dispatch — Real-Time Technician Dispatch System
- **Technology Stack:** Node.js, Express 5, MongoDB, Socket.IO
- **Architecture:** RESTful API with Real-Time WebSocket Communication

---

## 1. Executive Summary

Tech Dispatch is a real-time technician dispatch system that connects users requiring technical services with nearby available technicians. The system uses a KNN-inspired algorithm for optimal technician selection and implements atomic database operations to prevent race conditions in concurrent booking scenarios.

### Key Features
- Real-time technician dispatch using geospatial queries
- Concurrent booking handling with atomic operations
- WebSocket-based instant notifications
- Timestamp-based expiry (no background workers)
- Admin analytics via aggregation queries

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                            │
│  ┌──────────────┐              ┌──────────────┐             │
│  │  User App    │              │ Technician   │             │
│  │  (Browser)   │              │    App       │             │
│  └──────┬───────┘              └──────┬───────┘             │
└─────────┼────────────────────────────┼──────────────────────┘
          │ HTTP/REST                  │ HTTP + WebSocket
          │                            │
┌─────────┴────────────────────────────┴──────────────────────┐
│                      API LAYER                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                 Express.js Server                     │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐      │   │
│  │  │   Auth     │  │  Booking   │  │   Admin    │      │   │
│  │  │ Controller │  │ Controller │  │ Controller │      │   │
│  │  └────────────┘  └────────────┘  └────────────┘      │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────┬───────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────┐
│                    BUSINESS LOGIC LAYER                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              dispatch.js                              │   │
│  │  • KNN-inspired technician selection                  │   │
│  │  • Expanding radius search                            │   │
│  │  • Request queue management                           │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────┬───────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────┐
│                      DATA LAYER                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    MongoDB                            │   │
│  │  • Users Collection                                   │   │
│  │  • Technicians Collection (2dsphere indexed)          │   │
│  │  • Bookings Collection (embedded requestQueue)        │   │
│  │  • Ratings Collection                                 │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────┐
│                  REAL-TIME LAYER (Notification Only)         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                   Socket.IO                           │   │
│  │  • Role-based rooms (user:<id>, technician:<id>)      │   │
│  │  • Event emission (booking-request, booking-accepted) │   │
│  │  • NO state mutation                                  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Design Principles
1. **Database as Single Source of Truth** — All state transitions occur via MongoDB
2. **Stateless Architecture** — No in-memory state, survives restarts
3. **Atomic Operations** — Race conditions prevented at database level
4. **Separation of Concerns** — Controllers orchestrate, utilities compute

---

## 3. Database Design

### 3.1 Entity-Relationship Overview

```
User (1) ────────< (N) Booking (N) >──────── (1) Technician
                        │
                        │ (1)
                        ▼
                      Rating
```

### 3.2 Collection Schemas

#### User Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  phone: String,
  role: "user" | "admin",
  location: { city, lat, lng },
  timestamps: true
}
```

#### Technician Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  skills: [String],
  location: {                    // GeoJSON Point
    type: "Point",
    coordinates: [lng, lat]      // longitude first!
  },
  status: "active" | "busy" | "inactive",
  approved: Boolean,
  ratingAvg: Number,
  ratingCount: Number,
  timestamps: true
}
// Index: { location: "2dsphere" }
```

#### Booking Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  technicianId: ObjectId (ref: Technician),
  serviceType: String,
  status: "requested" | "accepted" | "in-progress" | "completed" | "failed" | "cancelled" | "expired",
  expiresAt: Date (indexed),
  acceptedAt: Date,
  cancelledAt: Date,
  failedAt: Date,
  completedAt: Date,
  radiusUsed: Number,
  statusHistory: [{
    status: String,
    triggeredBy: String,
    timestamp: Date
  }],
  requestQueue: [{              // Embedded for atomicity
    technicianId: ObjectId,
    status: "pending" | "accepted" | "rejected" | "expired",
    respondedAt: Date
  }],
  timestamps: true
}
```

### 3.3 Design Justifications

| Decision | Justification |
|----------|---------------|
| Embedded requestQueue | Enables atomic updates on booking + technician responses |
| GeoJSON location | Required for MongoDB 2dsphere geospatial queries |
| expiresAt timestamp | Allows stateless expiry without timers |
| Status enum | Enforces valid state machine transitions |

---

## 4. Algorithm Design

### 4.1 KNN-Inspired Dispatch Algorithm

The dispatch algorithm selects the K nearest available technicians using an expanding radius search.

#### Pseudocode
```
function dispatchTechnicians(bookingId, userLocation):
    radii = [3, 5, 8, 12, 18, 22]  // kilometers
    
    for each radius in radii:
        technicians = findTechnicians(
            location: within radius of userLocation,
            status: "active",
            approved: true,
            limit: 5
        )
        
        if technicians.length == 0:
            continue to next radius
        
        addToRequestQueue(bookingId, technicians, radius)
        emitNotifications(technicians, bookingId)
        
        acceptedTech = waitForAcceptance(bookingId, timeout)
        
        if acceptedTech:
            return acceptedTech
    
    return null  // No technician found
```

#### MongoDB Geospatial Query
```javascript
Technician.find({
  location: {
    $nearSphere: {
      $geometry: {
        type: "Point",
        coordinates: userLocation
      },
      $maxDistance: radius * 1000  // meters
    }
  },
  approved: true,
  status: "active"
}).limit(5)
```

### 4.2 Why KNN-Inspired (Not Pure KNN)

Traditional KNN is a classification algorithm. Our adaptation:
- Uses distance as primary ranking factor
- Applies real-time availability filtering
- Returns multiple candidates (not single classification)
- Designed for service dispatch, not prediction

---

## 5. Concurrency Handling

### 5.1 The Problem

Multiple technicians can attempt to accept the same booking simultaneously. Without proper handling, this creates:
- Double bookings
- Inconsistent state
- Poor user experience

### 5.2 The Solution — Atomic Operations

```javascript
const booking = await Booking.findOneAndUpdate(
  {
    _id: bookingId,
    status: "requested",                    // Must still be requested
    expiresAt: { $gt: new Date() },         // Must not be expired
    "requestQueue.technicianId": technicianId,
    "requestQueue.status": "pending"        // Tech hasn't responded
  },
  {
    $set: {
      status: "accepted",
      technicianId: technicianId,
      acceptedAt: new Date(),
      "requestQueue.$.status": "accepted"
    }
  },
  { new: true }
);

if (!booking) {
  return res.status(409).json({
    message: "Booking already accepted or expired"
  });
}
```

### 5.3 Why This Works

1. **All conditions checked atomically** — Query and update in single operation
2. **Document-level lock** — MongoDB guarantees only one update succeeds
3. **No in-memory state** — Works across multiple server instances
4. **Immediate feedback** — Losing technician gets 409 Conflict

### 5.4 What We Avoided

| Anti-Pattern | Why Avoided |
|--------------|-------------|
| In-memory locks | Don't survive restarts, don't scale |
| setTimeout checks | Unreliable, creates timing issues |
| Two-phase updates | Not atomic, allows race conditions |
| Redis distributed locks | Overengineering for this use case |

---

## 6. Real-Time Communication

### 6.1 Socket.IO Architecture

```javascript
// Room structure
user:<userId>         // For user notifications
technician:<techId>   // For technician notifications
```

### 6.2 Events

| Event | Direction | Purpose |
|-------|-----------|---------|
| `join` | Client → Server | Join role-based room |
| `booking-request` | Server → Technician | New booking available |
| `booking-accepted` | Server → User | Technician accepted |
| `booking-closed` | Server → Other Techs | Booking no longer available |
| `booking-failed` | Server → User | Technician failed job |
| `booking-completed` | Server → User | Job completed |

### 6.3 Critical Design Rule

> **WebSockets are for notification only. The database decides all state transitions.**

This ensures:
- Consistency even if WebSocket fails
- No race conditions from client-side logic
- System works correctly with or without real-time connection

---

## 7. Expiry Management

### 7.1 Timestamp-Based Approach

```javascript
// At booking creation
expiresAt: new Date(Date.now() + 60 * 60 * 1000)  // 60 minutes

// At accept time
expiresAt: { $gt: new Date() }  // Check not expired
```

### 7.2 Why No Timers

| Timer Approach | Our Approach |
|----------------|--------------|
| Requires background worker | Stateless check on demand |
| Dies on restart | Survives any restart |
| Memory overhead | Zero memory overhead |
| Scaling issues | Scales infinitely |

### 7.3 Expiry as Derived State

A booking is "expired" when:
```javascript
status === "requested" && expiresAt < Date.now()
```

This is evaluated on read, never persisted.

---

## 8. API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user/technician |
| POST | `/api/auth/login` | Login and get JWT |
| GET | `/api/auth/me` | Get current user |

### Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bookings` | Create booking (triggers dispatch) |
| GET | `/api/bookings` | List user's bookings |
| GET | `/api/bookings/:id` | Get booking details |
| PUT | `/api/bookings/:id/accept` | Technician accepts |
| PUT | `/api/bookings/:id/reject` | Technician rejects |
| PUT | `/api/bookings/:id/cancel` | User cancels |
| PUT | `/api/bookings/:id/fail` | Technician fails job |
| PUT | `/api/bookings/:id/complete` | Technician completes |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Dashboard statistics |
| GET | `/api/admin/users` | List all users |
| GET | `/api/admin/technicians` | List all technicians |
| PUT | `/api/admin/technicians/:id/verify` | Approve technician |

### Technician
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/technicians/profile` | Get own profile |
| PUT | `/api/technicians/profile` | Update profile |
| PUT | `/api/technicians/location` | Update location |
| GET | `/api/technicians/bookings` | Get assigned bookings |

---

## 9. Security Considerations

### 9.1 Authentication
- JWT-based authentication
- Tokens stored client-side, validated server-side
- No sensitive data in tokens

### 9.2 Authorization
- Role-based access control (user, technician, admin)
- Middleware enforces route permissions
- Booking ownership verified before mutations

### 9.3 Data Validation
- Mongoose schema validation
- Request body validation in controllers
- Atomic operations prevent partial updates

---

## 10. Testing Strategy

### 10.1 Critical Test Cases

1. **Race Condition Test**
   - Two technicians accept simultaneously
   - Verify only one succeeds

2. **Expiry Test**
   - Create booking, wait beyond expiry
   - Verify accept fails with 409

3. **Geospatial Test**
   - Create technicians at known locations
   - Verify correct radius selection

4. **State Machine Test**
   - Verify invalid transitions rejected
   - e.g., cannot fail a cancelled booking

---

## 11. Future Enhancements

While out of scope for this project, potential enhancements include:

1. **Weighted Scoring** — Factor in skills and rating
2. **Push Notifications** — Mobile app integration
3. **Payment Integration** — Stripe/eSewa
4. **Rating System** — Post-completion reviews
5. **Technician Scheduling** — Availability calendar

---

## 12. Conclusion

Tech Dispatch demonstrates:

1. **Sound Architecture** — Clear separation of concerns
2. **Correct Concurrency** — Race conditions eliminated
3. **Efficient Algorithms** — KNN-inspired geospatial matching
4. **Practical Design** — No overengineering, appropriate for scope

The system is production-ready for the demonstrated scale and serves as a solid foundation for future enhancement.

---

## Appendix A: Project Structure

```
src/
├── config/
│   ├── db.js              # MongoDB connection
│   └── socket.js          # (legacy)
├── socket/
│   └── index.js           # Socket.IO setup
├── models/
│   ├── User.js
│   ├── Technician.js
│   ├── Booking.js
│   └── Rating.js
├── controllers/
│   ├── auth.controller.js
│   ├── booking.controller.js
│   ├── admin.controller.js
│   └── technician.controller.js
├── routes/
│   ├── auth.routes.js
│   ├── booking.routes.js
│   ├── admin.routes.js
│   └── technician.routes.js
├── middlewares/
│   ├── auth.middleware.js
│   └── role.middleware.js
├── utils/
│   ├── constants.js
│   └── dispatch.js        # Core algorithm
├── app.js                 # Express setup
└── server.js              # Entry point
```

## Appendix B: Environment Variables

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/tech-dispatch
JWT_SECRET=your_secret_key
```

---

**End of Report**
