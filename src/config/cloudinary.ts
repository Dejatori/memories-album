import { v2 as cloudinary } from 'cloudinary';
import { config } from './env_conf';
import logger from './logging_conf';

/**
 * Configures the Cloudinary SDK with credentials from environment variables.
 * This should be called early in the application startup.
 */
export const configureCloudinary = (): void => {
  const cloudName = config.CLOUDINARY_CLOUD_NAME;
  const apiKey = config.CLOUDINARY_API_KEY;
  const apiSecret = config.CLOUDINARY_API_SECRET;
  
  if (!cloudName || !apiKey || !apiSecret) {
    logger.error('Cloudinary credentials are not properly defined in environment variables');
  }
  
  // Configure Cloudinary
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true // Use HTTPS
  });

  logger.info('Cloudinary configured successfully');
};

// Export the configured cloudinary instance for use in other parts of the application
export default cloudinary;