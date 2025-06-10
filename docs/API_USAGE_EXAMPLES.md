# API Usage Examples

This document provides practical examples of how to use the Social Media API.

## Table of Contents

- [Authentication](#authentication)
- [User Management](#user-management)
- [Posts](#posts)
- [Comments](#comments)
- [Social Interactions](#social-interactions)
- [Search](#search)
- [Notifications](#notifications)

## Authentication

### Register a New User

```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "johndoe",
    "password": "SecurePass123!@#",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "email": "user@example.com",
    "username": "johndoe",
    "firstName": "John",
    "lastName": "Doe",
    "isEmailVerified": false
  }
}
```

### Login

```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "user@example.com",
    "password": "SecurePass123!@#"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "username": "johndoe"
    }
  }
}
```

### Refresh Access Token

```bash
curl -X POST http://localhost:3000/api/users/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "your-refresh-token"
  }'
```

## User Management

### Get Own Profile

```bash
curl -X GET http://localhost:3000/api/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Update Profile

```bash
curl -X PUT http://localhost:3000/api/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Smith",
    "bio": "Software developer and tech enthusiast"
  }'
```

### Upload Avatar

```bash
curl -X POST http://localhost:3000/api/users/me/avatar \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "avatar=@/path/to/avatar.jpg"
```

### Search Users

```bash
curl -X GET "http://localhost:3000/api/users/search?query=john&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Posts

### Create a Post

```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Just launched my new project! Check it out 🚀",
    "visibility": "public"
  }'
```

### Create Post with Media

```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "content=Excited to share this!" \
  -F "visibility=public" \
  -F "media=@/path/to/image1.jpg" \
  -F "media=@/path/to/image2.jpg"
```

### Get Post by ID

```bash
curl -X GET http://localhost:3000/api/posts/POST_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Posts Feed

```bash
curl -X GET "http://localhost:3000/api/posts/feed?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get All Posts

```bash
curl -X GET "http://localhost:3000/api/posts?page=1&limit=10&sortBy=newest" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Update Post

```bash
curl -X PUT http://localhost:3000/api/posts/POST_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Updated post content"
  }'
```

### Delete Post

```bash
curl -X DELETE http://localhost:3000/api/posts/POST_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Comments

### Create Comment

```bash
curl -X POST http://localhost:3000/api/posts/POST_ID/comments \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Great post! Thanks for sharing."
  }'
```

### Reply to Comment

```bash
curl -X POST http://localhost:3000/api/posts/POST_ID/comments \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "I agree with your point!",
    "parentId": "COMMENT_ID"
  }'
```

### Get Post Comments

```bash
curl -X GET "http://localhost:3000/api/posts/POST_ID/comments?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Update Comment

```bash
curl -X PUT http://localhost:3000/api/comments/COMMENT_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Updated comment text"
  }'
```

### Delete Comment

```bash
curl -X DELETE http://localhost:3000/api/comments/COMMENT_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Social Interactions

### Follow User

```bash
curl -X POST http://localhost:3000/api/social/follow/USER_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Unfollow User

```bash
curl -X DELETE http://localhost:3000/api/social/follow/USER_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Followers

```bash
curl -X GET "http://localhost:3000/api/social/followers/USER_ID?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Following

```bash
curl -X GET "http://localhost:3000/api/social/following/USER_ID?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Like Post

```bash
curl -X POST http://localhost:3000/api/social/posts/POST_ID/like \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Unlike Post

```bash
curl -X DELETE http://localhost:3000/api/social/posts/POST_ID/like \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Toggle Post Like

```bash
curl -X POST http://localhost:3000/api/social/posts/POST_ID/toggle-like \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Block User

```bash
curl -X POST http://localhost:3000/api/users/block \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID"
  }'
```

## Search

### Search Posts

```bash
curl -X GET "http://localhost:3000/api/search/posts?query=technology&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Search Users

```bash
curl -X GET "http://localhost:3000/api/search/users?query=john&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Trending Posts

```bash
curl -X GET "http://localhost:3000/api/search/trending?page=1&limit=20&timeRange=24h" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Notifications

### Get Notifications

```bash
curl -X GET "http://localhost:3000/api/notifications?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Mark Notification as Read

```bash
curl -X PUT http://localhost:3000/api/notifications/NOTIFICATION_ID/read \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Mark All Notifications as Read

```bash
curl -X PUT http://localhost:3000/api/notifications/read-all \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Batch Requests

### Batch Get Posts

```bash
curl -X POST http://localhost:3000/api/batch/posts \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "postIds": ["post-id-1", "post-id-2", "post-id-3"]
  }'
```

### Batch Get Users

```bash
curl -X POST http://localhost:3000/api/batch/users \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": ["user-id-1", "user-id-2", "user-id-3"]
  }'
```

### General Batch Request

```bash
curl -X POST http://localhost:3000/api/batch \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "requests": [
      {
        "method": "GET",
        "path": "/api/posts/POST_ID"
      },
      {
        "method": "GET",
        "path": "/api/users/USER_ID"
      }
    ]
  }'
```

## JavaScript/TypeScript Examples

### Using Fetch API

```javascript
// Login
const login = async (email, password) => {
  const response = await fetch('http://localhost:3000/api/users/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      identifier: email,
      password: password,
    }),
  });
  
  const data = await response.json();
  return data.data.accessToken;
};

// Create Post
const createPost = async (content, accessToken) => {
  const response = await fetch('http://localhost:3000/api/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      content: content,
      visibility: 'public',
    }),
  });
  
  return await response.json();
};
```

### Using Axios

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
});

// Set auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Login
const login = async (email, password) => {
  const { data } = await api.post('/users/login', {
    identifier: email,
    password: password,
  });
  return data.data.accessToken;
};

// Get Feed
const getFeed = async (page = 1, limit = 20) => {
  const { data } = await api.get('/posts/feed', {
    params: { page, limit },
  });
  return data.data;
};
```

## Error Handling

All endpoints return errors in the following format:

```json
{
  "success": false,
  "message": "Error message here"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid or missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `500` - Internal Server Error

