import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import createHttpError from 'http-errors';
import User from '../models/User.model';
import { RegisterInput, LoginInput } from '../validators/auth.validator';
import { config } from '../../config/env_conf';

/**
 * Interface for JWT payload
 */
export interface JwtPayload {
  userId: string;
}

/**
 * Generates a JWT token for a user
 * @param userId - The ID of the user
 * @returns A JWT token.
 */
export const generateToken = (userId: string): string => {
  const jwtSecret = config.JWT_SECRET;
  
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  
  // Create a token with user ID in payload
  return jwt.sign(
    { userId } as JwtPayload,
    jwtSecret,
    { expiresIn: config.JWT_EXPIRES_IN || '1d' }
  );
};

/**
 * Registers a new user
 * @param userData - User registration data
 * @returns The created user (without a password) and a JWT token.
 */
export const registerUser = async (userData: RegisterInput) => {
  const { username, email, password } = userData;
  
  // Check if a user with email or username already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { username }]
  });
  
  if (existingUser) {
    // Determine which field caused the conflict
    if (existingUser.email === email) {
      throw createHttpError(409, 'Email already in use');
    } else {
      throw createHttpError(409, 'Username already taken');
    }
  }
  
  // Hash the password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  
  // Create a new user
  const user = await User.create({
    username,
    email,
    password: hashedPassword,
    albums: []
  });
  
  // Generate JWT token
  const token = generateToken(user._id.toString());
  
  // Return user data (without a password) and token
  const userResponse = {
    _id: user._id,
    username: user.username,
    email: user.email,
    profilePictureUrl: user.profilePictureUrl,
    albums: user.albums
  };
  
  return { user: userResponse, token };
};

/**
 * Authenticates a user
 * @param loginData - User login data
 * @returns The authenticated user (without a password) and a JWT token.
 */
export const loginUser = async (loginData: LoginInput) => {
  const { email, password } = loginData;
  
  // Find the user by email
  const user = await User.findOne({ email });
  
  if (!user) {
    throw createHttpError(401, 'Invalid credentials');
  }
  
  // Compare passwords
  const isPasswordValid = await bcrypt.compare(password, user.password);
  
  if (!isPasswordValid) {
    throw createHttpError(401, 'Invalid credentials');
  }
  
  // Generate JWT token
  const token = generateToken(user._id.toString());
  
  // Return user data (without a password) and token
  const userResponse = {
    _id: user._id,
    username: user.username,
    email: user.email,
    profilePictureUrl: user.profilePictureUrl,
    albums: user.albums
  };
  
  return { user: userResponse, token };
};