import mongoose from 'mongoose';
import { config } from './env_conf';
import logger from './logging_conf';

/**
 * Establishes a connection to MongoDB using the provided URI from environment variables.
 * This function should be called when the server starts.
 */
export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = config.DATABASE_URL;
    
    if (!mongoURI) {
      logger.error('MongoDB connection string (DATABASE_URL) is not defined in environment variables');
    }
    
    // Connect to MongoDB
    const conn = await mongoose.connect(mongoURI);

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error instanceof Error ? error.message : 'Unknown error'}`);
    // Exit process with failure
    process.exit(1);
  }
};

export default connectDB;
