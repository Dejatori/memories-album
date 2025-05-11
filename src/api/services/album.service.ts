import createHttpError from 'http-errors';
import Album, { IAlbum } from '../models/Album.model';
import MediaItem from '../models/MediaItem.model';
import { CreateAlbumInput, UpdateAlbumInput } from '../validators/album.validator';
import mongoose from 'mongoose';

/**
 * Creates a new album
 * @param albumData - Album data from request body
 * @param userId - ID of the user creating the album
 * @returns The created album
 */
export const createAlbum = async (albumData: CreateAlbumInput, userId: string): Promise<IAlbum> => {
  try {
    // Create new album with owner set to the authenticated user
    const album = await Album.create({
      ...albumData,
      owner: userId,
      mediaItems: []
    });

    return album;
  } catch (error) {
    // Handle potential errors
    if (error instanceof mongoose.Error.ValidationError) {
      throw createHttpError(400, 'Invalid album data');
    }
    throw error;
  }
};

/**
 * Gets all albums that the user has access to
 * This includes albums owned by the user and public albums
 * @param userId - ID of the authenticated user
 * @returns Array of albums
 */
export const getAlbums = async (userId: string): Promise<IAlbum[]> => {
  // Find albums that are either owned by the user or are public
  const albums = await Album.find({
    $or: [
      { owner: userId },
      { isPublic: true }
    ]
  }).sort({ createdAt: -1 }); // Sort by creation date, newest first

  return albums;
};

/**
 * Gets a single album by ID
 * Ensures the user has access to the album (owner or public)
 * @param albumId - ID of the album to retrieve
 * @param userId - ID of the authenticated user
 * @returns The album if found and accessible
 */
export const getAlbumById = async (albumId: string, userId: string): Promise<IAlbum> => {
  try {
    // Find album by ID
    const album = await Album.findById(albumId);

    // Check if album exists
    if (!album) {
      throw createHttpError(404, 'Album not found');
    }

    // Check if user has access to the album
    if (!album.isPublic && album.owner.toString() !== userId) {
      throw createHttpError(403, 'You do not have permission to access this album');
    }

    return album;
  } catch (error) {
    // Handle potential errors
    if (error instanceof mongoose.Error.CastError) {
      throw createHttpError(400, 'Invalid album ID');
    }
    throw error;
  }
};

/**
 * Gets all albums owned by the authenticated user
 * @param userId - ID of the authenticated user
 * @returns Array of albums owned by the user
 */
export const getMyAlbums = async (userId: string): Promise<IAlbum[]> => {
  // Find albums owned by the user
  const albums = await Album.find({ owner: userId }).sort({ createdAt: -1 });

  return albums;
};

/**
 * Updates an album
 * Ensures only the owner can update the album
 * @param albumId - ID of the album to update
 * @param updateData - Album data to update
 * @param userId - ID of the authenticated user
 * @returns The updated album
 */
export const updateAlbum = async (
  albumId: string,
  updateData: UpdateAlbumInput,
  userId: string
): Promise<IAlbum> => {
  try {
    // Find album by ID
    const album = await Album.findById(albumId);

    // Check if album exists
    if (!album) {
      throw createHttpError(404, 'Album not found');
    }

    // Check if user is the owner of the album
    if (album.owner.toString() !== userId) {
      throw createHttpError(403, 'You do not have permission to update this album');
    }

    // Update album with new data
    Object.assign(album, updateData);
    await album.save();

    return album;
  } catch (error) {
    // Handle potential errors
    if (error instanceof mongoose.Error.CastError) {
      throw createHttpError(400, 'Invalid album ID');
    }
    if (error instanceof mongoose.Error.ValidationError) {
      throw createHttpError(400, 'Invalid album data');
    }
    throw error;
  }
};

/**
 * Deletes an album
 * Ensures only the owner can delete the album
 * Also deletes all media items associated with the album
 * @param albumId - ID of the album to delete
 * @param userId - ID of the authenticated user
 * @returns Success message
 */
export const deleteAlbum = async (albumId: string, userId: string): Promise<{ message: string }> => {
  try {
    // Find album by ID
    const album = await Album.findById(albumId);

    // Check if album exists
    if (!album) {
      throw createHttpError(404, 'Album not found');
    }

    // Check if user is the owner of the album
    if (album.owner.toString() !== userId) {
      throw createHttpError(403, 'You do not have permission to delete this album');
    }

    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Delete all media items associated with the album
      await MediaItem.deleteMany({ album: albumId }, { session });

      // Delete the album
      await Album.findByIdAndDelete(albumId, { session });

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

      return { message: 'Album deleted successfully' };
    } catch (error) {
      // Abort the transaction on error
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    // Handle potential errors
    if (error instanceof mongoose.Error.CastError) {
      throw createHttpError(400, 'Invalid album ID');
    }
    throw error;
  }
};
