import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import createHttpError from 'http-errors';

// Configure multer to store files in memory
const storage = multer.memoryStorage();

// File filter to allow only images and videos
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept image and video files
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(createHttpError(400, 'Only image and video files are allowed'));
  }
};

// Configure multer with storage and file filter
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

/**
 * Middleware to handle single file uploads
 * Stores the file in memory for processing
 */
export const uploadSingleFile = upload.single('file');

/**
 * Middleware to handle multiple file uploads
 * Stores the files in memory for processing
 * @param maxCount - Maximum number of files to accept
 */
export const uploadMultipleFiles = (maxCount = 5) => upload.array('files', maxCount);

/**
 * Error handler for multer errors
 */
export const handleMulterError = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    // Handle Multer-specific errors
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(createHttpError(400, 'File too large. Maximum size is 10MB'));
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(createHttpError(400, 'Too many files or unexpected field name'));
    }
    return next(createHttpError(400, err.message));
  }
  
  // Pass other errors to the global error handler
  next(err);
};