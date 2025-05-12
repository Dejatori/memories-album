import { Request, Response, NextFunction } from 'express';
import { fileUploadSchema, updateMediaItemSchema } from '../validators/mediaItem.validator';
import * as mediaItemService from '../services/mediaItem.service';
import Album from '../models/Album.model';
import createHttpError from 'http-errors';
import { isZodError } from "../../types/errors";
import { IUser } from '../models/User.model';

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

    // Check if the album exists, and the user has access to it.
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
    const type: 'image' | 'video' = req.file.mimetype.startsWith('image/') ? 'image' : 'video';

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
  } catch (err) {
    // If it's a Zod validation error, format it nicely
    if (isZodError(err)) {
      return next(createHttpError(400, {
        message: 'Validation error',
        errors: err.errors
      }));
    }

    // Pass other errors to the error handler middleware
    next(err);
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
  } catch (err) {
    next(err);
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
  } catch (err) {
    next(err);
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
  } catch (err) {
    // If it's a Zod validation error, format it nicely
    if (isZodError(err)) {
      return next(createHttpError(400, {
        message: 'Validation error',
        errors: err.errors
      }));
    }

    // Pass other errors to the error handler middleware
    next(err);
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
  } catch (err) {
    next(err);
  }
};

/**
 * Uploads multiple files to Cloudinary and creates media items
 * @route POST /api/media/multiple
 * @access Private
 */
export const uploadMultipleMedia = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if files exist in the request
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return next(createHttpError(400, 'No files uploaded'));
    }

    const files = req.files as Express.Multer.File[];

    // Validate the request body (albumId)
    // Nota: El title y description se podrían manejar por archivo si se envían como un array en el body,
    // o se puede aplicar un title/description genérico o ninguno.
    // Aquí validamos solo albumId que es común para todos los archivos.
    const validatedBody = fileUploadSchema.parse(req.body);
    const { albumId } = validatedBody;
    const userId = (req.user as IUser)._id.toString(); // Usar aserción de tipo

    // Check if the album exists, and the user has access to it.
    const album = await Album.findById(albumId);
    if (!album) {
      return next(createHttpError(404, 'Album not found'));
    }
    if (album.owner.toString() !== userId) {
      return next(createHttpError(403, 'You do not have permission to add media to this album'));
    }

    const createdMediaItems = [];

    for (const file of files) {
      // Upload a file to Cloudinary
      const cloudinaryResult = await mediaItemService.uploadToCloudinary(file);

      // Determine media type from mimetype
      const type: 'image' | 'video' = file.mimetype.startsWith('image/') ? 'image' : 'video';

      // Create media item data
      // Para title y description, podrías tomarlos de req.body si se envían como arrays
      // correspondientes a cada archivo, o dejarlos opcionales/vacíos.
      // Ejemplo: req.body.titles[index], req.body.descriptions[index]
      // Por simplicidad, aquí no se asignan títulos/descripciones individuales desde el body.
      const mediaData = {
        type,
        cloudinaryPublicId: cloudinaryResult.public_id,
        cloudinaryUrl: cloudinaryResult.secure_url,
        thumbnailUrl: cloudinaryResult.thumbnail_url,
        albumId: albumId,
        // title: req.body.titles?.[files.indexOf(file)] || file.originalname, // Ejemplo
        // description: req.body.descriptions?.[files.indexOf(file)], // Ejemplo
      };

      // Create media item in database
      const mediaItem = await mediaItemService.createMediaItem(mediaData, userId);
      createdMediaItems.push(mediaItem);
    }

    // Return success response with media items data
    res.status(201).json({
      status: 'success',
      message: `${createdMediaItems.length} files uploaded successfully.`,
      data: {
        mediaItems: createdMediaItems
      }
    });
  } catch (err) {
    // If it's a Zod validation error, format it nicely
    if (isZodError(err)) {
      return next(createHttpError(400, {
        message: 'Validation error',
        errors: err.errors
      }));
    }
    // Pass other errors to the error handler middleware
    next(err);
  }
};