import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import createHttpError from 'http-errors';
import User, { IUser } from '../models/User.model';
import { JwtPayload } from '../services/auth.service';

// Define a type for the user object without the password
export type UserWithoutPassword = Omit<IUser, 'password'>;

// Extend Express Request type to include user property
// Using module augmentation instead of namespace declaration
declare module 'express' {
  interface Request {
    user?: UserWithoutPassword; // Will be populated with user data by the middleware
  }
}

/**
 * Middleware to protect routes that require authentication
 * Verifies the JWT token and attaches the user to the request object
 */
export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from Authorization header
    let token: string | undefined;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      // Extract token from "Bearer <token>"
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return next(createHttpError(401, 'Not authorized, no token provided'));
    }

    // Verify token
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    // Decode token to get user ID
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    // Find user by ID
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return next(createHttpError(401, 'Not authorized, user not found'));
    }

    // Attach user to request object
    req.user = user;

    // Proceed to the protected route
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(createHttpError(401, 'Not authorized, invalid token'));
    }

    if (error.name === 'TokenExpiredError') {
      return next(createHttpError(401, 'Not authorized, token expired'));
    }

    next(error);
  }
};