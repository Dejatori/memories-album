import 'dotenv/config'; // Load environment variables first
import app from './app';
import { connectDB, configureCloudinary } from './config';
import { config } from './config/env_conf';
import logger from './config/logging_conf';

// Define port from environment variables or use default
const PORT = config.PORT || 3001;

// Self-executing async function to start the server
(async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Configure Cloudinary
    configureCloudinary();
    
    // Start Express server
    app.listen(PORT, () => {
      logger.info(`Server running in ${config.ENV_STATE || 'dev'} mode on port ${PORT}`);
      logger.info(`Health check available at: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
})();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! Shutting down...');
  logger.error(err);
  process.exit(1);
});
