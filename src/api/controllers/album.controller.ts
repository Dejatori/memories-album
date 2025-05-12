import { Request, Response, NextFunction } from 'express';
import { createAlbumSchema, updateAlbumSchema } from '../validators/album.validator';
import * as albumService from '../services/album.service';
import createHttpError from 'http-errors';
import { isZodError } from "../../types/errors";

/**
 * Creates a new album
 * @route POST /api/albums
 * @access Private
 */
export const createAlbum = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body against the to create album schema
    const validatedData = createAlbumSchema.parse(req.body);

    // Create the album using the album service
    const album = await albumService.createAlbum(validatedData, req.user!._id.toString());

    // Return success response with album data
    res.status(201).json({
      status: 'success',
      data: {
        album
      }
    });
  } catch (err: unknown) {
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
 * Gets all albums that the user has access to
 * This includes albums owned by the user and public albums
 * @route GET /api/albums
 * @access Private
 */
export const getAlbums = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get albums using the album service
    const albums = await albumService.getAlbums(req.user!._id.toString());

    // Return success response with album data
    res.status(200).json({
      status: 'success',
      results: albums.length,
      data: {
        albums
      }
    });
  } catch (err: unknown) {
    next(err);
  }
};

/**
 * Gets a single album by ID
 * Ensures the user has access to the album (owner or public)
 * @route GET /api/albums/:id
 * @access Private
 */
export const getAlbumById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get an album by ID using the album service
    const album = await albumService.getAlbumById(req.params.id, req.user!._id.toString());

    // Return success response with album data
    res.status(200).json({
      status: 'success',
      data: {
        album
      }
    });
  } catch (err: unknown) {
    next(err);
  }
};

/**
 * Gets all albums owned by the authenticated user
 * @route GET /api/albums/my
 * @access Private
 */
export const getMyAlbums = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get users' albums using the album service
    const albums = await albumService.getMyAlbums(req.user!._id.toString());

    // Return success response with data of the albums
    res.status(200).json({
      status: 'success',
      results: albums.length,
      data: {
        albums
      }
    });
  } catch (err: unknown) {
    next(err);
  }
};

/**
 * Updates an album
 * Ensures only the owner can update the album
 * @route PATCH /api/albums/:id
 * @access Private
 */
export const updateAlbum = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate a request body against the update album schema
    const validatedData = updateAlbumSchema.parse(req.body);

    // Update the album using the album service
    const album = await albumService.updateAlbum(
      req.params.id,
      validatedData,
      req.user!._id.toString()
    );

    // Return success response with updated albums data
    res.status(200).json({
      status: 'success',
      data: {
        album
      }
    });
  } catch (err: unknown) {
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
 * Deletes an album
 * Ensures only the owner can delete the album
 * Also deletes all media items associated with the album
 * @route DELETE /api/albums/:id
 * @access Private
 */
export const deleteAlbum = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Delete the album using the album service
    const result = await albumService.deleteAlbum(req.params.id, req.user!._id.toString());

    // Return success response with a message
    res.status(200).json({
      status: 'success',
      message: result.message
    });
  } catch (err: unknown) {
    next(err);
  }
};
