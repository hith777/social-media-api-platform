import notificationService from './notificationService';
import { emitNotification } from '../../config/websocket';
import logger from '../../config/logger';

export class NotificationEmitter {
  /**
   * Create and emit a notification
   */
  async createAndEmit(
    userId: string,
    type: string,
    message: string
  ): Promise<void> {
    try {
      // Create notification in database
      const notification = await notificationService.createNotification(
        userId,
        type,
        message
      );

      // Emit real-time notification via WebSocket
      emitNotification(userId, {
        id: notification.id,
        type: notification.type,
        message: notification.message,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
      });

      logger.debug(`Notification created and emitted: ${type} for user ${userId}`);
    } catch (error) {
      logger.error(`Error creating/emitting notification: ${error}`);
      // Don't throw - notification creation failure shouldn't break the main flow
    }
  }

  /**
   * Emit notification for new follower
   */
  async notifyNewFollower(followingId: string, followerUsername: string): Promise<void> {
    await this.createAndEmit(
      followingId,
      'new_follower',
      `${followerUsername} started following you`
    );
  }

  /**
   * Emit notification for new like on post
   */
  async notifyPostLike(postAuthorId: string, likerUsername: string, postId: string): Promise<void> {
    await this.createAndEmit(
      postAuthorId,
      'post_like',
      `${likerUsername} liked your post`
    );
  }

  /**
   * Emit notification for new comment on post
   */
  async notifyPostComment(postAuthorId: string, commenterUsername: string, postId: string): Promise<void> {
    await this.createAndEmit(
      postAuthorId,
      'post_comment',
      `${commenterUsername} commented on your post`
    );
  }

  /**
   * Emit notification for new reply to comment
   */
  async notifyCommentReply(commentAuthorId: string, replierUsername: string, commentId: string): Promise<void> {
    await this.createAndEmit(
      commentAuthorId,
      'comment_reply',
      `${replierUsername} replied to your comment`
    );
  }
}

export default new NotificationEmitter();


