import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import authRoutes from './api/routes/auth.routes';
import userRoutes from './api/routes/user.routes';
import albumRoutes from './api/routes/album.routes';
import mediaItemRoutes from './api/routes/mediaItem.routes';
import { errorHandler } from './api/middlewares/error.middleware';
import { config } from './config/env_conf';
import './types/express.d';

// Create an Express application
const app: Express = express();

// Get frontend URL from environment variables for CORS
const frontendURL = config.FRONTEND_URL || 'http://localhost:5173';

// Configure middleware
app.use(cors({
  origin: frontendURL,
  credentials: true
}));

// Parse JSON request body
app.use(express.json());

// Parse URL-encoded request body
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Backend is healthy!'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/albums', albumRoutes);
app.use('/api/media', mediaItemRoutes);

// Handle 404 — Route not found
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

// Global error handler
app.use(errorHandler);

export default app;
