import { Request, Response, NextFunction } from 'express';
import { ZodIssue } from 'zod';
import mongoose from 'mongoose';
import { config } from '../../config/env_conf';
import logger from '../../config/logging_conf';
import {
  isHttpError,
  isZodError,
  isMongoError,
  isMongoServerError,
  isJwtError
} from '../../types/errors';

// Type for validation errors (compatible con ZodIssue)
interface ValidationErrorItem {
  path: string | (string | number)[];
  message: string;
  [key: string]: unknown;
}

/**
 * Global error handler middleware
 * Handles different types of errors and sends appropriate responses
 */
export const errorHandler = (
    err: unknown,
    req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: NextFunction
) => {
  // Log error con datos de contexto
  const logContext = {
    path: req.path,
    method: req.method,
    body: req.method !== 'GET' ? req.body : undefined,
    query: Object.keys(req.query).length ? req.query : undefined,
    user: req.user?.id || 'anónimo',
    ip: req.ip,
    userAgent: req.get('user-agent')
  };

  // Default error status and message
  let statusCode = 500;
  let message = 'Server Error';
  let errors: ValidationErrorItem[] | undefined = undefined;
  let stack: string | undefined = undefined;

  // Guardar stack trace si existe
  if (err instanceof Error) {
    stack = err.stack;
  }

  // Handle HTTP errors (from http-errors package)
  if (isHttpError(err)) {
    statusCode = err.statusCode;
    message = err.message;
    if (err.expose && err.errors) {
      errors = err.errors as ValidationErrorItem[];
    }

    // Log según la gravedad del error
    if (statusCode >= 500) {
      logger.error(`[HTTP ${statusCode}] ${message}`, { ...logContext, stack });
    } else if (statusCode >= 400) {
      logger.warn(`[HTTP ${statusCode}] ${message}`, logContext);
    }
  }
  // Handle Zod validation errors
  else if (isZodError(err)) {
    statusCode = 400;
    message = 'Validation Error';

    // Adaptar errores de Zod al formato esperado
    errors = err.errors.map((issue: ZodIssue) => ({
      path: issue.path,
      message: issue.message,
      code: issue.code
    }));

    logger.warn(`Validation Error: ${err.errors.length} issues`, {
      ...logContext,
      validationErrors: errors
    });
  }
  // Handle Mongoose validation errors
  else if (isMongoError(err)) {
    if (err instanceof mongoose.Error.ValidationError) {
      statusCode = 400;
      message = 'Validation Error';
      errors = Object.values(err.errors).map(e => ({
        path: e.path,
        message: e.message
      }));

      logger.warn(`Mongoose Validation Error`, {
        ...logContext,
        validationErrors: errors
      });
    }
    // Handle Mongoose cast errors (e.g., invalid ObjectId)
    else if (err instanceof mongoose.Error.CastError) {
      statusCode = 400;
      message = `Invalid ${err.path}: ${err.value}`;

      logger.warn(`Cast Error: ${message}`, logContext);
    }
  }
  // Handle Mongoose duplicate key errors
  else if (isMongoServerError(err)) {
    if (err.code === 11000) {
      statusCode = 409;
      message = 'Duplicate field value entered';
      if (err.keyValue) {
        const field = Object.keys(err.keyValue)[0];
        message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
      }

      logger.warn(`Duplicate Key Error: ${message}`, {
        ...logContext,
        keyValue: err.keyValue
      });
    }
  }
  // Handle JWT errors
  else if (isJwtError(err)) {
    statusCode = 401;
    message = 'Authentication Error';

    logger.warn(`JWT Error: ${err.name}`, logContext);
  }
  // Otros errores no esperados
  else {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    logger.error(`Unhandled Error: ${errorMessage}`, {
      ...logContext,
      stack
    });
  }

  // Send error response
  res.status(statusCode).json({
    status: 'error',
    message,
    ...(errors && { errors }),
    ...(config.ENV_STATE === 'dev' && { stack })
  });
};