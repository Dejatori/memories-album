import { Request, Response, NextFunction } from 'express';
import { registerSchema, loginSchema } from '../validators/auth.validator';
import { registerUser, loginUser } from '../services/auth.service';
import createHttpError from 'http-errors';
import { isZodError } from "../../types/errors";

/**
 * Handles user registration
 * @route POST /api/auth/register
 * @access Public
 */
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body against the register schema
    const validatedData = registerSchema.parse(req.body);
    
    // Register the user using the auth service
    const { user, token } = await registerUser(validatedData);
    
    // Return success response with user data and token
    res.status(201).json({
      status: 'success',
      data: {
        user,
        token
      }
    });
  } catch (err) {
    // If it's a Zod validation error, format it nicely
    if (isZodError(err)) {
      return next(createHttpError(400, {
        message: 'Validation error',
        errors: err.errors
      }));
    }
    
    // Pass other errors to the error handler middleware
    next(err);
  }
};

/**
 * Handles user login
 * @route POST /api/auth/login
 * @access Public
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate the request body against the login schema
    const validatedData = loginSchema.parse(req.body);
    
    // Authenticate the user using the auth service
    const { user, token } = await loginUser(validatedData);
    
    // Return success response with user data and token
    res.status(200).json({
      status: 'success',
      data: {
        user,
        token
      }
    });
  } catch (err) {
    // If it's a Zod validation error, format it nicely
    if (isZodError(err)) {
      return next(createHttpError(400, {
        message: 'Validation error',
        errors: err.errors
      }));
    }
    
    // Pass other errors to the error handler middleware
    next(err);
  }
};

/**
 * Gets the current users' profile
 * @route GET /api/users/me
 * @access Private
 */
export const getMe = async (req: Request, res: Response) => {
  // The user is already attached to the request by the auth middleware.
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user
    }
  });
};