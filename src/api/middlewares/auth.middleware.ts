import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import createHttpError from 'http-errors';
import User, {IUser} from '../models/User.model';
import { JwtPayload } from '../services/auth.service';
import { config } from '../../config/env_conf';
import { isJwtError } from '../../types/errors';

/**
 * Middleware to protect routes that require authentication
 * Verifies the JWT token and attaches the user to the request object.
 */
export const protect = async (req: Request, _res: Response, next: NextFunction) => {
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
    const jwtSecret = config.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    // Decode token to get user ID
    const decoded = await jwt.verify(token, jwtSecret) as JwtPayload;

    // Find user by ID
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return next(createHttpError(401, 'Not authorized, user not found'));
    }

    // Attach a user to request an object
    req.user = user as IUser;

    // Proceed to the protected route
    next();
  } catch (err) {
    if (isJwtError(err)) {
        if (err.name === 'JsonWebTokenError') {
            return next(createHttpError(401, 'Not authorized, invalid token'));
        }
        if (err.name === 'TokenExpiredError') {
            return next(createHttpError(401, 'Not authorized, token expired'));
        }
        if (err.name === 'NotBeforeError') {
            return next(createHttpError(401, 'Not authorized, token not active'));
        }
    }

    next(err);
  }
};

/**
 * Middleware que verífica si el usuario está autenticado y tiene un _id válido
 * Se usa después del middleware protect para rutas que requieren autenticación
 */
export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user?._id) {
    return next(createHttpError(401, 'User not authenticated'));
  }
  next();
};