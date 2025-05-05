import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

export class ContentService {
  /**
   * Create a new post
   */
  async createPost(
    authorId: string,
    data: {
      content: string;
      mediaUrls?: string[];
      visibility?: 'public' | 'private' | 'friends';
    }
  ): Promise<any> {
    // Validate content length
    if (!data.content || data.content.trim().length === 0) {
      throw new AppError('Post content cannot be empty', 400);
    }

    if (data.content.length > 5000) {
      throw new AppError('Post content cannot exceed 5000 characters', 400);
    }

    // Validate media URLs count
    if (data.mediaUrls && data.mediaUrls.length > 10) {
      throw new AppError('Maximum 10 media files allowed per post', 400);
    }

    const post = await prisma.post.create({
      data: {
        content: data.content.trim(),
        authorId,
        mediaUrls: (data.mediaUrls || []) as any,
        visibility: (data.visibility || 'public') as any,
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

    return post;
  }
}

export default new ContentService();
