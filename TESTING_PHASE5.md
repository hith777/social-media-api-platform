# Phase 5 Testing Guide: Social Service - Interactions

This guide covers manual testing of all Phase 5 features related to social interactions, follows, likes, and notifications.

## Prerequisites

1. Ensure the server is running: `npm run dev`
2. Have at least 2-3 test user accounts registered and verified
3. Have at least one test post created
4. Install socket.io client for WebSocket testing (optional): `npm install socket.io-client`

## Test Users Setup

Create test users if not already created:
- User 1: testuser1@example.com / Test123!@#
- User 2: testuser2@example.com / Test123!@#
- User 3: testuser3@example.com / Test123!@#

## 1. Follow/Unfollow

### Test 1.1: Follow a User
**Endpoint:** `POST /api/social/follow/:id`  
**Auth:** Required

```bash
# Login as User 1
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"identifier": "testuser1@example.com", "password": "Test123!@#"}'

# Follow User 2 (replace USER2_ID and TOKEN)
curl -X POST http://localhost:3000/api/social/follow/USER2_ID \
  -H "Authorization: Bearer TOKEN"
```

**Expected:** 200 OK with success message

### Test 1.2: Unfollow a User
**Endpoint:** `DELETE /api/social/follow/:id`  
**Auth:** Required

```bash
# Unfollow User 2 (replace USER2_ID and TOKEN)
curl -X DELETE http://localhost:3000/api/social/follow/USER2_ID \
  -H "Authorization: Bearer TOKEN"
```

**Expected:** 200 OK with success message

### Test 1.3: Validation Tests
- Self-follow: Should return 400
- Duplicate follow: Should return 400
- Unfollow when not following: Should return 404
- Non-existent user: Should return 404
- Without authentication: Should return 401
- Blocked user: Should return 403

## 2. Followers/Following Lists

### Test 2.1: Get Followers
**Endpoint:** `GET /api/social/followers/:id`  
**Auth:** Optional

```bash
# Get followers (replace USER_ID)
curl -X GET http://localhost:3000/api/social/followers/USER_ID

# With pagination
curl -X GET "http://localhost:3000/api/social/followers/USER_ID?page=1&limit=10"
```

**Expected:** 200 OK with:
- `followers` array with user info (id, username, firstName, lastName, avatar, bio)
- `followedAt` timestamp
- Pagination metadata: `total`, `page`, `limit`, `totalPages`

### Test 2.2: Get Following List
**Endpoint:** `GET /api/social/following/:id`  
**Auth:** Optional

```bash
# Get following list (replace USER_ID)
curl -X GET http://localhost:3000/api/social/following/USER_ID
```

**Expected:** 200 OK with similar structure as followers

### Test 2.3: Pagination
**Endpoint:** `GET /api/social/followers/:id?page=1&limit=5`

**Expected:** Returns only 5 followers per page

## 3. Post Likes

### Test 3.1: Like a Post
**Endpoint:** `POST /api/social/posts/:id/like`  
**Auth:** Required

```bash
# Like post (replace POST_ID and TOKEN)
curl -X POST http://localhost:3000/api/social/posts/POST_ID/like \
  -H "Authorization: Bearer TOKEN"
```

**Expected:** 200 OK with success message

### Test 3.2: Unlike a Post
**Endpoint:** `DELETE /api/social/posts/:id/like`  
**Auth:** Required

```bash
# Unlike post (replace POST_ID and TOKEN)
curl -X DELETE http://localhost:3000/api/social/posts/POST_ID/like \
  -H "Authorization: Bearer TOKEN"
```

**Expected:** 200 OK with success message

### Test 3.3: Toggle Post Like
**Endpoint:** `POST /api/social/posts/:id/toggle-like`  
**Auth:** Required

```bash
# Toggle like (replace POST_ID and TOKEN)
curl -X POST http://localhost:3000/api/social/posts/POST_ID/toggle-like \
  -H "Authorization: Bearer TOKEN"
```

**Expected:** 200 OK with `{ liked: true }` or `{ liked: false }`

**Test Flow:**
1. First call: Should like (liked: true)
2. Second call: Should unlike (liked: false)
3. Third call: Should like again (liked: true)

### Test 3.4: Validation Tests
- Like already liked post: Should return 400
- Unlike not liked post: Should return 400
- Non-existent post: Should return 404
- Without authentication: Should return 401

## 4. Like Counts on Posts

### Test 4.1: Verify Like Count in Post Response
**Endpoint:** `GET /api/posts/:id`

```bash
# Get post (replace POST_ID)
curl -X GET http://localhost:3000/api/posts/POST_ID \
  -H "Authorization: Bearer TOKEN"
```

**Expected:** Response includes:
- `_count.likes`: Number of likes
- `isLiked`: Boolean flag (for authenticated users)

### Test 4.2: Like Count Updates
1. Get post and note like count
2. Like the post
3. Get post again
4. **Expected:** Like count should be incremented

### Test 4.3: isLiked Flag
1. Like a post as User 1
2. Get post as User 1: `isLiked` should be `true`
3. Get post as User 2: `isLiked` should be `false`

## 5. Notifications

### Test 5.1: Get Notifications
**Endpoint:** `GET /api/notifications`  
**Auth:** Required

```bash
# Get notifications (replace TOKEN)
curl -X GET http://localhost:3000/api/notifications \
  -H "Authorization: Bearer TOKEN"

# With pagination
curl -X GET "http://localhost:3000/api/notifications?page=1&limit=10" \
  -H "Authorization: Bearer TOKEN"

# Unread only
curl -X GET "http://localhost:3000/api/notifications?unreadOnly=true" \
  -H "Authorization: Bearer TOKEN"
```

**Expected:** 200 OK with:
- `notifications` array
- `total` count
- `unreadCount` count
- Pagination metadata

### Test 5.2: Get Unread Count
**Endpoint:** `GET /api/notifications/unread-count`  
**Auth:** Required

```bash
# Get unread count (replace TOKEN)
curl -X GET http://localhost:3000/api/notifications/unread-count \
  -H "Authorization: Bearer TOKEN"
```

**Expected:** 200 OK with `{ unreadCount: number }`

### Test 5.3: Mark Notification as Read
**Endpoint:** `PUT /api/notifications/:id/read`  
**Auth:** Required

```bash
# Mark as read (replace NOTIFICATION_ID and TOKEN)
curl -X PUT http://localhost:3000/api/notifications/NOTIFICATION_ID/read \
  -H "Authorization: Bearer TOKEN"
```

**Expected:** 200 OK with success message

**Verify:** Notification `isRead` should be `true`

### Test 5.4: Mark All as Read
**Endpoint:** `PUT /api/notifications/read-all`  
**Auth:** Required

```bash
# Mark all as read (replace TOKEN)
curl -X PUT http://localhost:3000/api/notifications/read-all \
  -H "Authorization: Bearer TOKEN"
```

**Expected:** 200 OK with success message

**Verify:** All user's notifications should have `isRead: true`

### Test 5.5: Delete Notification
**Endpoint:** `DELETE /api/notifications/:id`  
**Auth:** Required

```bash
# Delete notification (replace NOTIFICATION_ID and TOKEN)
curl -X DELETE http://localhost:3000/api/notifications/NOTIFICATION_ID \
  -H "Authorization: Bearer TOKEN"
```

**Expected:** 200 OK with success message

**Verify:** Notification should be deleted from database

### Test 5.6: Validation Tests
- Access other user's notification: Should return 404
- Non-existent notification: Should return 404
- Without authentication: Should return 401

## 6. Real-Time Notifications (WebSocket)

### Test 6.1: Connect to WebSocket
**Connection:** `ws://localhost:3000/socket.io`

**Authentication:** Pass JWT token in connection:
```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'YOUR_ACCESS_TOKEN'
  }
});
```

**Expected:** Connection established, user joins `user:USER_ID` room

### Test 6.2: Receive Real-Time Notification
1. Connect to WebSocket as User 1
2. Create a notification for User 1 (via API or service)
3. **Expected:** Should receive `notification` event with notification data

### Test 6.3: WebSocket Authentication
- Connect without token: Should be rejected
- Connect with invalid token: Should be rejected
- Connect with expired token: Should be rejected

### Test 6.4: Multiple Connections
1. Connect to WebSocket from multiple clients as same user
2. Send notification to that user
3. **Expected:** All connected clients should receive the notification

### Test 6.5: Connection Health
- Send `ping` event
- **Expected:** Should receive `pong` response

## 7. Integration Tests

### Test 7.1: Follow Flow with Notifications
1. User 1 follows User 2
2. **Expected:** User 2 should receive a notification (if implemented)
3. User 2 checks notifications
4. **Expected:** Should see "User 1 started following you" notification

### Test 7.2: Like Flow with Notifications
1. User 1 likes User 2's post
2. **Expected:** User 2 should receive a notification (if implemented)
3. User 2 checks notifications
4. **Expected:** Should see "User 1 liked your post" notification

### Test 7.3: Comment Flow with Notifications
1. User 1 comments on User 2's post
2. **Expected:** User 2 should receive a notification (if implemented)
3. User 1 replies to User 1's comment
4. **Expected:** User 1 should receive a reply notification (if implemented)

### Test 7.4: Full Social Interaction Flow
1. User 1 creates a post
2. User 2 follows User 1
3. User 2 likes User 1's post
4. User 3 comments on User 1's post
5. User 1 checks notifications
6. **Expected:** Should see notifications for follow, like, and comment

## 8. Edge Cases

### Test 8.1: Blocked Users
1. User 1 blocks User 2
2. User 2 tries to follow User 1
3. **Expected:** Should return 403 Forbidden

### Test 8.2: Deleted Users
1. Delete a user (soft delete)
2. Try to follow that user
3. **Expected:** Should return 404 Not Found

### Test 8.3: Deleted Posts
1. Delete a post (soft delete)
2. Try to like that post
3. **Expected:** Should return 404 Not Found

### Test 8.4: Pagination Edge Cases
1. Create exactly 20 followers
2. Get page 1 with limit 10: Should return 10, totalPages = 2
3. Get page 2 with limit 10: Should return 10
4. Get page 3 with limit 10: Should return empty array

## Automated Testing

To run automated tests (after installing dependencies):

```bash
# Install dependencies if not already installed
npm install

# Run Phase 5 tests
npm test -- tests/phase5.test.ts
```

## Test Checklist

- [ ] Follow a user
- [ ] Unfollow a user
- [ ] Cannot follow yourself
- [ ] Cannot duplicate follow
- [ ] Get followers list with pagination
- [ ] Get following list with pagination
- [ ] Like a post
- [ ] Unlike a post
- [ ] Toggle post like
- [ ] Like counts included in post responses
- [ ] isLiked flag works correctly
- [ ] Get notifications with pagination
- [ ] Filter unread notifications
- [ ] Get unread count
- [ ] Mark notification as read
- [ ] Mark all notifications as read
- [ ] Delete notification
- [ ] Cannot access other user's notifications
- [ ] WebSocket connection with authentication
- [ ] Receive real-time notifications via WebSocket
- [ ] Multiple WebSocket connections per user
- [ ] Blocked users cannot follow
- [ ] Deleted users cannot be followed
- [ ] Authentication required for all write operations
- [ ] Optional authentication for read operations

## Notes

- All follow operations respect blocking relationships
- Like operations use unique constraints to prevent duplicates
- Notifications are user-specific and require ownership verification
- WebSocket connections require valid JWT authentication
- Real-time notifications are emitted to user-specific rooms
- All social interactions can trigger notifications (when integrated)

