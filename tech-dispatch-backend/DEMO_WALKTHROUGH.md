# Tech Dispatch — Demo Walkthrough Script

## Pre-Demo Setup

### 1. Environment Check
```bash
# Ensure MongoDB is running
sudo systemctl status mongod

# Start the server
cd /home/sharad-bista/tech-dispatch-backend
npm run dev
```

### 2. Verify Server is Running
```bash
curl http://localhost:5000
# Expected: "Tech Dispatch API running"
```

### 3. Seed Test Data (Optional)
You may want to create test users and technicians before the demo.

---

## Demo Flow (15-20 minutes)

### PART 1: User Registration & Authentication (3 min)

**Step 1.1: Register a User**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Customer",
    "email": "john@example.com",
    "phone": "9841234567",
    "role": "user"
  }'
```
**Say:** "Users register with basic information. The system assigns them the 'user' role by default."

**Step 1.2: Register a Technician**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ram Technician",
    "email": "ram@example.com",
    "phone": "9851234567",
    "role": "technician"
  }'
```
**Say:** "Technicians register separately. In production, they would go through an approval process."

---

### PART 2: Technician Setup (2 min)

**Step 2.1: Update Technician Location (GeoJSON)**
```bash
curl -X PUT http://localhost:5000/api/technicians/location \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TECHNICIAN_TOKEN>" \
  -d '{
    "coordinates": [85.3240, 27.7172]
  }'
```
**Say:** "Technicians update their location using GeoJSON format. Note: longitude comes first, then latitude. This enables geospatial queries."

**Step 2.2: Approve Technician (Admin)**
```bash
curl -X PUT http://localhost:5000/api/admin/technicians/<TECH_ID>/verify \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```
**Say:** "Admin verifies technicians before they can receive bookings. This is a safety feature."

---

### PART 3: The Core Feature — Booking & Dispatch (5 min)

**Step 3.1: User Creates a Booking**
```bash
curl -X POST http://localhost:5000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <USER_TOKEN>" \
  -d '{
    "serviceType": "plumbing",
    "userLocation": [85.3200, 27.7100]
  }'
```
**Say:** "When a user creates a booking, the system immediately starts the dispatch algorithm."

**Key Points to Mention:**
- "The dispatch algorithm uses KNN-inspired logic"
- "It searches in expanding radii: 3km → 5km → 8km → 12km → 18km → 22km"
- "Up to 5 nearest available technicians receive the request simultaneously"

**Step 3.2: Check Booking Status**
```bash
curl http://localhost:5000/api/bookings/<BOOKING_ID> \
  -H "Authorization: Bearer <USER_TOKEN>"
```
**Say:** "The booking shows the requestQueue — all technicians who were notified."

---

### PART 4: Real-Time Communication (3 min)

**Step 4.1: Show WebSocket Connection**
Open browser console and demonstrate:
```javascript
const socket = io('http://localhost:5000');
socket.emit('join', { userId: '<TECH_ID>', role: 'technician' });
socket.on('booking-request', (data) => {
  console.log('New booking request:', data);
});
```
**Say:** "Technicians connect via WebSocket and join their personal room. When a booking is created, they receive real-time notifications."

**Step 4.2: Show Socket Event**
**Say:** "The booking-request event includes bookingId, serviceType, and expiresAt timestamp."

---

### PART 5: Race Condition Prevention — THE KEY DEMO (5 min)

**This is the most impressive part. Practice this.**

**Step 5.1: Setup — Two Technicians**
Create two technicians with locations near the user.

**Step 5.2: Create a Booking**
Both technicians receive the request.

**Step 5.3: Simultaneous Accept Attempt**
Open two terminals and run SIMULTANEOUSLY:

**Terminal 1:**
```bash
curl -X PUT http://localhost:5000/api/bookings/<BOOKING_ID>/accept \
  -H "Authorization: Bearer <TECH1_TOKEN>"
```

**Terminal 2:**
```bash
curl -X PUT http://localhost:5000/api/bookings/<BOOKING_ID>/accept \
  -H "Authorization: Bearer <TECH2_TOKEN>"
```

**Expected Result:**
- ONE returns: `{ "success": true, "message": "Booking accepted successfully" }`
- OTHER returns: `{ "success": false, "message": "Booking already accepted or expired" }` with 409 status

**Say:** "This demonstrates atomic operations. MongoDB's findOneAndUpdate ensures only one technician can accept. There are no race conditions because the database is the single source of truth."

---

### PART 6: Expiry Demonstration (2 min)

**Step 6.1: Show expiresAt**
```bash
curl http://localhost:5000/api/bookings/<BOOKING_ID> \
  -H "Authorization: Bearer <USER_TOKEN>"
```
**Say:** "Each booking has an expiresAt timestamp set to 60 minutes from creation."

**Step 6.2: Explain Expiry Logic**
**Say:** "We don't use timers or cron jobs. Expiry is a derived state — checked dynamically using `expiresAt > Date.now()`. This survives server restarts and requires no background workers."

---

### PART 7: Admin Dashboard (2 min)

**Step 7.1: Get Admin Stats**
```bash
curl http://localhost:5000/api/admin/stats \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "users": 5,
    "technicians": 3,
    "bookings": {
      "total": 10,
      "byStatus": {
        "requested": 2,
        "accepted": 3,
        "completed": 4,
        "cancelled": 1
      }
    }
  }
}
```
**Say:** "Admin sees aggregate statistics via a single MongoDB aggregation query. No complex time-series database needed."

---

## Key Talking Points (Have Ready)

### When Asked "Why not use timers?"
> "Timers are unsafe in distributed systems. They don't survive process restarts and can cause inconsistent state. Our timestamp-based approach is stateless and reliable."

### When Asked "Why not use Redis for locks?"
> "MongoDB's atomic operations are sufficient for single-document consistency. Adding Redis would be overengineering for this use case."

### When Asked "How do you handle concurrent requests?"
> "We use MongoDB's findOneAndUpdate which is atomic at the document level. The query includes conditions that must ALL be true for the update to succeed. Only one request can satisfy those conditions."

### When Asked "Why embedded requestQueue?"
> "Embedding maintains data locality and allows atomic updates. We can update both booking status and technician response in a single operation."

---

## Demo Checklist

Before demo, verify:
- [ ] Server running on port 5000
- [ ] MongoDB connected
- [ ] At least 2 test technicians created
- [ ] At least 1 test user created
- [ ] Technicians have location set (GeoJSON)
- [ ] Technicians are approved
- [ ] Admin user exists for stats demo

---

## Emergency Fallbacks

**If server crashes:**
```bash
npm run dev
```

**If MongoDB disconnects:**
```bash
sudo systemctl restart mongod
```

**If demo data is corrupted:**
```bash
mongosh tech-dispatch --eval "db.dropDatabase()"
# Then re-seed test data
```
