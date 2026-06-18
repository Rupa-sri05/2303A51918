# Notification System Design

## Stage 1

### REST API Endpoints

#### 1. Get All Notifications
- **GET** `/api/notifications`
- **Headers:** `Authorization: Bearer <token>`
- **Response:**
```json
{
  "notifications": [
    {
      "id": "uuid",
      "type": "Placement | Event | Result",
      "message": "string",
      "timestamp": "2026-04-22T17:51:30Z",
      "isRead": false
    }
  ]
}
```

#### 2. Get Unread Notifications
- **GET** `/api/notifications/unread`
- **Headers:** `Authorization: Bearer <token>`
- **Response:**
```json
{
  "notifications": []
}
```

#### 3. Mark Notification as Read
- **PATCH** `/api/notifications/:id/read`
- **Headers:** `Authorization: Bearer <token>`
- **Response:**
```json
{
  "message": "Notification marked as read"
}
```

#### 4. Get Notifications by Type
- **GET** `/api/notifications?type=Placement`
- **Headers:** `Authorization: Bearer <token>`

### Real-time Notifications
Use **WebSockets** (Socket.io) for real-time delivery. Server emits events to connected clients when new notifications arrive.

---

## Stage 2

### Database Choice: PostgreSQL

**Reason:** Structured data, complex queries, ACID compliance needed for reliable notification delivery.

### DB Schema:
```sql
CREATE TABLE students (
  id UUID PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES students(id),
  type notification_type,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TYPE notification_type AS ENUM ('Placement', 'Event', 'Result');
```

### Scaling Problems & Solutions:
- **Problem:** Table grows too large → **Solution:** Partition by date
- **Problem:** Slow queries → **Solution:** Add indexes on student_id, is_read
- **Problem:** High write load → **Solution:** Use connection pooling (pgBouncer)

### Queries:
```sql
-- Get unread notifications for a student
SELECT * FROM notifications
WHERE student_id = 'uuid' AND is_read = false
ORDER BY created_at DESC;

-- Get placement notifications
SELECT * FROM notifications
WHERE student_id = 'uuid' AND type = 'Placement'
ORDER BY created_at DESC;
```

---

## Stage 3

### Query Analysis:
```sql
SELECT * FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt DESC;
```

**Problems:**
- `SELECT *` fetches all columns — wasteful
- No index on `studentID` or `isRead` — full table scan on 5M rows
- Slow for large datasets

**Fix:**
```sql
SELECT id, type, message, created_at FROM notifications
WHERE student_id = 1042 AND is_read = false
ORDER BY created_at DESC;
```

**Indexes to add:**
```sql
CREATE INDEX idx_student_unread ON notifications(student_id, is_read);
CREATE INDEX idx_created_at ON notifications(created_at DESC);
```

**Adding index on every column is NOT effective** — it slows down writes and wastes storage. Only index columns used in WHERE/ORDER BY.

**Query for placement notifications in last 7 days:**
```sql
SELECT id, message, created_at FROM notifications
WHERE type = 'Placement'
AND created_at >= NOW() - INTERVAL '7 days';
```

---

## Stage 4

### Problem: DB overloaded on every page load

### Solutions:

#### 1. Redis Caching (Recommended)
- Cache notifications per student for 60 seconds
- On page load → check cache first → if miss → query DB → store in cache
- **Tradeoff:** Slight staleness (max 60s delay for new notifications)

#### 2. Pagination
- Don't load all notifications at once
- Load 20 at a time with infinite scroll
- **Tradeoff:** More API calls but lighter DB load

#### 3. WebSocket Push (Best for real-time)
- Don't fetch on page load at all
- Push new notifications to client via WebSocket
- **Tradeoff:** More complex infrastructure

**Best approach:** Redis cache + Pagination together

---

## Stage 5

### Problems with current notify_all():
- Sequential loop — sending 50,000 emails one by one is extremely slow
- If send_email fails midway (e.g. at student 200), remaining students are skipped
- No retry mechanism
- No error handling

### Redesigned Pseudocode:
### Should saving to DB and sending email happen together?
**No** — they should be independent async operations. If email fails, DB save should still succeed so we have a record. Use a message queue with retry logic for email failures.

---

## Stage 6

### Priority Inbox Approach:
- Weight: Placement=3, Result=2, Event=1
- Score = weight * 1000 + timestamp (newer = higher score)
- Sort descending, take top N
- For efficiency with new notifications: use a **Max-Heap** data structure
- Heap maintains top 10 automatically as new notifications arrive — O(log n) per insert

### Maintaining top 10 efficiently:
Use a min-heap of size 10. For each new notification, if its score > heap minimum, replace minimum and re-heapify. This gives O(log 10) = O(1) effectively.