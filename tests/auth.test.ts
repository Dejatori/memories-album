import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import User from '../src/api/models/User.model';
import { JwtPayload } from '../src/api/services/auth.service';
import { config } from '../src/config/env_conf';

// Test database connection URI
const DATABASE_URL = config.DATABASE_URL || 'mongodb://localhost:27017/memories-album-test';

// Setup and teardown
beforeAll(async () => {
  try {
    // Connect to test database
    await mongoose.connect(DATABASE_URL);
    console.log('Connected to test database');
  } catch (error) {
    console.error('Error connecting to test database:', error);
    process.exit(1);
  }
});

afterAll(async () => {
  // Disconnect from test database
  await mongoose.connection.close();
  console.log('Disconnected from test database');
});

// Clean up database before each test
beforeEach(async () => {
  await User.deleteMany({});
});

// Helper function to create a test user using the registration endpoint
const createTestUser = async () => {
  const userData = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123'
  };
  const response = await request(app)
      .post('/api/auth/register')
      .send(userData);
  return response.body.data.user;
};

// Helper function to generate a valid token for a user
const generateValidToken = (userId: string): string => {
  const jwtSecret = config.JWT_SECRET || 'test-jwt-secret';
  return jwt.sign({ userId } as JwtPayload, jwtSecret, { expiresIn: '1h' });
};

// Helper function to generate an expired token for a user
const generateExpiredToken = (userId: string): string => {
  const jwtSecret = config.JWT_SECRET || 'test-jwt-secret';
  return jwt.sign({ userId } as JwtPayload, jwtSecret, { expiresIn: '0s' });
};

describe('Auth Routes', () => {
  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user).toHaveProperty('_id');
      expect(response.body.data.user.username).toBe(userData.username);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user).not.toHaveProperty('password');

      // Verify user was created in database
      const userInDb = await User.findOne({ email: userData.email });
      expect(userInDb).toBeTruthy();
      expect(userInDb?.username).toBe(userData.username);
    });

    it('should return 409 if email already exists', async () => {
      // Create a user first
      await createTestUser();

      // Try to register with the same email
      const userData = {
        username: 'differentuser',
        email: 'test@example.com', // Same email as test user
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(409);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Email already in use');
    });

    it('should return 409 if username already exists', async () => {
      // Create a user first
      await createTestUser();

      // Try to register with the same username
      const userData = {
        username: 'testuser', // Same username as test user
        email: 'different@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(409);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Username already taken');
    });

    it('should return 400 if validation fails', async () => {
      // Try to register with invalid data
      const userData = {
        username: 'ab', // Too short
        email: 'notanemail', // Invalid email
        password: 'short' // Too short
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Validation error');
      expect(response.body.errors).toBeTruthy();
    });
  });

  describe('User Login', () => {
    it('should login a user successfully', async () => {
      // Create a user first
      await createTestUser();

      // Login with correct credentials
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe(loginData.email);
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should return 401 if password is incorrect', async () => {
      // Create a user first
      await createTestUser();

      // Login with an incorrect password
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should return 401 if user does not exist', async () => {
      // Login with non-existent user
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should return 400 if validation fails', async () => {
      // Login with invalid data
      const loginData = {
        email: 'notanemail', // Invalid email
        password: '' // Empty password
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Validation error');
      expect(response.body.errors).toBeTruthy();
    });
  });

  describe('Protected Routes', () => {
    it('should access protected route with valid token', async () => {
      // Create a user first
      const user = await createTestUser();

      // Generate a valid token
      const token = generateValidToken(user._id.toString());

      // Access protected route
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user._id.toString()).toBe(user._id.toString());
      expect(response.body.data.user.email).toBe(user.email);
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should return 401 if no token is provided', async () => {
      // Access protected route without token
      const response = await request(app)
        .get('/api/users/me');

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Not authorized, no token provided');
    });

    it('should return 401 if token is invalid', async () => {
      // Access protected route with invalid token
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer invalidtoken');

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Not authorized, invalid token');
    });

    it('should return 401 if token is expired', async () => {
      // Create a user first
      const user = await createTestUser();

      // Generate an expired token
      const expiredToken = generateExpiredToken(user._id.toString());

      // Access protected route with expired token
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Not authorized, token expired');
    });

    it('should return 401 if user does not exist', async () => {
      // Generate a token for a non-existent user
      const nonExistentUserId = new mongoose.Types.ObjectId().toString();
      const token = generateValidToken(nonExistentUserId);

      // Access protected route with token for non-existent user
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Not authorized, user not found');
    });
  });
});