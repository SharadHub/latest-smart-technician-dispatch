# Technician Recommendation API

This API provides intelligent technician recommendations using a K-Nearest Neighbors (KNN) algorithm based on location, skills, and ratings.

## Base URL
```
http://localhost:5000/api/recommendations
```

## Authentication
All endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Get Recommendations by Location
Get technician recommendations based on geographic coordinates and required skills.

**Endpoint:** `GET /`

**Query Parameters:**
- `lat` (required): Latitude of the user location
- `lng` (required): Longitude of the user location
- `skills` (optional): Comma-separated list of required skills
- `maxDistance` (optional): Maximum distance in kilometers (default: no limit)
- `diverse` (optional): Set to 'true' for diverse skill recommendations
- `k` (optional): Number of recommendations to return (default: 5)

**Example Request:**
```
GET /api/recommendations?lat=27.7172&lng=85.3240&skills=Electrician,Plumber&maxDistance=10&k=3
```

**Example Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "name": "Ram Sharma",
      "email": "tech1@techdispatch.com",
      "skills": ["Electrician", "Wiring Installation"],
      "location": {
        "type": "Point",
        "coordinates": [85.3240, 27.7172]
      },
      "status": "active",
      "approved": true,
      "ratingAvg": 4.5,
      "ratingCount": 23,
      "weightedDistance": 0.234,
      "distance": 2.5,
      "skillSimilarity": 0.8,
      "rating": 4.5,
      "recommendationScore": "0.766",
      "rank": 1,
      "user": {
        "name": "Ram Sharma",
        "email": "tech1@techdispatch.com",
        "phone": "9812345678",
        "location": {
          "city": "Kathmandu",
          "lat": 27.7172,
          "lng": 85.3240
        }
      }
    }
  ]
}
```

### 2. Get Recommendations by City
Get recommendations for a specific city.

**Endpoint:** `GET /city`

**Query Parameters:**
- `city` (required): Name of the city
- `skills` (optional): Comma-separated list of required skills
- `maxDistance` (optional): Maximum distance in kilometers
- `diverse` (optional): Set to 'true' for diverse skill recommendations
- `k` (optional): Number of recommendations to return (default: 5)

**Example Request:**
```
GET /api/recommendations/city?city=Kathmandu&skills=Plumber&k=5
```

### 3. Get Available Skills
Get a list of all available skills for filtering.

**Endpoint:** `GET /skills`

**Example Response:**
```json
{
  "success": true,
  "count": 45,
  "data": [
    "AC Repair",
    "Appliance Repair",
    "Bathroom Fitting",
    "Carpenter",
    "Electrician",
    "Plumber",
    ...
  ]
}
```

### 4. Get Technician Statistics
Get statistics about technicians in the system.

**Endpoint:** `GET /stats`

**Example Response:**
```json
{
  "success": true,
  "data": {
    "total": 120,
    "active": 86,
    "busy": 25,
    "inactive": 9,
    "avgRating": 3.74,
    "totalRatings": 2847
  }
}
```

## Algorithm Details

### KNN Recommendation Logic
The recommendation system uses a weighted KNN algorithm with the following factors:

1. **Location Distance (40% weight)**: Calculated using Haversine formula
2. **Skill Similarity (40% weight)**: Jaccard similarity between required and available skills
3. **Rating (20% weight)**: Normalized technician rating

### Distance Calculation
- Uses Haversine formula for accurate geographic distance calculation
- Normalized to 0-1 scale based on maximum reasonable distance in Nepal (500km)

### Skill Similarity
- Jaccard similarity: `|A ∩ B| / |A ∪ B|`
- Compares required skills with technician's available skills
- Case-insensitive matching

### Rating Normalization
- 5-star rating normalized to 0-1 scale: `(rating - 1) / 4`

## Usage Examples

### Find Electricians near Kathmandu
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:5000/api/recommendations?lat=27.7172&lng=85.3240&skills=Electrician&maxDistance=15"
```

### Get diverse recommendations in Pokhara
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:5000/api/recommendations/city?city=Pokhara&diverse=true&k=10"
```

### Find technicians with multiple skills
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:5000/api/recommendations?lat=27.7172&lng=85.3240&skills=Electrician,Plumber,AC Repair"
```

## Performance

- Average response time: < 50ms
- Supports up to 100 technicians in consideration set
- Efficient MongoDB geospatial queries
- Optimized for real-time recommendations

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- `400`: Bad Request (missing required parameters)
- `401`: Unauthorized (invalid or missing authentication)
- `500`: Internal Server Error (database or algorithm errors)

## Testing

Use the provided test script to verify the recommendation system:

```bash
npm run test-recommendations
```

This will run comprehensive tests including:
- Location-based recommendations
- City-based recommendations
- Diverse recommendations
- Performance testing
- Edge cases
