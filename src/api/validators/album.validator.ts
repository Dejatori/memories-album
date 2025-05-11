import { z } from 'zod';

/**
 * Zod schema for creating a new album
 */
export const createAlbumSchema = z.object({
  name: z
    .string()
    .min(1, 'Album name is required')
    .max(100, 'Album name cannot exceed 100 characters')
    .trim(),
  
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .trim()
    .optional(),
  
  isPublic: z
    .boolean()
    .default(false),
  
  coverImageUrl: z
    .string()
    .url('Cover image URL must be a valid URL')
    .optional(),
});

/**
 * Zod schema for updating an album
 */
export const updateAlbumSchema = z.object({
  name: z
    .string()
    .min(1, 'Album name is required')
    .max(100, 'Album name cannot exceed 100 characters')
    .trim()
    .optional(),
  
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .trim()
    .optional(),
  
  isPublic: z
    .boolean()
    .optional(),
  
  coverImageUrl: z
    .string()
    .url('Cover image URL must be a valid URL')
    .optional(),
});

// Types derived from the schemas
export type CreateAlbumInput = z.infer<typeof createAlbumSchema>;
export type UpdateAlbumInput = z.infer<typeof updateAlbumSchema>;
