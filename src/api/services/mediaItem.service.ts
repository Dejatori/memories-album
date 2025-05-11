import createHttpError from 'http-errors';
import cloudinary from '../../config/cloudinary';
import MediaItem, { IMediaItem } from '../models/MediaItem.model';
import Album from '../models/Album.model';
import { CreateMediaItemInput, UpdateMediaItemInput } from '../validators/mediaItem.validator';
import mongoose from 'mongoose';

/**
 * Interface for file upload result from Cloudinary
 */
interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  resource_type: string;
  format: string;
  width?: number;
  height?: number;
  duration?: number;
  thumbnail_url?: string;
}

/**
 * Uploads a file to Cloudinary
 * @param file - File buffer and metadata
 * @param folder - Cloudinary folder to upload to
 * @returns Cloudinary upload result
 */
export const uploadToCloudinary = async (
  file: Express.Multer.File,
  folder = 'memories-album'
): Promise<CloudinaryUploadResult> => {
  try {
    // Convert file buffer to base64 string
    const fileBase64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    
    // Determine resource type based on mimetype
    const resourceType = file.mimetype.startsWith('image/') ? 'image' : 'video';
    
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(fileBase64, {
      resource_type: resourceType,
      folder,
      // Generate thumbnail for videos
      ...(resourceType === 'video' && { 
        eager: [{ width: 300, height: 300, crop: 'fill', format: 'jpg' }]
      })
    });
    
    // Return formatted result
    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      resource_type: result.resource_type,
      format: result.format,
      width: result.width,
      height: result.height,
      duration: result.duration,
      thumbnail_url: resourceType === 'video' && result.eager && result.eager[0] 
        ? result.eager[0].secure_url 
        : undefined
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw createHttpError(500, 'Failed to upload file to Cloudinary');
  }
};

/**
 * Creates a new media item
 * @param mediaData - Media item data
 * @param userId - ID of the authenticated user
 * @returns The created media item
 */
export const createMediaItem = async (
  mediaData: CreateMediaItemInput,
  userId: string
): Promise<IMediaItem> => {
  try {
    const { albumId, ...restData } = mediaData;
    
    // Check if album exists and user has access
    const album = await Album.findById(albumId);
    if (!album) {
      throw createHttpError(404, 'Album not found');
    }
    
    // Check if user is the owner of the album
    if (album.owner.toString() !== userId) {
      throw createHttpError(403, 'You do not have permission to add media to this album');
    }
    
    // Create new media item
    const mediaItem = await MediaItem.create({
      ...restData,
      uploader: userId,
      album: albumId
    });
    
    // Add media item to album
    album.mediaItems.push(mediaItem._id);
    await album.save();
    
    return mediaItem;
  } catch (error) {
    // Handle potential errors
    if (error instanceof mongoose.Error.ValidationError) {
      throw createHttpError(400, 'Invalid media item data');
    }
    throw error;
  }
};

/**
 * Gets all media items in an album
 * Ensures the user has access to the album (owner or public)
 * @param albumId - ID of the album
 * @param userId - ID of the authenticated user
 * @returns Array of media items
 */
export const getMediaItemsByAlbum = async (
  albumId: string,
  userId: string
): Promise<IMediaItem[]> => {
  // Check if album exists and user has access
  const album = await Album.findById(albumId);
  if (!album) {
    throw createHttpError(404, 'Album not found');
  }
  
  // Check if user has access to the album
  if (!album.isPublic && album.owner.toString() !== userId) {
    throw createHttpError(403, 'You do not have permission to access this album');
  }
  
  // Find media items in the album
  const mediaItems = await MediaItem.find({ album: albumId }).sort({ createdAt: -1 });
  
  return mediaItems;
};

/**
 * Gets a single media item by ID
 * Ensures the user has access to the album containing the media item
 * @param mediaItemId - ID of the media item
 * @param userId - ID of the authenticated user
 * @returns The media item if found and accessible
 */
export const getMediaItemById = async (
  mediaItemId: string,
  userId: string
): Promise<IMediaItem> => {
  try {
    // Find media item by ID
    const mediaItem = await MediaItem.findById(mediaItemId);
    
    // Check if media item exists
    if (!mediaItem) {
      throw createHttpError(404, 'Media item not found');
    }
    
    // Check if album exists
    const album = await Album.findById(mediaItem.album);
    if (!album) {
      throw createHttpError(404, 'Album not found');
    }
    
    // Check if user has access to the album
    if (!album.isPublic && album.owner.toString() !== userId) {
      throw createHttpError(403, 'You do not have permission to access this media item');
    }
    
    return mediaItem;
  } catch (error) {
    // Handle potential errors
    if (error instanceof mongoose.Error.CastError) {
      throw createHttpError(400, 'Invalid media item ID');
    }
    throw error;
  }
};

/**
 * Updates a media item
 * Ensures only the uploader can update the media item
 * @param mediaItemId - ID of the media item to update
 * @param updateData - Media item data to update
 * @param userId - ID of the authenticated user
 * @returns The updated media item
 */
export const updateMediaItem = async (
  mediaItemId: string,
  updateData: UpdateMediaItemInput,
  userId: string
): Promise<IMediaItem> => {
  try {
    // Find media item by ID
    const mediaItem = await MediaItem.findById(mediaItemId);
    
    // Check if media item exists
    if (!mediaItem) {
      throw createHttpError(404, 'Media item not found');
    }
    
    // Check if user is the uploader of the media item
    if (mediaItem.uploader.toString() !== userId) {
      throw createHttpError(403, 'You do not have permission to update this media item');
    }
    
    // Update media item with new data
    Object.assign(mediaItem, updateData);
    await mediaItem.save();
    
    return mediaItem;
  } catch (error) {
    // Handle potential errors
    if (error instanceof mongoose.Error.CastError) {
      throw createHttpError(400, 'Invalid media item ID');
    }
    if (error instanceof mongoose.Error.ValidationError) {
      throw createHttpError(400, 'Invalid media item data');
    }
    throw error;
  }
};

/**
 * Deletes a media item
 * Ensures only the uploader or album owner can delete the media item
 * Also deletes the file from Cloudinary
 * @param mediaItemId - ID of the media item to delete
 * @param userId - ID of the authenticated user
 * @returns Success message
 */
export const deleteMediaItem = async (
  mediaItemId: string,
  userId: string
): Promise<{ message: string }> => {
  try {
    // Find media item by ID
    const mediaItem = await MediaItem.findById(mediaItemId);
    
    // Check if media item exists
    if (!mediaItem) {
      throw createHttpError(404, 'Media item not found');
    }
    
    // Find the album
    const album = await Album.findById(mediaItem.album);
    if (!album) {
      throw createHttpError(404, 'Album not found');
    }
    
    // Check if user is the uploader of the media item or the owner of the album
    const isUploader = mediaItem.uploader.toString() === userId;
    const isAlbumOwner = album.owner.toString() === userId;
    
    if (!isUploader && !isAlbumOwner) {
      throw createHttpError(403, 'You do not have permission to delete this media item');
    }
    
    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Delete the media item from the database
      await MediaItem.findByIdAndDelete(mediaItemId, { session });
      
      // Remove the media item from the album
      album.mediaItems = album.mediaItems.filter(
        id => id.toString() !== mediaItemId
      );
      await album.save({ session });
      
      // Commit the transaction
      await session.commitTransaction();
      session.endSession();
      
      // Delete the file from Cloudinary
      await cloudinary.uploader.destroy(mediaItem.cloudinaryPublicId);
      
      return { message: 'Media item deleted successfully' };
    } catch (error) {
      // Abort the transaction on error
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    // Handle potential errors
    if (error instanceof mongoose.Error.CastError) {
      throw createHttpError(400, 'Invalid media item ID');
    }
    throw error;
  }
};