import request from 'supertest';
import app from '../src/index';
import prisma from '../src/config/database';
import { hashPassword } from '../src/utils/password';

describe('Phase 4: Content Service - Comments', () => {
  let testUser1: any;
  let testUser2: any;
  let testUser3: any;
  let accessToken1: string;
  let accessToken2: string;
  let accessToken3: string;
  let testPost1: any;
  let testPost2: any;
  let testComment1: any;

  beforeAll(async () => {
    // Clean up test data
    await prisma.like.deleteMany({
      where: {
        OR: [
          { comment: { post: { author: { email: { in: ['testuser1@example.com', 'testuser2@example.com', 'testuser3@example.com'] } } } } },
          { userId: { in: ['testuser1', 'testuser2', 'testuser3'].map((u) => u) } },
        ],
      },
    });
    await prisma.comment.deleteMany({
      where: {
        post: {
          author: {
            email: {
              in: ['testuser1@example.com', 'testuser2@example.com', 'testuser3@example.com'],
            },
          },
        },
      },
    });
    await prisma.post.deleteMany({
      where: {
        author: {
          email: {
            in: ['testuser1@example.com', 'testuser2@example.com', 'testuser3@example.com'],
          },
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['testuser1@example.com', 'testuser2@example.com', 'testuser3@example.com'],
        },
      },
    });

    // Create test users
    const hashedPassword = await hashPassword('Test123!@#');

    testUser1 = await prisma.user.create({
      data: {
        email: 'testuser1@example.com',
        username: 'testuser1',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User1',
        isEmailVerified: true,
      },
    });

    testUser2 = await prisma.user.create({
      data: {
        email: 'testuser2@example.com',
        username: 'testuser2',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User2',
        isEmailVerified: true,
      },
    });

    testUser3 = await prisma.user.create({
      data: {
        email: 'testuser3@example.com',
        username: 'testuser3',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User3',
        isEmailVerified: true,
      },
    });

    // Login users to get tokens
    const login1 = await request(app).post('/api/users/login').send({
      identifier: 'testuser1@example.com',
      password: 'Test123!@#',
    });
    accessToken1 = login1.body.data.accessToken;

    const login2 = await request(app).post('/api/users/login').send({
      identifier: 'testuser2@example.com',
      password: 'Test123!@#',
    });
    accessToken2 = login2.body.data.accessToken;

    const login3 = await request(app).post('/api/users/login').send({
      identifier: 'testuser3@example.com',
      password: 'Test123!@#',
    });
    accessToken3 = login3.body.data.accessToken;

    // Create test posts
    testPost1 = await prisma.post.create({
      data: {
        content: 'This is a test post for comments',
        authorId: testUser1.id,
        visibility: 'public',
      },
    });

    testPost2 = await prisma.post.create({
      data: {
        content: 'Another test post for comments',
        authorId: testUser2.id,
        visibility: 'public',
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.like.deleteMany({
      where: {
        OR: [
          { comment: { post: { author: { email: { in: ['testuser1@example.com', 'testuser2@example.com', 'testuser3@example.com'] } } } } },
          { userId: { in: [testUser1.id, testUser2.id, testUser3.id] } },
        ],
      },
    });
    await prisma.comment.deleteMany({
      where: {
        post: {
          author: {
            email: {
              in: ['testuser1@example.com', 'testuser2@example.com', 'testuser3@example.com'],
            },
          },
        },
      },
    });
    await prisma.post.deleteMany({
      where: {
        author: {
          email: {
            in: ['testuser1@example.com', 'testuser2@example.com', 'testuser3@example.com'],
          },
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['testuser1@example.com', 'testuser2@example.com', 'testuser3@example.com'],
        },
      },
    });
  });

  describe('Comment Creation', () => {
    it('should create a comment on a post', async () => {
      const response = await request(app)
        .post(`/api/posts/${testPost1.id}/comments`)
        .set('Authorization', `Bearer ${accessToken2}`)
        .send({
          content: 'This is a test comment',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe('This is a test comment');
      expect(response.body.data.postId).toBe(testPost1.id);
      expect(response.body.data.authorId).toBe(testUser2.id);
      expect(response.body.data.parentId).toBeNull();
      expect(response.body.data.author).toBeDefined();
      expect(response.body.data._count).toBeDefined();

      testComment1 = response.body.data;
    });

    it('should create a nested comment (reply)', async () => {
      const response = await request(app)
        .post(`/api/posts/${testPost1.id}/comments`)
        .set('Authorization', `Bearer ${accessToken3}`)
        .send({
          content: 'This is a reply to the comment',
          parentId: testComment1.id,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe('This is a reply to the comment');
      expect(response.body.data.parentId).toBe(testComment1.id);
      expect(response.body.data.authorId).toBe(testUser3.id);
    });

    it('should reject empty comment content', async () => {
      const response = await request(app)
        .post(`/api/posts/${testPost1.id}/comments`)
        .set('Authorization', `Bearer ${accessToken2}`)
        .send({
          content: '   ',
        });

      expect(response.status).toBe(400);
    });

    it('should reject comment content exceeding 2000 characters', async () => {
      const longContent = 'a'.repeat(2001);
      const response = await request(app)
        .post(`/api/posts/${testPost1.id}/comments`)
        .set('Authorization', `Bearer ${accessToken2}`)
        .send({
          content: longContent,
        });

      expect(response.status).toBe(400);
    });

    it('should reject comment on non-existent post', async () => {
      const response = await request(app)
        .post('/api/posts/nonexistent/comments')
        .set('Authorization', `Bearer ${accessToken2}`)
        .send({
          content: 'This comment should fail',
        });

      expect(response.status).toBe(404);
    });

    it('should reject reply to non-existent parent comment', async () => {
      const response = await request(app)
        .post(`/api/posts/${testPost1.id}/comments`)
        .set('Authorization', `Bearer ${accessToken2}`)
        .send({
          content: 'This reply should fail',
          parentId: 'nonexistent',
        });

      expect(response.status).toBe(404);
    });

    it('should require authentication to create comment', async () => {
      const response = await request(app)
        .post(`/api/posts/${testPost1.id}/comments`)
        .send({
          content: 'This should fail',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('Get Comments for Post', () => {
    it('should get comments for a post with nested replies', async () => {
      const response = await request(app)
        .get(`/api/posts/${testPost1.id}/comments`)
        .set('Authorization', `Bearer ${accessToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.comments).toBeDefined();
      expect(response.body.data.total).toBeGreaterThan(0);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.limit).toBe(10); // Default from pagination schema
      expect(response.body.data.totalPages).toBeDefined();

      // Check if nested replies are included
      const comment = response.body.data.comments.find((c: any) => c.id === testComment1.id);
      expect(comment).toBeDefined();
      expect(comment.replies).toBeDefined();
      expect(Array.isArray(comment.replies)).toBe(true);
      expect(comment.repliesCount).toBeDefined();
      expect(comment.hasMoreReplies).toBeDefined();
    });

    it('should support pagination for comments', async () => {
      const response = await request(app)
        .get(`/api/posts/${testPost1.id}/comments?page=1&limit=1`)
        .set('Authorization', `Bearer ${accessToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.data.comments.length).toBeLessThanOrEqual(1);
      expect(response.body.data.limit).toBe(1);
    });

    it('should work without authentication', async () => {
      const response = await request(app).get(`/api/posts/${testPost1.id}/comments`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 for non-existent post', async () => {
      const response = await request(app).get('/api/posts/nonexistent/comments');

      expect(response.status).toBe(404);
    });
  });

  describe('Get Comment Replies', () => {
    it('should get paginated replies for a comment', async () => {
      const response = await request(app)
        .get(`/api/comments/${testComment1.id}/replies`)
        .set('Authorization', `Bearer ${accessToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.replies).toBeDefined();
      expect(Array.isArray(response.body.data.replies)).toBe(true);
      expect(response.body.data.total).toBeGreaterThanOrEqual(0);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.limit).toBe(10);
      expect(response.body.data.totalPages).toBeDefined();
    });

    it('should support pagination for replies', async () => {
      const response = await request(app)
        .get(`/api/comments/${testComment1.id}/replies?page=1&limit=5`)
        .set('Authorization', `Bearer ${accessToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.data.limit).toBe(5);
    });

    it('should work without authentication', async () => {
      const response = await request(app).get(`/api/comments/${testComment1.id}/replies`);

      expect(response.status).toBe(200);
    });

    it('should return 404 for non-existent comment', async () => {
      const response = await request(app).get('/api/comments/nonexistent/replies');

      expect(response.status).toBe(404);
    });
  });

  describe('Update Comment', () => {
    it('should update own comment', async () => {
      const response = await request(app)
        .put(`/api/comments/${testComment1.id}`)
        .set('Authorization', `Bearer ${accessToken2}`)
        .send({
          content: 'Updated comment content',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe('Updated comment content');
    });

    it('should reject updating someone else comment', async () => {
      const response = await request(app)
        .put(`/api/comments/${testComment1.id}`)
        .set('Authorization', `Bearer ${accessToken3}`)
        .send({
          content: 'Trying to update someone else comment',
        });

      expect(response.status).toBe(403);
    });

    it('should reject empty content', async () => {
      const response = await request(app)
        .put(`/api/comments/${testComment1.id}`)
        .set('Authorization', `Bearer ${accessToken2}`)
        .send({
          content: '   ',
        });

      expect(response.status).toBe(400);
    });

    it('should reject content exceeding 2000 characters', async () => {
      const longContent = 'a'.repeat(2001);
      const response = await request(app)
        .put(`/api/comments/${testComment1.id}`)
        .set('Authorization', `Bearer ${accessToken2}`)
        .send({
          content: longContent,
        });

      expect(response.status).toBe(400);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .put(`/api/comments/${testComment1.id}`)
        .send({
          content: 'This should fail',
        });

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent comment', async () => {
      const response = await request(app)
        .put('/api/comments/nonexistent')
        .set('Authorization', `Bearer ${accessToken2}`)
        .send({
          content: 'This should fail',
        });

      expect(response.status).toBe(404);
    });
  });

  describe('Delete Comment', () => {
    it('should delete own comment', async () => {
      // Create a comment to delete
      const createResponse = await request(app)
        .post(`/api/posts/${testPost2.id}/comments`)
        .set('Authorization', `Bearer ${accessToken1}`)
        .send({
          content: 'Comment to be deleted',
        });

      const commentId = createResponse.body.data.id;

      const response = await request(app)
        .delete(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${accessToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify comment is soft deleted
      const deletedComment = await prisma.comment.findUnique({
        where: { id: commentId },
      });
      expect(deletedComment?.isDeleted).toBe(true);
      expect(deletedComment?.deletedAt).toBeDefined();
    });

    it('should reject deleting someone else comment', async () => {
      const createResponse = await request(app)
        .post(`/api/posts/${testPost2.id}/comments`)
        .set('Authorization', `Bearer ${accessToken2}`)
        .send({
          content: 'Comment to test deletion',
        });

      const commentId = createResponse.body.data.id;

      const response = await request(app)
        .delete(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${accessToken3}`);

      expect(response.status).toBe(403);
    });

    it('should require authentication', async () => {
      const response = await request(app).delete(`/api/comments/${testComment1.id}`);

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent comment', async () => {
      const response = await request(app)
        .delete('/api/comments/nonexistent')
        .set('Authorization', `Bearer ${accessToken1}`);

      expect(response.status).toBe(404);
    });
  });

  describe('Comment Reactions (Likes)', () => {
    let testCommentForLikes: any;

    beforeAll(async () => {
      // Create a comment for testing likes
      const createResponse = await request(app)
        .post(`/api/posts/${testPost1.id}/comments`)
        .set('Authorization', `Bearer ${accessToken1}`)
        .send({
          content: 'Comment for testing likes',
        });
      testCommentForLikes = createResponse.body.data;
    });

    it('should like a comment', async () => {
      const response = await request(app)
        .post(`/api/comments/${testCommentForLikes.id}/like`)
        .set('Authorization', `Bearer ${accessToken2}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('liked');
    });

    it('should reject liking already liked comment', async () => {
      const response = await request(app)
        .post(`/api/comments/${testCommentForLikes.id}/like`)
        .set('Authorization', `Bearer ${accessToken2}`);

      expect(response.status).toBe(400);
    });

    it('should unlike a comment', async () => {
      const response = await request(app)
        .delete(`/api/comments/${testCommentForLikes.id}/like`)
        .set('Authorization', `Bearer ${accessToken2}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('unliked');
    });

    it('should reject unliking not liked comment', async () => {
      const response = await request(app)
        .delete(`/api/comments/${testCommentForLikes.id}/like`)
        .set('Authorization', `Bearer ${accessToken2}`);

      expect(response.status).toBe(400);
    });

    it('should toggle comment like', async () => {
      // First toggle - should like
      const likeResponse = await request(app)
        .post(`/api/comments/${testCommentForLikes.id}/toggle-like`)
        .set('Authorization', `Bearer ${accessToken3}`);

      expect(likeResponse.status).toBe(200);
      expect(likeResponse.body.success).toBe(true);
      expect(likeResponse.body.data.liked).toBe(true);

      // Second toggle - should unlike
      const unlikeResponse = await request(app)
        .post(`/api/comments/${testCommentForLikes.id}/toggle-like`)
        .set('Authorization', `Bearer ${accessToken3}`);

      expect(unlikeResponse.status).toBe(200);
      expect(unlikeResponse.body.success).toBe(true);
      expect(unlikeResponse.body.data.liked).toBe(false);
    });

    it('should show isLiked flag for authenticated users', async () => {
      // Like the comment first
      await request(app)
        .post(`/api/comments/${testCommentForLikes.id}/like`)
        .set('Authorization', `Bearer ${accessToken1}`);

      // Get comments and check isLiked flag
      const response = await request(app)
        .get(`/api/posts/${testPost1.id}/comments`)
        .set('Authorization', `Bearer ${accessToken1}`);

      expect(response.status).toBe(200);
      const comment = response.body.data.comments.find(
        (c: any) => c.id === testCommentForLikes.id
      );
      expect(comment).toBeDefined();
      expect(comment.isLiked).toBe(true);
    });

    it('should require authentication to like comment', async () => {
      const response = await request(app).post(`/api/comments/${testCommentForLikes.id}/like`);

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent comment when liking', async () => {
      const response = await request(app)
        .post('/api/comments/nonexistent/like')
        .set('Authorization', `Bearer ${accessToken1}`);

      expect(response.status).toBe(404);
    });
  });

  describe('Edge Cases', () => {
    it('should handle comments on deleted posts', async () => {
      // Create a post and comment
      const post = await prisma.post.create({
        data: {
          content: 'Post to be deleted',
          authorId: testUser1.id,
          visibility: 'public',
        },
      });

      await prisma.comment.create({
        data: {
          content: 'Comment on post to be deleted',
          postId: post.id,
          authorId: testUser2.id,
        },
      });

      // Delete the post
      await prisma.post.update({
        where: { id: post.id },
        data: { isDeleted: true, deletedAt: new Date() },
      });

      // Try to get comments - should return 404
      const response = await request(app).get(`/api/posts/${post.id}/comments`);

      expect(response.status).toBe(404);
    });

    it('should not show deleted comments', async () => {
      // Create and delete a comment
      const comment = await prisma.comment.create({
        data: {
          content: 'Comment to be deleted',
          postId: testPost1.id,
          authorId: testUser1.id,
        },
      });

      await prisma.comment.update({
        where: { id: comment.id },
        data: { isDeleted: true, deletedAt: new Date() },
      });

      // Get comments - deleted comment should not appear
      const response = await request(app)
        .get(`/api/posts/${testPost1.id}/comments`)
        .set('Authorization', `Bearer ${accessToken1}`);

      expect(response.status).toBe(200);
      const deletedComment = response.body.data.comments.find((c: any) => c.id === comment.id);
      expect(deletedComment).toBeUndefined();
    });

    it('should handle deep nested replies', async () => {
      // Create a chain of nested replies
      const parentComment = await prisma.comment.create({
        data: {
          content: 'Parent comment',
          postId: testPost1.id,
          authorId: testUser1.id,
        },
      });

      const reply1 = await prisma.comment.create({
        data: {
          content: 'First level reply',
          postId: testPost1.id,
          authorId: testUser2.id,
          parentId: parentComment.id,
        },
      });

      await prisma.comment.create({
        data: {
          content: 'Second level reply',
          postId: testPost1.id,
          authorId: testUser3.id,
          parentId: reply1.id,
        },
      });

      // Get comments and verify nested structure
      const response = await request(app)
        .get(`/api/posts/${testPost1.id}/comments`)
        .set('Authorization', `Bearer ${accessToken1}`);

      expect(response.status).toBe(200);
      const parent = response.body.data.comments.find((c: any) => c.id === parentComment.id);
      expect(parent).toBeDefined();
      expect(parent.replies.length).toBeGreaterThan(0);
    });
  });
});

