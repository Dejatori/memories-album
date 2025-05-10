import { v2 as cloudinary } from 'cloudinary';

/**
 * Configures the Cloudinary SDK with credentials from environment variables.
 * This should be called early in the application startup.
 */
export const configureCloudinary = (): void => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary credentials are not properly defined in environment variables');
  }
  
  // Configure Cloudinary
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true // Use HTTPS
  });
  
  console.log('Cloudinary configured successfully');
};

// Export the configured cloudinary instance for use in other parts of the application
export default cloudinary;