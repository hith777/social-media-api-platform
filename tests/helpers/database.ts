import prisma from '../../src/config/database';

/**
 * Clean up all test data from database
 */
export async function cleanupTestData(): Promise<void> {
  // Delete in order to respect foreign key constraints
  await prisma.comment.deleteMany({});
  await prisma.like.deleteMany({});
  await prisma.follow.deleteMany({});
  await prisma.block.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.report.deleteMany({});
  await prisma.post.deleteMany({});
  await prisma.user.deleteMany({});
}

/**
 * Clean up test data for specific users
 */
export async function cleanupTestUsers(userIds: string[]): Promise<void> {
  if (userIds.length === 0) return;

  // Delete related data first
  await prisma.comment.deleteMany({
    where: {
      OR: [
        { authorId: { in: userIds } },
        { post: { authorId: { in: userIds } } },
      ],
    },
  });

  await prisma.like.deleteMany({
    where: {
      OR: [
        { userId: { in: userIds } },
        { post: { authorId: { in: userIds } } },
        { comment: { authorId: { in: userIds } } },
      ],
    },
  });

  await prisma.follow.deleteMany({
    where: {
      OR: [
        { followerId: { in: userIds } },
        { followingId: { in: userIds } },
      ],
    },
  });

  await prisma.block.deleteMany({
    where: {
      OR: [
        { blockerId: { in: userIds } },
        { blockedId: { in: userIds } },
      ],
    },
  });

  await prisma.notification.deleteMany({
    where: { userId: { in: userIds } },
  });

  await prisma.post.deleteMany({
    where: { authorId: { in: userIds } },
  });

  await prisma.user.deleteMany({
    where: { id: { in: userIds } },
  });
}

/**
 * Clean up test data for specific posts
 */
export async function cleanupTestPosts(postIds: string[]): Promise<void> {
  if (postIds.length === 0) return;

  await prisma.comment.deleteMany({
    where: { postId: { in: postIds } },
  });

  await prisma.like.deleteMany({
    where: { postId: { in: postIds } },
  });

  await prisma.report.deleteMany({
    where: { postId: { in: postIds } },
  });

  await prisma.post.deleteMany({
    where: { id: { in: postIds } },
  });
}

/**
 * Setup test database (truncate all tables)
 */
export async function setupTestDatabase(): Promise<void> {
  await cleanupTestData();
}

/**
 * Teardown test database
 */
export async function teardownTestDatabase(): Promise<void> {
  await cleanupTestData();
}

/**
 * Create a test user
 */
export async function createTestUser(data: {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  isEmailVerified?: boolean;
}): Promise<any> {
  const { hashPassword } = await import('../../src/utils/password');
  const hashedPassword = await hashPassword(data.password);

  return prisma.user.create({
    data: {
      email: data.email,
      username: data.username,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      isEmailVerified: data.isEmailVerified ?? false,
    },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      avatar: true,
      bio: true,
      isEmailVerified: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

/**
 * Create a test post
 */
export async function createTestPost(data: {
  authorId: string;
  content: string;
  visibility?: 'public' | 'private' | 'friends';
  mediaUrls?: string[];
}): Promise<any> {
  return prisma.post.create({
    data: {
      authorId: data.authorId,
      content: data.content,
      visibility: data.visibility || 'public',
      mediaUrls: data.mediaUrls || [],
    },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
      },
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
  });
}

/**
 * Create a test comment
 */
export async function createTestComment(data: {
  postId: string;
  authorId: string;
  content: string;
  parentId?: string;
}): Promise<any> {
  return prisma.comment.create({
    data: {
      postId: data.postId,
      authorId: data.authorId,
      content: data.content,
      parentId: data.parentId,
    },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
      },
      _count: {
        select: {
          likes: true,
          replies: true,
        },
      },
    },
  });
}

/**
 * Get test user by email
 */
export async function getTestUserByEmail(email: string): Promise<any> {
  return prisma.user.findUnique({
    where: { email },
  });
}

/**
 * Get test user by username
 */
export async function getTestUserByUsername(username: string): Promise<any> {
  return prisma.user.findUnique({
    where: { username },
  });
}


