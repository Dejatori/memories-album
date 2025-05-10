import express, { Express, Request, Response } from 'express';
import cors from 'cors';

// Create Express application
const app: Express = express();

// Get frontend URL from environment variables for CORS
const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';

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

// TODO: Add API routes here
// Example: app.use('/api/auth', authRoutes);
// Example: app.use('/api/albums', albumRoutes);

// Handle 404 - Route not found
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

export default app;
