import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { validateParams, validateQuery } from '../middleware/validator';
import notificationService from '../services/notification/notificationService';
import { idParamSchema, paginationSchema } from '../utils/validation';
import { authenticate } from '../middleware/auth';
import { z } from 'zod';

/**
 * @route   GET /api/notifications
 * @desc    Get user's notifications
 * @access  Private
 */
export const getNotifications = [
  authenticate,
  validateQuery(paginationSchema),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const queryParams = req.query as unknown as {
      page?: number;
      limit?: number;
      unreadOnly?: string;
    };

    const { page = 1, limit = 20, unreadOnly } = queryParams;

    const result = await notificationService.getUserNotifications(
      req.user.id,
      page,
      limit,
      unreadOnly === 'true'
    );

    res.json({
      success: true,
      data: result,
    });
  }),
];

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notification count
 * @access  Private
 */
export const getUnreadCount = [
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const count = await notificationService.getUnreadCount(req.user.id);

    res.json({
      success: true,
      data: { unreadCount: count },
    });
  }),
];

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
export const markAsRead = [
  authenticate,
  validateParams(idParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const { id: notificationId } = req.params;
    await notificationService.markAsRead(notificationId, req.user.id);

    res.json({
      success: true,
      message: 'Notification marked as read',
    });
  }),
];

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
export const markAllAsRead = [
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    await notificationService.markAllAsRead(req.user.id);

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  }),
];

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete a notification
 * @access  Private
 */
export const deleteNotification = [
  authenticate,
  validateParams(idParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const { id: notificationId } = req.params;
    await notificationService.deleteNotification(notificationId, req.user.id);

    res.json({
      success: true,
      message: 'Notification deleted successfully',
    });
  }),
];

