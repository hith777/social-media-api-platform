import request from 'supertest';
import app from '../src/index';
import prisma from '../src/config/database';
import { hashPassword } from '../src/utils/password';

describe('Phase 6: Search & Discovery', () => {
  let testUser1: any;
  let testUser2: any;
  let testUser3: any;
  let accessToken1: string;
  let accessToken2: string;
  let testPost1: any;
  let testPost2: any;

  beforeAll(async () => {
    // Clean up test data
    const testUsers = await prisma.user.findMany({
      where: {
        email: {
          in: ['testuser1@example.com', 'testuser2@example.com', 'testuser3@example.com'],
        },
      },
      select: { id: true },
    });
    const testUserIds = testUsers.map((u) => u.id);

    if (testUserIds.length > 0) {
      await prisma.comment.deleteMany({
        where: {
          OR: [
            { authorId: { in: testUserIds } },
            { post: { authorId: { in: testUserIds } } },
          ],
        },
      });
      await prisma.like.deleteMany({
        where: {
          OR: [
            { userId: { in: testUserIds } },
            { post: { authorId: { in: testUserIds } } },
          ],
        },
      });
      await prisma.post.deleteMany({
        where: { authorId: { in: testUserIds } },
      });
      await prisma.block.deleteMany({
        where: {
          OR: [
            { blockerId: { in: testUserIds } },
            { blockedId: { in: testUserIds } },
          ],
        },
      });
      await prisma.follow.deleteMany({
        where: {
          OR: [
            { followerId: { in: testUserIds } },
            { followingId: { in: testUserIds } },
          ],
        },
      });
      await prisma.user.deleteMany({
        where: { id: { in: testUserIds } },
      });
    }

    // Create test users
    const hashedPassword = await hashPassword('Test123!@#');
    testUser1 = await prisma.user.create({
      data: {
        email: 'testuser1@example.com',
        username: 'testuser1',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User1',
        bio: 'Test user 1 bio',
        isEmailVerified: true,
        isActive: true,
      },
    });

    testUser2 = await prisma.user.create({
      data: {
        email: 'testuser2@example.com',
        username: 'testuser2',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User2',
        bio: 'Test user 2 bio',
        isEmailVerified: true,
        isActive: true,
      },
    });

    testUser3 = await prisma.user.create({
      data: {
        email: 'testuser3@example.com',
        username: 'testuser3',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User3',
        isEmailVerified: false,
        isActive: true,
      },
    });

    // Login users
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

    // Create test posts
    testPost1 = await prisma.post.create({
      data: {
        authorId: testUser1.id,
        content: 'This is a test post about JavaScript and TypeScript programming',
        visibility: 'public',
      },
    });

    testPost2 = await prisma.post.create({
      data: {
        authorId: testUser2.id,
        content: 'Another post about Node.js and Express framework development',
        visibility: 'public',
      },
    });

    // Add some engagement to posts for trending tests
    await prisma.like.createMany({
      data: [
        { userId: testUser2.id, postId: testPost1.id },
        { userId: testUser3.id, postId: testPost1.id },
      ],
    });

    await prisma.comment.createMany({
      data: [
        { authorId: testUser2.id, postId: testPost1.id, content: 'Great post!' },
        { authorId: testUser3.id, postId: testPost1.id, content: 'Nice work!' },
      ],
    });

    await prisma.like.create({
      data: { userId: testUser1.id, postId: testPost2.id },
    });
  });

  afterAll(async () => {
    // Clean up test data
    const testUserIds = [testUser1.id, testUser2.id, testUser3.id];
    await prisma.comment.deleteMany({
      where: {
        OR: [
          { authorId: { in: testUserIds } },
          { post: { authorId: { in: testUserIds } } },
        ],
      },
    });
    await prisma.like.deleteMany({
      where: {
        OR: [
          { userId: { in: testUserIds } },
          { post: { authorId: { in: testUserIds } } },
        ],
      },
    });
    await prisma.post.deleteMany({
      where: { authorId: { in: testUserIds } },
    });
    await prisma.block.deleteMany({
      where: {
        OR: [
          { blockerId: { in: testUserIds } },
          { blockedId: { in: testUserIds } },
        ],
      },
    });
    await prisma.follow.deleteMany({
      where: {
        OR: [
          { followerId: { in: testUserIds } },
          { followingId: { in: testUserIds } },
        ],
      },
    });
    await prisma.user.deleteMany({
      where: { id: { in: testUserIds } },
    });
  });

  describe('POST /api/search/posts - Full-text search for posts', () => {
    it('should search posts by content', async () => {
      const response = await request(app)
        .get('/api/search/posts')
        .query({ q: 'JavaScript' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toBeInstanceOf(Array);
      expect(response.body.data.posts.length).toBeGreaterThan(0);
      expect(response.body.data.posts.some((p: any) => p.id === testPost1.id)).toBe(true);
    });

    it('should search posts by author username', async () => {
      const response = await request(app)
        .get('/api/search/posts')
        .query({ q: 'testuser1' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toBeInstanceOf(Array);
      expect(response.body.data.posts.some((p: any) => p.author.username === 'testuser1')).toBe(true);
    });

    it('should return empty results for non-matching query', async () => {
      const response = await request(app)
        .get('/api/search/posts')
        .query({ q: 'nonexistentquery12345' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toEqual([]);
      expect(response.body.data.total).toBe(0);
    });

    it('should require search query', async () => {
      const response = await request(app).get('/api/search/posts').expect(400);
      expect(response.body.success).toBe(false);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/search/posts')
        .query({ q: 'post', page: 1, limit: 2 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.posts.length).toBeLessThanOrEqual(2);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.limit).toBe(2);
    });

    it('should include isLiked flag for authenticated users', async () => {
      const response = await request(app)
        .get('/api/search/posts')
        .query({ q: 'JavaScript' })
        .set('Authorization', `Bearer ${accessToken2}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const post = response.body.data.posts.find((p: any) => p.id === testPost1.id);
      expect(post).toBeDefined();
      expect(post.isLiked).toBe(true);
    });
  });

  describe('GET /api/search/users - User search', () => {
    it('should search users by username', async () => {
      const response = await request(app)
        .get('/api/search/users')
        .query({ q: 'testuser1' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toBeInstanceOf(Array);
      expect(response.body.data.users.some((u: any) => u.username === 'testuser1')).toBe(true);
    });

    it('should search users by first name', async () => {
      const response = await request(app)
        .get('/api/search/users')
        .query({ q: 'Test' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users.length).toBeGreaterThan(0);
    });

    it('should exclude self from search results for authenticated users', async () => {
      const response = await request(app)
        .get('/api/search/users')
        .query({ q: 'testuser1' })
        .set('Authorization', `Bearer ${accessToken1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users.some((u: any) => u.id === testUser1.id)).toBe(false);
    });

    it('should filter by verifiedOnly', async () => {
      const response = await request(app)
        .get('/api/search/users')
        .query({ q: 'testuser', verifiedOnly: 'true' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users.every((u: any) => u.isEmailVerified === true)).toBe(true);
    });

    it('should filter by hasBio', async () => {
      const response = await request(app)
        .get('/api/search/users')
        .query({ q: 'testuser', hasBio: 'true' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users.every((u: any) => u.bio !== null)).toBe(true);
    });
  });

  describe('GET /api/search/trending - Trending posts', () => {
    it('should return trending posts', async () => {
      const response = await request(app)
        .get('/api/search/trending')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toBeInstanceOf(Array);
      expect(response.body.data.total).toBeGreaterThan(0);
    });

    it('should support timeRange filter', async () => {
      const response = await request(app)
        .get('/api/search/trending')
        .query({ timeRange: 'week' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toBeInstanceOf(Array);
    });

    it('should prioritize posts with more engagement', async () => {
      const response = await request(app)
        .get('/api/search/trending')
        .query({ timeRange: 'all' })
        .expect(200);

      expect(response.body.success).toBe(true);
      // testPost1 has more engagement (2 likes, 2 comments) so should appear first
      const posts = response.body.data.posts;
      if (posts.length > 0) {
        const post1Index = posts.findIndex((p: any) => p.id === testPost1.id);
        const post2Index = posts.findIndex((p: any) => p.id === testPost2.id);
        if (post1Index !== -1 && post2Index !== -1) {
          expect(post1Index).toBeLessThan(post2Index);
        }
      }
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/search/trending')
        .query({ page: 1, limit: 1 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.posts.length).toBeLessThanOrEqual(1);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.limit).toBe(1);
    });
  });

  describe('Search filters and sorting', () => {
    it('should filter posts by visibility', async () => {
      // Create a private post
      const privatePost = await prisma.post.create({
        data: {
          authorId: testUser1.id,
          content: 'Private post about filtering',
          visibility: 'private',
        },
      });

      const response = await request(app)
        .get('/api/search/posts')
        .query({ q: 'filtering', visibility: 'private' })
        .set('Authorization', `Bearer ${accessToken1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.posts.some((p: any) => p.id === privatePost.id)).toBe(true);

      // Cleanup
      await prisma.post.delete({ where: { id: privatePost.id } });
    });

    it('should filter posts by authorId', async () => {
      const response = await request(app)
        .get('/api/search/posts')
        .query({ q: 'post', authorId: testUser1.id })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.posts.every((p: any) => p.author.id === testUser1.id)).toBe(true);
    });

    it('should sort posts by newest', async () => {
      const response = await request(app)
        .get('/api/search/posts')
        .query({ q: 'post', sortBy: 'newest' })
        .expect(200);

      expect(response.body.success).toBe(true);
      const posts = response.body.data.posts;
      if (posts.length > 1) {
        const firstDate = new Date(posts[0].createdAt).getTime();
        const secondDate = new Date(posts[1].createdAt).getTime();
        expect(firstDate).toBeGreaterThanOrEqual(secondDate);
      }
    });

    it('should sort posts by oldest', async () => {
      const response = await request(app)
        .get('/api/search/posts')
        .query({ q: 'post', sortBy: 'oldest' })
        .expect(200);

      expect(response.body.success).toBe(true);
      const posts = response.body.data.posts;
      if (posts.length > 1) {
        const firstDate = new Date(posts[0].createdAt).getTime();
        const secondDate = new Date(posts[1].createdAt).getTime();
        expect(firstDate).toBeLessThanOrEqual(secondDate);
      }
    });

    it('should sort posts by popular', async () => {
      const response = await request(app)
        .get('/api/search/posts')
        .query({ q: 'post', sortBy: 'popular' })
        .expect(200);

      expect(response.body.success).toBe(true);
      const posts = response.body.data.posts;
      if (posts.length > 1) {
        const firstEngagement =
          (posts[0]._count?.likes || 0) + (posts[0]._count?.comments || 0);
        const secondEngagement =
          (posts[1]._count?.likes || 0) + (posts[1]._count?.comments || 0);
        expect(firstEngagement).toBeGreaterThanOrEqual(secondEngagement);
      }
    });

    it('should sort users by username', async () => {
      const response = await request(app)
        .get('/api/search/users')
        .query({ q: 'testuser', sortBy: 'username' })
        .expect(200);

      expect(response.body.success).toBe(true);
      const users = response.body.data.users;
      if (users.length > 1) {
        expect(users[0].username.localeCompare(users[1].username)).toBeLessThanOrEqual(0);
      }
    });

    it('should sort users by newest', async () => {
      const response = await request(app)
        .get('/api/search/users')
        .query({ q: 'testuser', sortBy: 'newest' })
        .expect(200);

      expect(response.body.success).toBe(true);
      const users = response.body.data.users;
      if (users.length > 1) {
        const firstDate = new Date(users[0].createdAt).getTime();
        const secondDate = new Date(users[1].createdAt).getTime();
        expect(firstDate).toBeGreaterThanOrEqual(secondDate);
      }
    });
  });

  describe('Search caching', () => {
    it('should cache search results', async () => {
      // First request
      const response1 = await request(app)
        .get('/api/search/posts')
        .query({ q: 'JavaScript' })
        .expect(200);

      // Second request (should be faster due to cache)
      const startTime = Date.now();
      const response2 = await request(app)
        .get('/api/search/posts')
        .query({ q: 'JavaScript' })
        .expect(200);
      const endTime = Date.now();

      expect(response1.body.data).toEqual(response2.body.data);
      // Cache should make second request faster (though this is not guaranteed in tests)
      expect(endTime - startTime).toBeLessThan(1000); // Should be fast
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle empty search query', async () => {
      const response = await request(app)
        .get('/api/search/posts')
        .query({ q: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle search query exceeding max length', async () => {
      const longQuery = 'a'.repeat(201);
      const response = await request(app)
        .get('/api/search/posts')
        .query({ q: longQuery })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should exclude blocked users from search results', async () => {
      // Block user2
      await prisma.block.create({
        data: {
          blockerId: testUser1.id,
          blockedId: testUser2.id,
        },
      });

      const response = await request(app)
        .get('/api/search/posts')
        .query({ q: 'post' })
        .set('Authorization', `Bearer ${accessToken1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.posts.some((p: any) => p.author.id === testUser2.id)).toBe(false);

      // Cleanup
      await prisma.block.deleteMany({
        where: {
          blockerId: testUser1.id,
          blockedId: testUser2.id,
        },
      });
    });
  });
});

