import 'dotenv/config'; // Load environment variables first
import app from './app';
import { connectDB, configureCloudinary } from './config';

// Define port from environment variables or use default
const PORT = process.env.PORT || 3001;

// Self-executing async function to start the server
(async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Configure Cloudinary
    configureCloudinary();
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      console.log(`Health check available at: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! Shutting down...');
  console.error(err);
  process.exit(1);
});
