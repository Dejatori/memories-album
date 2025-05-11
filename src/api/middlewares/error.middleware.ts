import { Request, Response, NextFunction } from 'express';
import { isHttpError } from 'http-errors';
import { ZodError } from 'zod';
import mongoose from 'mongoose';

// Type for MongoDB duplicate key error
interface MongoServerError extends Error {
  code?: number;
  keyValue?: Record<string, unknown>;
}

// Type for validation errors
interface ValidationErrorItem {
  path: string;
  message: string;
}

/**
 * Global error handler middleware
 * Handles different types of errors and sends appropriate responses
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) => {
  // Log error for debugging
  console.error('Error:', err);

  // Default error status and message
  let statusCode = 500;
  let message = 'Server Error';
  let errors: ValidationErrorItem[] | undefined = undefined;

  // Handle HTTP errors (from http-errors package)
  if (isHttpError(err)) {
    statusCode = err.statusCode;
    message = err.message;
    if (err.expose && err.errors) {
      errors = err.errors;
    }
  }
  // Handle Zod validation errors
  else if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation Error';
    errors = err.errors;
  }
  // Handle Mongoose validation errors
  else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = 'Validation Error';
    errors = Object.values(err.errors).map(e => ({
      path: e.path,
      message: e.message
    }));
  }
  // Handle Mongoose cast errors (e.g., invalid ObjectId)
  else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }
  // Handle Mongoose duplicate key errors
  else if (err.name === 'MongoServerError') {
    const mongoError = err as MongoServerError;
    if (mongoError.code === 11000) {
      statusCode = 409;
      message = 'Duplicate field value entered';
      if (mongoError.keyValue) {
        const field = Object.keys(mongoError.keyValue)[0];
        message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
      }
    }
  }
  // Handle JWT errors
  else if (
    err.name === 'JsonWebTokenError' ||
    err.name === 'TokenExpiredError' ||
    err.name === 'NotBeforeError'
  ) {
    statusCode = 401;
    message = 'Authentication Error';
  }

  // Send error response
  res.status(statusCode).json({
    status: 'error',
    message,
    ...(errors && { errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};