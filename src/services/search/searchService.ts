import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

export class SearchService {
  /**
   * Full-text search for posts
   */
  async searchPosts(
    query: string,
    page: number = 1,
    limit: number = 20,
    userId?: string
  ): Promise<{
    posts: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    if (!query || query.trim().length === 0) {
      throw new AppError('Search query is required', 400);
    }

    if (query.length > 200) {
      throw new AppError('Search query cannot exceed 200 characters', 400);
    }

    const searchQuery = query.trim();
    const skip = (page - 1) * limit;

    // Build visibility filter
    const visibilityFilter: any[] = ['public'];
    if (userId) {
      visibilityFilter.push('friends');
    }

    // Use PostgreSQL full-text search with ILIKE for case-insensitive matching
    // For better performance, we can use PostgreSQL's full-text search features
    const where: any = {
      isDeleted: false as any,
      visibility: { in: visibilityFilter },
      OR: [
        {
          content: {
            contains: searchQuery,
            mode: 'insensitive',
          },
        },
      ],
    };

    // Exclude blocked users
    if (userId) {
      const blocked = await prisma.block.findMany({
        where: {
          OR: [
            { blockerId: userId },
            { blockedId: userId },
          ],
        },
        select: {
          blockerId: true,
          blockedId: true,
        },
      });

      const blockedIds = new Set<string>();
      blocked.forEach((b) => {
        if (b.blockerId === userId) blockedIds.add(b.blockedId);
        if (b.blockedId === userId) blockedIds.add(b.blockerId);
      });

      if (blockedIds.size > 0) {
        where.authorId = {
          notIn: Array.from(blockedIds),
        };
      }
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
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
          likes: userId
            ? {
                where: { userId },
                select: { userId: true },
              }
            : false,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }) as any,
      prisma.post.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    const postsWithLikes = posts.map((post: any) => ({
      ...post,
      isLiked: post.likes && post.likes.length > 0,
    }));

    return {
      posts: postsWithLikes,
      total,
      page,
      limit,
      totalPages,
    };
  }
}

export default new SearchService();



