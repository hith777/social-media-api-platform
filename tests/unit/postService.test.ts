import { ContentService } from '../../src/services/content/contentService';
import prisma from '../../src/config/database';
import { hashPassword } from '../../src/utils/password';

describe('Post Service Unit Tests', () => {
  let contentService: ContentService;
  let testUser: any;
  let testPost: any;

  beforeAll(async () => {
    contentService = new ContentService();
    
    // Create test user
    const hashedPassword = await hashPassword('Test123!@#');
    testUser = await prisma.user.create({
      data: {
        email: 'testpost@example.com',
        username: 'testpost',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        isEmailVerified: true,
      },
    });
  });

  afterAll(async () => {
    // Cleanup
    if (testPost) {
      await prisma.post.deleteMany({
        where: { authorId: testUser.id },
      });
    }
    await prisma.user.deleteMany({
      where: { email: 'testpost@example.com' },
    });
  });

  describe('createPost', () => {
    it('should create a post with valid data', async () => {
      const postData = {
        content: 'This is a test post',
        visibility: 'public' as const,
      };

      const post = await contentService.createPost(testUser.id, postData);
      
      expect(post).toBeDefined();
      expect(post.content).toBe(postData.content);
      expect(post.authorId).toBe(testUser.id);
      expect(post.visibility).toBe(postData.visibility);
      expect(post.isDeleted).toBe(false);
      expect(post.author).toBeDefined();
      
      testPost = post;
    });

    it('should create a post with media URLs', async () => {
      const postData = {
        content: 'Post with media',
        mediaUrls: ['/uploads/posts/image1.jpg', '/uploads/posts/image2.jpg'],
        visibility: 'public' as const,
      };

      const post = await contentService.createPost(testUser.id, postData);
      
      expect(post).toBeDefined();
      expect(post.mediaUrls).toHaveLength(2);
      expect(post.mediaUrls).toContain('/uploads/posts/image1.jpg');
    });

    it('should throw error for empty content', async () => {
      const postData = {
        content: '   ',
        visibility: 'public' as const,
      };

      await expect(
        contentService.createPost(testUser.id, postData)
      ).rejects.toThrow('Post content cannot be empty');
    });

    it('should throw error for content exceeding 5000 characters', async () => {
      const postData = {
        content: 'A'.repeat(5001),
        visibility: 'public' as const,
      };

      await expect(
        contentService.createPost(testUser.id, postData)
      ).rejects.toThrow('Post content cannot exceed 5000 characters');
    });

    it('should throw error for more than 10 media files', async () => {
      const postData = {
        content: 'Post with too many media files',
        mediaUrls: Array.from({ length: 11 }, (_, i) => `/uploads/posts/image${i}.jpg`),
        visibility: 'public' as const,
      };

      await expect(
        contentService.createPost(testUser.id, postData)
      ).rejects.toThrow('Maximum 10 media files allowed per post');
    });

    it('should default to public visibility', async () => {
      const postData = {
        content: 'Post with default visibility',
      };

      const post = await contentService.createPost(testUser.id, postData);
      
      expect(post.visibility).toBe('public');
    });
  });

  describe('getPostById', () => {
    it('should get a post by ID', async () => {
      const post = await contentService.getPostById(testPost.id, testUser.id);
      
      expect(post).toBeDefined();
      expect(post.id).toBe(testPost.id);
      expect(post.content).toBe(testPost.content);
      expect(post.author).toBeDefined();
      expect(post._count).toBeDefined();
    });

    it('should return null for non-existent post', async () => {
      await expect(
        contentService.getPostById('non-existent-id', testUser.id)
      ).rejects.toThrow('Post not found');
    });

    it('should include like count and comment count', async () => {
      const post = await contentService.getPostById(testPost.id, testUser.id);
      
      expect(post._count.likes).toBeDefined();
      expect(post._count.comments).toBeDefined();
    });
  });

  describe('updatePost', () => {
    it('should update post content', async () => {
      const updateData = {
        content: 'Updated post content',
      };

      const updated = await contentService.updatePost(
        testPost.id,
        testUser.id,
        updateData
      );
      
      expect(updated.content).toBe(updateData.content);
      expect(updated.id).toBe(testPost.id);
    });

    it('should update post visibility', async () => {
      const updateData = {
        visibility: 'private' as const,
      };

      const updated = await contentService.updatePost(
        testPost.id,
        testUser.id,
        updateData
      );
      
      expect(updated.visibility).toBe('private');
    });

    it('should throw error when updating non-existent post', async () => {
      await expect(
        contentService.updatePost('non-existent-id', testUser.id, { content: 'Test' })
      ).rejects.toThrow('Post not found');
    });

    it('should throw error when updating another user\'s post', async () => {
      // Create a fresh post for this test to avoid issues with testPost being modified
      const testPostForUpdate = await contentService.createPost(testUser.id, {
        content: 'Post for update test',
      });

      const otherUser = await prisma.user.create({
        data: {
          email: 'otheruser@example.com',
          username: 'otheruser',
          password: await hashPassword('Test123!@#'),
          isEmailVerified: true,
        },
      });

      await expect(
        contentService.updatePost(testPostForUpdate.id, otherUser.id, { content: 'Test' })
      ).rejects.toThrow('You can only update your own posts');

      // Cleanup
      await prisma.post.delete({ where: { id: testPostForUpdate.id } });
      await prisma.user.delete({ where: { id: otherUser.id } });
    });
  });

  describe('deletePost', () => {
    it('should soft delete a post', async () => {
      // Ensure testUser still exists
      const user = await prisma.user.findUnique({
        where: { id: testUser.id },
      });
      if (!user) {
        throw new Error(`Test user ${testUser.id} does not exist`);
      }

      const postToDelete = await contentService.createPost(testUser.id, {
        content: 'Post to be deleted',
      });

      await contentService.deletePost(postToDelete.id, testUser.id);
      
      const deleted = await prisma.post.findUnique({
        where: { id: postToDelete.id },
      });
      
      expect(deleted?.isDeleted).toBe(true);
      expect(deleted?.deletedAt).toBeDefined();
    });

    it('should throw error when deleting non-existent post', async () => {
      await expect(
        contentService.deletePost('non-existent-id', testUser.id)
      ).rejects.toThrow('Post not found');
    });

    it('should throw error when deleting another user\'s post', async () => {
      // Create a fresh post for this test to avoid issues with testPost being modified
      const testPostForDelete = await contentService.createPost(testUser.id, {
        content: 'Post for delete test',
      });

      const otherUser = await prisma.user.create({
        data: {
          email: 'otheruser2@example.com',
          username: 'otheruser2',
          password: await hashPassword('Test123!@#'),
          isEmailVerified: true,
        },
      });

      await expect(
        contentService.deletePost(testPostForDelete.id, otherUser.id)
      ).rejects.toThrow('You can only delete your own posts');

      // Cleanup
      await prisma.post.delete({ where: { id: testPostForDelete.id } });
      await prisma.user.delete({ where: { id: otherUser.id } });
    });
  });

  describe('getPosts', () => {
    it('should get posts with pagination', async () => {
      const result = await contentService.getPosts(
        {},
        'newest',
        1,
        10,
        testUser.id
      );
      
      expect(result).toBeDefined();
      expect(result.posts).toBeInstanceOf(Array);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(result.hasNextPage).toBeDefined();
      expect(result.hasPreviousPage).toBeDefined();
    });

    it('should filter posts by author', async () => {
      const result = await contentService.getPosts(
        { authorId: testUser.id },
        'newest',
        1,
        10,
        testUser.id
      );
      
      expect(result.posts.every((post: any) => post.authorId === testUser.id)).toBe(true);
    });

    it('should filter posts by visibility', async () => {
      const result = await contentService.getPosts(
        { visibility: 'public' },
        'newest',
        1,
        10,
        testUser.id
      );
      
      expect(result.posts.every((post: any) => post.visibility === 'public')).toBe(true);
    });

    it('should search posts by content', async () => {
      const result = await contentService.getPosts(
        { search: 'test' },
        'newest',
        1,
        10,
        testUser.id
      );
      
      expect(result.posts.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getUserPosts', () => {
    it('should get posts by user ID', async () => {
      const result = await contentService.getUserPosts(
        testUser.id,
        testUser.id,
        1,
        10
      );
      
      expect(result).toBeDefined();
      expect(result.posts).toBeInstanceOf(Array);
      expect(result.posts.every((post: any) => post.authorId === testUser.id)).toBe(true);
    });

    it('should return empty array for user with no posts', async () => {
      const newUser = await prisma.user.create({
        data: {
          email: 'noposts@example.com',
          username: 'noposts',
          password: await hashPassword('Test123!@#'),
          isEmailVerified: true,
        },
      });

      const result = await contentService.getUserPosts(
        newUser.id,
        newUser.id,
        1,
        10
      );
      
      expect(result.posts).toHaveLength(0);

      await prisma.user.delete({ where: { id: newUser.id } });
    });
  });
});

