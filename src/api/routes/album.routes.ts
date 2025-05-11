import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware';
import {
  createAlbum,
  getAlbums,
  getAlbumById,
  getMyAlbums,
  updateAlbum,
  deleteAlbum
} from '../controllers/album.controller';
import { getMediaItemsByAlbum } from '../controllers/mediaItem.controller';

// Create router
const router = Router();

// Protect all routes
router.use(protect);

/**
 * @route POST /api/albums
 * @desc Create a new album
 * @access Private
 */
router.post('/', createAlbum);

/**
 * @route GET /api/albums
 * @desc Get all albums that the user has access to
 * @access Private
 */
router.get('/', getAlbums);

/**
 * @route GET /api/albums/my
 * @desc Get all albums owned by the authenticated user
 * @access Private
 */
router.get('/my', getMyAlbums);

/**
 * @route GET /api/albums/:id
 * @desc Get a single album by ID
 * @access Private
 */
router.get('/:id', getAlbumById);

/**
 * @route PATCH /api/albums/:id
 * @desc Update an album
 * @access Private
 */
router.patch('/:id', updateAlbum);

/**
 * @route DELETE /api/albums/:id
 * @desc Delete an album
 * @access Private
 */
router.delete('/:id', deleteAlbum);

/**
 * @route GET /api/albums/:albumId/media
 * @desc Get all media items in an album
 * @access Private
 */
router.get('/:albumId/media', getMediaItemsByAlbum);

export default router;
