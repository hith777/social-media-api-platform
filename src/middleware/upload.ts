import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Response, NextFunction } from 'express';
import { env } from '../config/env';
import { AppError } from './errorHandler';

// Ensure upload directory exists
const uploadDir = env.UPLOAD_DIR || 'uploads';
const avatarDir = path.join(uploadDir, 'avatars');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, avatarDir);
  },
  filename: (_req, file, cb) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${uniqueSuffix}${ext}`);
  },
});

// File filter for images only
const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Allowed image MIME types
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.',
        400
      )
    );
  }
};

// Configure multer
export const uploadAvatarMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.MAX_FILE_SIZE || 5 * 1024 * 1024, // 5MB default
  },
});

// Middleware to handle upload errors
export const handleUploadError = (
  err: Error,
  _req: Express.Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        success: false,
        message: `File too large. Maximum size is ${(env.MAX_FILE_SIZE || 5 * 1024 * 1024) / 1024 / 1024}MB`,
      });
      return;
    }
    res.status(400).json({
      success: false,
      message: err.message,
    });
    return;
  }
  next(err);
};


