import { Request, Response, NextFunction } from 'express';
import { fileUploadSchema, updateMediaItemSchema } from '../validators/mediaItem.validator';
import * as mediaItemService from '../services/mediaItem.service';
import Album from '../models/Album.model';
import createHttpError from 'http-errors';

/**
 * Uploads a file to Cloudinary and creates a media item
 * @route POST /api/media
 * @access Private
 */
export const uploadMedia = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if a file exists in a request
    if (!req.file) {
      return next(createHttpError(400, 'No file uploaded'));
    }

    // Validate the request body against the file upload schema
    const validatedData = fileUploadSchema.parse(req.body);

    // Check if the album exists and the user has access to it
    const album = await Album.findById(validatedData.albumId);
    if (!album) {
      return next(createHttpError(404, 'Album not found'));
    }
    if (album.owner.toString() !== req.user!._id.toString()) {
      return next(createHttpError(403, 'You do not have permission to add media to this album'));
    }

    // Upload a file to Cloudinary
    const cloudinaryResult = await mediaItemService.uploadToCloudinary(req.file);

    // Determine media type from mimetype
    const type = req.file.mimetype.startsWith('image/') ? 'image' : 'video';

    // Create media item data
    const mediaData = {
      type,
      cloudinaryPublicId: cloudinaryResult.public_id,
      cloudinaryUrl: cloudinaryResult.secure_url,
      thumbnailUrl: cloudinaryResult.thumbnail_url,
      albumId: validatedData.albumId,
      title: req.body.title,
      description: req.body.description
    };

    // Create media item in database
    const mediaItem = await mediaItemService.createMediaItem(mediaData, req.user!._id.toString());

    // Return success response with media item data
    res.status(201).json({
      status: 'success',
      data: {
        mediaItem
      }
    });
  } catch (error) {
    // If it's a Zod validation error, format it nicely
    if (error.name === 'ZodError') {
      return next(createHttpError(400, {
        message: 'Validation error',
        errors: error.errors
      }));
    }

    // Pass other errors to the error handler middleware
    next(error);
  }
};

/**
 * Gets all media items in an album
 * @route GET /api/albums/:albumId/media
 * @access Private
 */
export const getMediaItemsByAlbum = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get media items using the media item service
    const mediaItems = await mediaItemService.getMediaItemsByAlbum(
      req.params.albumId,
      req.user!._id.toString()
    );

    // Return success response with media items data
    res.status(200).json({
      status: 'success',
      results: mediaItems.length,
      data: {
        mediaItems
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Gets a single media item by ID
 * @route GET /api/media/:id
 * @access Private
 */
export const getMediaItemById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get a media item by ID using the media item service.
    const mediaItem = await mediaItemService.getMediaItemById(
      req.params.id,
      req.user!._id.toString()
    );

    // Return success response with media item data
    res.status(200).json({
      status: 'success',
      data: {
        mediaItem
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Updates a media item
 * @route PATCH /api/media/:id
 * @access Private
 */
export const updateMediaItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body against the update media item schema
    const validatedData = updateMediaItemSchema.parse(req.body);

    // Update the media item using the media item service
    const mediaItem = await mediaItemService.updateMediaItem(
      req.params.id,
      validatedData,
      req.user!._id.toString()
    );

    // Return success response with updated media item data
    res.status(200).json({
      status: 'success',
      data: {
        mediaItem
      }
    });
  } catch (error) {
    // If it's a Zod validation error, format it nicely
    if (error.name === 'ZodError') {
      return next(createHttpError(400, {
        message: 'Validation error',
        errors: error.errors
      }));
    }

    // Pass other errors to the error handler middleware
    next(error);
  }
};

/**
 * Deletes a media item
 * @route DELETE /api/media/:id
 * @access Private
 */
export const deleteMediaItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Delete the media item using the media item service
    const result = await mediaItemService.deleteMediaItem(
      req.params.id,
      req.user!._id.toString()
    );

    // Return success response with a message
    res.status(200).json({
      status: 'success',
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};