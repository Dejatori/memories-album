import { Router } from 'express';
import {protect, requireAuth} from '../middlewares/auth.middleware';
import { uploadSingleFile, uploadMultipleFiles, handleMulterError } from '../middlewares/upload.middleware';
import {
  uploadMedia,
  uploadMultipleMedia,
  getMediaItemById,
  updateMediaItem,
  deleteMediaItem
} from '../controllers/mediaItem.controller';

// Create router
const router = Router();

// Protect all routes
router.use(protect);
router.use(requireAuth);

/**
 * @route POST /api/media
 * @desc Upload a file to Cloudinary and create a media item
 * @access Private
 */
router.post('/', uploadSingleFile, handleMulterError, uploadMedia);

/**
 * @route POST /api/media/multiple
 * @desc Upload multiple files to Cloudinary and create media items
 * @access Private
 */
router.post('/multiple', uploadMultipleFiles(5), handleMulterError, uploadMultipleMedia);

/**
 * @route GET /api/media/:id
 * @desc Get a single media item by ID
 * @access Private
 */
router.get('/:id', getMediaItemById);

/**
 * @route PATCH /api/media/:id
 * @desc Update a media item
 * @access Private
 */
router.patch('/:id', updateMediaItem);

/**
 * @route DELETE /api/media/:id
 * @desc Delete a media item
 * @access Private
 */
router.delete('/:id', deleteMediaItem);

export default router;