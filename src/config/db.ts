import mongoose from 'mongoose';

/**
 * Establishes a connection to MongoDB using the provided URI from environment variables.
 * This function should be called when the server starts.
 */
export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGO_URI;
    
    if (!mongoURI) {
      throw new Error('MongoDB connection string (MONGO_URI) is not defined in environment variables');
    }
    
    // Connect to MongoDB
    const conn = await mongoose.connect(mongoURI);
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error instanceof Error ? error.message : 'Unknown error'}`);
    // Exit process with failure
    process.exit(1);
  }
};

export default connectDB;
