import { z } from 'zod';

/**
 * Zod schema for creating a new media item
 * Note: This is used for validation after the file has been uploaded to Cloudinary.
 */
export const createMediaItemSchema = z.object({
  type: z
    .enum(['image', 'video'], {
      errorMap: () => ({ message: 'Only image and video files are allowed' }),
    }),

  cloudinaryPublicId: z
    .string()
    .min(1, 'Cloudinary public ID is required'),
  
  cloudinaryUrl: z
    .string()
    .url('Cloudinary URL must be a valid URL'),
  
  thumbnailUrl: z
    .string()
    .url('Thumbnail URL must be a valid URL')
    .optional(),
  
  title: z
    .string()
    .max(100, 'Title cannot exceed 100 characters')
    .trim()
    .optional(),
  
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .trim()
    .optional(),
  
  albumId: z
    .string()
    .min(1, 'Album ID is required'),
});

/**
 * Zod schema for updating a media item
 */
export const updateMediaItemSchema = z.object({
  title: z
    .string()
    .max(100, 'Title cannot exceed 100 characters')
    .trim()
    .optional(),
  
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .trim()
    .optional(),
});

/**
 * Zod schema for validating file uploads
 */
export const fileUploadSchema = z.object({
  albumId: z
    .string()
    .min(1, 'Album ID is required'),
});

// Types derived from the schemas
export type CreateMediaItemInput = z.infer<typeof createMediaItemSchema>;
export type UpdateMediaItemInput = z.infer<typeof updateMediaItemSchema>;
export type FileUploadInput = z.infer<typeof fileUploadSchema>;