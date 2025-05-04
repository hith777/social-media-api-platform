# Phase 2 Testing Guide - Authentication & User Service

## Overview
Phase 2 includes 12 commits covering authentication and user management features. This document outlines how to test each feature.

## Prerequisites

1. **Database Setup**
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

2. **Start Server**
   ```bash
   npm run dev
   ```

3. **Tools for Testing**
   - Postman, Insomnia, or curl
   - Or use the provided test script

## Test Checklist

### ✅ 1. User Registration (Commit 18)

**Endpoint:** `POST /api/users/register`

**Request:**
```json
{
  "email": "test@example.com",
  "username": "testuser",
  "password": "Test123!@#",
  "firstName": "Test",
  "lastName": "User"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "...",
    "email": "test@example.com",
    "username": "testuser",
    "firstName": "Test",
    "lastName": "User",
    "isEmailVerified": false,
    ...
  }
}
```

**Test Cases:**
- [ ] Valid registration succeeds
- [ ] Duplicate email returns 409
- [ ] Duplicate username returns 409
- [ ] Weak password returns 400 with validation errors
- [ ] Invalid email format returns 400
- [ ] Rate limiting works (try 6+ requests quickly)

---

### ✅ 2. Login with Refresh Tokens (Commit 20)

**Endpoint:** `POST /api/users/login`

**Request:**
```json
{
  "identifier": "test@example.com",
  "password": "Test123!@#"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

**Test Cases:**
- [ ] Login with email succeeds
- [ ] Login with username succeeds
- [ ] Invalid credentials return 401
- [ ] Inactive user returns 403
- [ ] Rate limiting works
- [ ] Access token is valid JWT
- [ ] Refresh token is valid JWT

**Save tokens for next tests!**

---

### ✅ 3. Refresh Token (Commit 20)

**Endpoint:** `POST /api/users/refresh-token`

**Request:**
```json
{
  "refreshToken": "<refresh_token_from_login>"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

**Test Cases:**
- [ ] Valid refresh token returns new tokens
- [ ] Invalid refresh token returns 401
- [ ] Expired refresh token returns 401

---

### ✅ 4. JWT Authentication (Commit 19)

**Test with Protected Endpoint:** `GET /api/users/me`

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "email": "test@example.com",
    "username": "testuser",
    ...
  }
}
```

**Test Cases:**
- [ ] Valid token allows access
- [ ] Missing token returns 401
- [ ] Invalid token returns 401
- [ ] Expired token returns 401
- [ ] User info is attached to request

---

### ✅ 5. Get Own Profile (Commit 21)

**Endpoint:** `GET /api/users/me`

**Headers:** `Authorization: Bearer <token>`

**Test Cases:**
- [ ] Returns current user's profile with email
- [ ] Includes all profile fields
- [ ] Requires authentication

---

### ✅ 6. Update Own Profile (Commit 21)

**Endpoint:** `PUT /api/users/me`

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "firstName": "Updated",
  "lastName": "Name",
  "bio": "This is my bio"
}
```

**Test Cases:**
- [ ] Update firstName succeeds
- [ ] Update lastName succeeds
- [ ] Update bio succeeds
- [ ] Partial updates work
- [ ] Returns updated user data
- [ ] Requires authentication

---

### ✅ 7. Get Public Profile (Commit 21)

**Endpoint:** `GET /api/users/:id`

**Test Cases:**
- [ ] Returns user profile without email
- [ ] Valid user ID returns profile
- [ ] Invalid user ID returns 404
- [ ] No authentication required

---

### ✅ 8. Email Verification (Commit 22)

**Step 1: Check logs for verification token**
After registration, check server logs for verification URL.

**Step 2: Verify Email**
**Endpoint:** `POST /api/users/verify-email`

**Request:**
```json
{
  "token": "<token_from_logs>"
}
```

**Test Cases:**
- [ ] Valid token verifies email
- [ ] Invalid token returns 400
- [ ] Already verified returns 400
- [ ] EmailVerifiedAt is set after verification

**Step 3: Resend Verification**
**Endpoint:** `POST /api/users/resend-verification`

**Headers:** `Authorization: Bearer <token>`

**Test Cases:**
- [ ] Resends verification email
- [ ] Already verified returns 400
- [ ] Requires authentication

---

### ✅ 9. Password Reset (Commit 23)

**Step 1: Request Password Reset**
**Endpoint:** `POST /api/users/forgot-password`

**Request:**
```json
{
  "email": "test@example.com"
}
```

**Test Cases:**
- [ ] Returns success (even if email doesn't exist)
- [ ] Check logs for reset token
- [ ] Rate limiting works

**Step 2: Reset Password**
**Endpoint:** `POST /api/users/reset-password`

**Request:**
```json
{
  "token": "<token_from_logs>",
  "password": "NewPass123!@#"
}
```

**Test Cases:**
- [ ] Valid token resets password
- [ ] Invalid token returns 400
- [ ] Expired token returns 400
- [ ] Weak password returns 400
- [ ] Can login with new password

---

### ✅ 10. Avatar Upload (Commit 24)

**Endpoint:** `POST /api/users/me/avatar`

**Headers:** 
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body:** Form data with `avatar` field (image file)

**Test Cases:**
- [ ] Upload JPEG image succeeds
- [ ] Upload PNG image succeeds
- [ ] Upload GIF image succeeds
- [ ] Upload WebP image succeeds
- [ ] Non-image file returns 400
- [ ] File too large returns 400
- [ ] Old avatar is deleted
- [ ] Avatar path is stored in database
- [ ] Avatar is accessible via URL: `/uploads/avatars/<filename>`
- [ ] Requires authentication

---

### ✅ 11. User Search (Commit 25)

**Endpoint:** `GET /api/users/search?query=test&page=1&limit=10`

**Test Cases:**
- [ ] Search by username works
- [ ] Search by first name works
- [ ] Search by last name works
- [ ] Case-insensitive search works
- [ ] Pagination works (page, limit)
- [ ] Returns pagination metadata
- [ ] Excludes inactive/deleted users
- [ ] Excludes email from results
- [ ] No authentication required

---

### ✅ 12. Block User (Commit 26)

**Step 1: Block User**
**Endpoint:** `POST /api/users/block`

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "userId": "<user_id_to_block>"
}
```

**Test Cases:**
- [ ] Blocking user succeeds
- [ ] Cannot block yourself (400)
- [ ] Blocking non-existent user returns 404
- [ ] Blocking already blocked user returns 409
- [ ] Requires authentication

**Step 2: Get Blocked Users**
**Endpoint:** `GET /api/users/blocked?page=1&limit=10`

**Test Cases:**
- [ ] Returns list of blocked users
- [ ] Pagination works
- [ ] Excludes sensitive fields
- [ ] Requires authentication

**Step 3: Unblock User**
**Endpoint:** `POST /api/users/unblock`

**Request:**
```json
{
  "userId": "<user_id_to_unblock>"
}
```

**Test Cases:**
- [ ] Unblocking succeeds
- [ ] Unblocking non-blocked user returns 404
- [ ] Requires authentication

---

### ✅ 13. Soft Delete Account (Commit 27)

**Endpoint:** `DELETE /api/users/me`

**Headers:** `Authorization: Bearer <token>`

**Test Cases:**
- [ ] Account deletion succeeds
- [ ] deletedAt is set
- [ ] isActive is set to false
- [ ] Refresh token is invalidated
- [ ] Blocks are removed
- [ ] Cannot login after deletion
- [ ] Cannot delete already deleted account
- [ ] Requires authentication

---

## Automated Testing Script

Run the automated test suite:

```bash
npm test -- tests/phase2.test.ts
```

## Manual Testing with curl

### 1. Register User
```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "Test123!@#",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "test@example.com",
    "password": "Test123!@#"
  }'
```

### 3. Get Profile (replace TOKEN)
```bash
curl -X GET http://localhost:3000/api/users/me \
  -H "Authorization: Bearer TOKEN"
```

### 4. Update Profile
```bash
curl -X PUT http://localhost:3000/api/users/me \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Updated",
    "bio": "New bio"
  }'
```

### 5. Search Users
```bash
curl -X GET "http://localhost:3000/api/users/search?query=test&page=1&limit=10"
```

## Common Issues

### Issue: "User not found" errors
**Solution:** Make sure you're using the correct user ID from registration response

### Issue: "Invalid token" errors
**Solution:** 
- Check if token is expired
- Ensure Bearer prefix is included: `Bearer <token>`
- Use fresh token from login/refresh

### Issue: "Email already registered"
**Solution:** Use a different email or delete the test user from database

### Issue: Avatar upload fails
**Solution:**
- Check file size (max 5MB default)
- Ensure file is an image (JPEG, PNG, GIF, WebP)
- Check uploads directory exists

## Success Criteria

All Phase 2 features should:
- ✅ Return appropriate HTTP status codes
- ✅ Validate input data correctly
- ✅ Handle errors gracefully
- ✅ Require authentication where needed
- ✅ Respect rate limits
- ✅ Follow RESTful conventions

## Next Steps

After Phase 2 testing is complete:
1. Fix any issues found
2. Document any edge cases discovered
3. Proceed to Phase 3: Content Service - Posts


