jest.mock('../src/api/models/Album.model', () => require('../__mocks__/mongooseModels').Album);
jest.mock('../src/api/models/MediaItem.model', () => require('../__mocks__/mongooseModels').MediaItem);
jest.mock('../src/api/models/User.model', () => require('../__mocks__/mongooseModels').User);

import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import User from '../src/api/models/User.model';
import Album from '../src/api/models/Album.model';
import MediaItem from '../src/api/models/MediaItem.model';
import * as mediaItemService from '../src/api/services/mediaItem.service';
import cloudinary from '../src/config/cloudinary';

// Test database connection URI
const MONGO_URI_TEST = process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/memories-album-test';

export const MOCK_USER_ID = 'mockUserId';
export const MOCK_OTHER_USER_ID = 'otherUserId';
export const MOCK_ALBUM_ID = 'mockAlbumId';
export const MOCK_MEDIA_ID = 'mockMediaId';

export const generateMockToken = (userId: string = MOCK_USER_ID): string => {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '1h' });
};

export const mockAuthenticatedUser = (userId: string = MOCK_USER_ID, isActive: boolean = true) => {
  (User.findById as jest.Mock).mockImplementation((idToFind: string) => {
    if (idToFind === userId) {
      return {
        select: jest.fn().mockResolvedValue({
          _id: userId,
          username: `mockUser-${userId}`,
          email: `mock-${userId}@example.com`,
          password: 'hashedPassword',
          isActive: isActive
        })
      };
    }
    return { // Simula el caso donde el usuario no se encuentra o es diferente
      select: jest.fn().mockResolvedValue(null)
    };
  });
};

export const mockAlbumFindById = (albumData: any) => {
  (Album.findById as jest.Mock).mockResolvedValueOnce(albumData);
};

export const mockMediaItemFindById = (mediaItemData: any) => {
  (MediaItem.findById as jest.Mock).mockResolvedValueOnce(mediaItemData);
};

// Ejemplo de un mock de álbum base
export const createMockAlbum = (ownerId: string, albumId: string, overrides: Partial<any> = {}) => ({
  _id: albumId,
  name: 'Mock Album',
  description: 'Mock Description',
  isPublic: false,
  owner: ownerId,
  mediaItems: [],
  save: jest.fn().mockResolvedValue(this), // 'this' se refiere al objeto mockAlbum en sí mismo
  toString: () => albumId,
  ...overrides,
});

// Ejemplo de un mock de media item base
export const createMockMediaItem = (uploaderId: string, albumId: string, mediaId: string, overrides: Partial<any> = {}) => ({
  _id: mediaId,
  album: albumId,
  uploader: uploaderId,
  title: 'Mock Media Item',
  description: 'Mock Media Description',
  url: 'https://mock.url/media.jpg',
  cloudinaryPublicId: 'mockCloudinaryId',
  save: jest.fn().mockResolvedValue(this),
  ...overrides,
});

// Mock Cloudinary upload function
jest.mock('../src/api/services/mediaItem.service', () => {
  const originalModule = jest.requireActual('../src/api/services/mediaItem.service');

  return {
    ...originalModule,
    uploadToCloudinary: jest.fn().mockImplementation(async (file) => {
      const isImage = file.mimetype.startsWith('image/');
      return {
        public_id: 'test_public_id',
        secure_url: 'https://res.cloudinary.com/test/image/upload/test_public_id',
        resource_type: isImage ? 'image' : 'video',
        format: isImage ? 'jpg' : 'mp4',
        width: 800,
        height: 600,
        duration: isImage ? undefined : 10,
        thumbnail_url: isImage ? undefined : 'https://res.cloudinary.com/test/image/upload/test_thumbnail'
      };
    })
  };
});

jest.mock('../src/config/cloudinary', () => ({
  __esModule: true,
  default: {
    uploader: {
      destroy: jest.fn()
    }
  }
}));

// Setup and teardown
beforeAll(async () => {
  try {
    // Connect to test database
    await mongoose.connect(MONGO_URI_TEST);
    console.log('Connected to test database');
  } catch (error) {
    console.error('Error connecting to test database:', error);
    process.exit(1);
  }
});

afterAll(async () => {
  // Disconnect from test database
  await mongoose.connection.close();
  console.log('Disconnected from test database');
});

let token: string;

// Clean up database before each test
beforeEach(async () => {
  token = generateMockToken(MOCK_USER_ID);
  mockAuthenticatedUser(MOCK_USER_ID);
  await User.deleteMany({});
  await Album.deleteMany({});
  await MediaItem.deleteMany({});
  jest.clearAllMocks();
});

describe('Album Routes', () => {
  describe('Album Creation', () => {

    it('should create a new album successfully', async () => {
      const mockAlbumSave = jest.fn().mockResolvedValue({});
      const mockCreatedAlbum = {
        _id: MOCK_ALBUM_ID,
        name: 'My Vacation',
        description: 'Photos from my summer vacation',
        isPublic: false,
        owner: MOCK_USER_ID,
        mediaItems: [],
        save: mockAlbumSave, // Usar el mock de save definido arriba
      };

      // Mock de Album.create para simular la creación del álbum
      (Album.create as jest.Mock).mockResolvedValueOnce(mockCreatedAlbum);
      // Si tu controlador llama a Album.findById después de crear, necesitarías mockearlo también:
      // mockAlbumFindById(mockCreatedAlbum); // Descomenta si es necesario

      const albumData = {
        name: 'My Vacation',
        description: 'Photos from my summer vacation',
        isPublic: false
      };

      const response = await request(app)
          .post('/api/albums')
          .set('Authorization', `Bearer ${token}`) // Usa el token generado en beforeEach
          .send(albumData);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.album.name).toBe(albumData.name);
      expect(response.body.data.album.owner.toString()).toBe(MOCK_USER_ID);

      expect(Album.create).toHaveBeenCalledWith({
        ...albumData,
        owner: MOCK_USER_ID,
        mediaItems: [] // Asegúrate que esto coincide con la lógica de tu servicio
      });
    });

    it('should return 400 if validation fails', async () => {
      // El token y el usuario autenticado ya están mockeados por el beforeEach
      // No es necesario mockear User.findById aquí de nuevo si el beforeEach lo cubre.

      // Datos inválidos (nombre vacío)
      const albumData = {
        name: '',
        description: 'Test Description',
        isPublic: false
      };

      const response = await request(app)
          .post('/api/albums')
          .set('Authorization', `Bearer ${token}`)
          .send(albumData);

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Validation error');
      expect(User.findById).toHaveBeenCalledWith(MOCK_USER_ID);
    });

    it('should return 401 if no token is provided', async () => {
      // Try to create an album without a token
      const albumData = {
        name: 'Test Album',
        description: 'Test Description',
        isPublic: false
      };

      const response = await request(app)
        .post('/api/albums')
        .send(albumData);

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
    });
  });

  describe('Get Albums', () => {
    it('should get all albums that the user has access to', async () => {
      // El token y el usuario autenticado ya están mockeados por el beforeEach

      // Mock de Album.find para devolver álbumes accesibles (propios y públicos)
      const mockUserAlbums = [
        createMockAlbum(MOCK_USER_ID, 'album1', { name: 'My Private Album', isPublic: false }),
        createMockAlbum(MOCK_OTHER_USER_ID, 'album2', { name: 'Public Album', isPublic: true })
      ];
      (Album.find as jest.Mock).mockImplementationOnce(() => ({
        sort: jest.fn().mockReturnValue(mockUserAlbums)
      }));

      const response = await request(app)
          .get('/api/albums')
          .set('Authorization', `Bearer ${token}`); // Usa el token del beforeEach

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.results).toBe(mockUserAlbums.length);
      expect(response.body.data.albums).toEqual(expect.arrayContaining([
        expect.objectContaining({ name: 'My Private Album', owner: MOCK_USER_ID }),
        expect.objectContaining({ name: 'Public Album', owner: MOCK_OTHER_USER_ID })
      ]));

      // Verifica que Album.find fue llamado con el filtro correcto
      expect(Album.find).toHaveBeenCalledWith({
        $or: [
          { owner: MOCK_USER_ID },
          { isPublic: true }
        ]
      });
      expect(User.findById).toHaveBeenCalledWith(MOCK_USER_ID);
    });

    it('should get a single album by ID if the user has access', async () => {
      const mockAlbumData = createMockAlbum(MOCK_USER_ID, MOCK_ALBUM_ID, { name: 'Accessible Album' });
      mockAlbumFindById(mockAlbumData);

      const response = await request(app)
          .get(`/api/albums/${MOCK_ALBUM_ID}`)
          .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.album._id).toBe(MOCK_ALBUM_ID);
      expect(response.body.data.album.name).toBe('Accessible Album');
      expect(Album.findById).toHaveBeenCalledWith(MOCK_ALBUM_ID);
      expect(User.findById).toHaveBeenCalledWith(MOCK_USER_ID);
    });

    it('should return 403 if user tries to access a private album they do not own', async () => {
      const privateAlbumData = createMockAlbum(MOCK_OTHER_USER_ID, MOCK_ALBUM_ID, { isPublic: false, name: 'Private Other Album' });
      mockAlbumFindById(privateAlbumData);

      const response = await request(app)
          .get(`/api/albums/${MOCK_ALBUM_ID}`)
          .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('You do not have permission to access this album');
      expect(Album.findById).toHaveBeenCalledWith(MOCK_ALBUM_ID);
      expect(User.findById).toHaveBeenCalledWith(MOCK_USER_ID);
    });

    it('should get all albums owned by the authenticated user', async () => {
      // El token y el usuario autenticado ya están mockeados por el beforeEach

      // Mock de Album.find para devolver solo los álbumes del usuario autenticado
      const userOwnedAlbums = [
        createMockAlbum(MOCK_USER_ID, 'album1', { name: 'User Private Album', isPublic: false }),
        createMockAlbum(MOCK_USER_ID, 'album2', { name: 'User Public Album', isPublic: true })
      ];
      (Album.find as jest.Mock).mockImplementationOnce(() => ({
        sort: jest.fn().mockReturnValue(userOwnedAlbums)
      }));

      const response = await request(app)
          .get('/api/albums/my')
          .set('Authorization', `Bearer ${token}`); // Usa el token del beforeEach

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.results).toBe(userOwnedAlbums.length);
      expect(response.body.data.albums).toEqual(expect.arrayContaining([
        expect.objectContaining({ name: 'User Private Album' }),
        expect.objectContaining({ name: 'User Public Album' })
      ]));

      // Verifica que Album.find fue llamado con el filtro correcto
      expect(Album.find).toHaveBeenCalledWith({ owner: MOCK_USER_ID });
      expect(User.findById).toHaveBeenCalledWith(MOCK_USER_ID);
    });
  });

  describe('Update Album', () => {
    it('should update an album if the user is the owner', async () => {
      // El token y el usuario autenticado (MOCK_USER_ID) ya están mockeados por el beforeEach

      const mockAlbumInstance = createMockAlbum(MOCK_USER_ID, MOCK_ALBUM_ID, {
        name: 'Old Album Name',
        description: 'Old Description',
      });

      // Mock de Album.findById para devolver el álbum
      mockAlbumFindById(mockAlbumInstance);

      // Mock del método save para simular la actualización
      const updatedAlbumData = {
        name: 'Updated Album Name',
        description: 'Updated Description',
        isPublic: true
      };
      (mockAlbumInstance.save as jest.Mock).mockResolvedValueOnce({
        ...mockAlbumInstance,
        ...updatedAlbumData
      });

      const response = await request(app)
          .patch(`/api/albums/${MOCK_ALBUM_ID}`)
          .set('Authorization', `Bearer ${token}`) // Usa el token del beforeEach
          .send(updatedAlbumData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.album.name).toBe(updatedAlbumData.name);
      expect(response.body.data.album.description).toBe(updatedAlbumData.description);
      expect(response.body.data.album.isPublic).toBe(updatedAlbumData.isPublic);

      expect(Album.findById).toHaveBeenCalledWith(MOCK_ALBUM_ID);
      expect(mockAlbumInstance.save).toHaveBeenCalled();
      expect(User.findById).toHaveBeenCalledWith(MOCK_USER_ID);
    });

    it('should return 403 if user tries to update an album they do not own', async () => {
      // El token y el usuario autenticado (MOCK_USER_ID) ya están mockeados por el beforeEach

      // Mock de Album.findById para devolver un álbum cuyo owner es MOCK_OTHER_USER_ID
      const mockAlbumFromOtherOwner = createMockAlbum(MOCK_OTHER_USER_ID, MOCK_ALBUM_ID, {
        name: 'Other Album',
      });
      mockAlbumFindById(mockAlbumFromOtherOwner);

      const updateData = {
        name: 'Updated Album Name'
      };

      const response = await request(app)
          .patch(`/api/albums/${MOCK_ALBUM_ID}`)
          .set('Authorization', `Bearer ${token}`) // Usa el token del beforeEach
          .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('You do not have permission to update this album');
      expect(Album.findById).toHaveBeenCalledWith(MOCK_ALBUM_ID);
      expect(User.findById).toHaveBeenCalledWith(MOCK_USER_ID);
      // Asegurarse de que save no fue llamado
      expect(mockAlbumFromOtherOwner.save).not.toHaveBeenCalled();
    });
  });

  describe('Delete Album', () => {
    it('should delete an album if the user is the owner', async () => {
      // El token y el usuario autenticado (MOCK_USER_ID) ya están mockeados por el beforeEach

      const mockAlbumToDelete = createMockAlbum(MOCK_USER_ID, MOCK_ALBUM_ID);
      mockAlbumFindById(mockAlbumToDelete); // Mockea Album.findById para devolver el álbum del owner

      (MediaItem.deleteMany as jest.Mock).mockResolvedValueOnce({ deletedCount: 5 }); // Simula eliminación de media items
      (Album.findByIdAndDelete as jest.Mock).mockResolvedValueOnce(mockAlbumToDelete); // Simula eliminación del álbum

      const response = await request(app)
          .delete(`/api/albums/${MOCK_ALBUM_ID}`)
          .set('Authorization', `Bearer ${token}`); // Usa el token del beforeEach

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Album deleted successfully');

      expect(Album.findById).toHaveBeenCalledWith(MOCK_ALBUM_ID);
      expect(MediaItem.deleteMany).toHaveBeenCalledWith({ album: MOCK_ALBUM_ID }, expect.anything());
      expect(Album.findByIdAndDelete).toHaveBeenCalledWith(MOCK_ALBUM_ID, expect.anything());
      expect(User.findById).toHaveBeenCalledWith(MOCK_USER_ID);
    });

    it('should return 403 if user tries to delete an album they do not own', async () => {
      // El token y el usuario autenticado (MOCK_USER_ID) ya están mockeados por el beforeEach

      // Mock de Album.findById para devolver un álbum cuyo owner es MOCK_OTHER_USER_ID
      const mockAlbumFromOtherOwner = createMockAlbum(MOCK_OTHER_USER_ID, MOCK_ALBUM_ID);
      mockAlbumFindById(mockAlbumFromOtherOwner);

      const response = await request(app)
          .delete(`/api/albums/${MOCK_ALBUM_ID}`)
          .set('Authorization', `Bearer ${token}`); // Usa el token del beforeEach

      expect(response.status).toBe(403);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('You do not have permission to delete this album');

      expect(Album.findById).toHaveBeenCalledWith(MOCK_ALBUM_ID);
      expect(User.findById).toHaveBeenCalledWith(MOCK_USER_ID);
      // Asegurarse de que no se intentó eliminar
      expect(Album.findByIdAndDelete).not.toHaveBeenCalled();
      expect(MediaItem.deleteMany).not.toHaveBeenCalled();
    });

    it('should delete all media items associated with the album', async () => {
      // El token y el usuario autenticado (MOCK_USER_ID) ya están mockeados por el beforeEach

      const mockAlbumToDelete = createMockAlbum(MOCK_USER_ID, MOCK_ALBUM_ID);
      mockAlbumFindById(mockAlbumToDelete);

      (MediaItem.deleteMany as jest.Mock).mockResolvedValueOnce({ deletedCount: 3 }); // Simula que se borraron 3 media items
      (Album.findByIdAndDelete as jest.Mock).mockResolvedValueOnce(mockAlbumToDelete);

      const response = await request(app)
          .delete(`/api/albums/${MOCK_ALBUM_ID}`)
          .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Album deleted successfully');

      expect(Album.findById).toHaveBeenCalledWith(MOCK_ALBUM_ID);
      expect(MediaItem.deleteMany).toHaveBeenCalledWith({ album: MOCK_ALBUM_ID }, expect.anything());
      expect(Album.findByIdAndDelete).toHaveBeenCalledWith(MOCK_ALBUM_ID, expect.anything());
      expect(User.findById).toHaveBeenCalledWith(MOCK_USER_ID);
    });
  });
});

describe('Media Item Routes', () => {
  describe('Media Upload', () => {
    it('should upload a media item successfully', async () => {
      const mockAlbum = createMockAlbum(MOCK_USER_ID, MOCK_ALBUM_ID);
      mockAuthenticatedUser(MOCK_USER_ID);

      // Mock de Album.findById para ambas llamadas (autenticación y servicio de media)
      (Album.findById as jest.Mock)
          .mockResolvedValueOnce(mockAlbum) // Para el middleware de autenticación (si aplica)
          .mockResolvedValueOnce(mockAlbum); // Para el servicio de media

      // Mock de uploadToCloudinary
      (mediaItemService.uploadToCloudinary as jest.Mock).mockResolvedValueOnce({
        public_id: 'test_public_id',
        secure_url: 'https://res.cloudinary.com/test/image/upload/test_public_id',
        resource_type: 'image',
        format: 'jpg',
        width: 800,
        height: 600
      });

      // Mock de MediaItem.create
      (MediaItem.create as jest.Mock).mockResolvedValueOnce({
        _id: MOCK_MEDIA_ID,
        album: MOCK_ALBUM_ID,
        uploader: MOCK_USER_ID,
        title: 'Test Media',
        description: 'Test Media Description',
        url: 'https://res.cloudinary.com/test/image/upload/test_public_id',
        resourceType: 'image',
        format: 'jpg',
        width: 800,
        height: 600
      });

      // Mock de Album.findByIdAndUpdate (si tu lógica lo requiere)
      (Album.findByIdAndUpdate as jest.Mock)?.mockResolvedValueOnce({});

      const mockFileBuffer = Buffer.from('test image content');
      const response = await request(app)
          .post('/api/media')
          .set('Authorization', `Bearer ${generateMockToken(MOCK_USER_ID)}`)
          .field('albumId', MOCK_ALBUM_ID)
          .field('title', 'Test Media')
          .field('description', 'Test Media Description')
          .attach('file', mockFileBuffer, 'test-image.jpg');

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.mediaItem.album).toBe(MOCK_ALBUM_ID);
      expect(response.body.data.mediaItem.uploader).toBe(MOCK_USER_ID);
    });

    it('should return 400 if no file is uploaded', async () => {
      // MOCK_USER_ID está autenticado por el beforeEach global
      const response = await request(app)
          .post('/api/media')
          .set('Authorization', `Bearer ${token}`) // Usa el token del beforeEach global
          .field('albumId', MOCK_ALBUM_ID)
          .field('title', 'Test Media');
      // No se adjunta archivo ".attach('file', ...)"

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('No file uploaded');
      // User.findById es llamado por el middleware de autenticación
      expect(User.findById).toHaveBeenCalledWith(MOCK_USER_ID);
      // Album.findById no debería ser llamado si el archivo es lo primero que se valida
      expect(Album.findById).not.toHaveBeenCalled();
      expect(mediaItemService.uploadToCloudinary).not.toHaveBeenCalled();
      expect(MediaItem.create).not.toHaveBeenCalled();
    });

    it('should return 403 if user tries to upload to an album they do not own', async () => {
      // MOCK_USER_ID está autenticado por el beforeEach global
      // Mock de Album.findById para devolver un álbum cuyo owner es MOCK_OTHER_USER_ID
      const mockAlbumFromOtherOwner = createMockAlbum(MOCK_OTHER_USER_ID, MOCK_ALBUM_ID);
      mockAlbumFindById(mockAlbumFromOtherOwner); // Configura Album.findById para que devuelva este álbum

      const mockFileBuffer = Buffer.from('test image content');
      const response = await request(app)
          .post('/api/media')
          .set('Authorization', `Bearer ${token}`) // Usa el token del beforeEach global (para MOCK_USER_ID)
          .field('albumId', MOCK_ALBUM_ID)
          .field('title', 'Test Media')
          .attach('file', mockFileBuffer, { filename: 'test-image.jpg', contentType: 'image/jpeg' });

      expect(response.status).toBe(403);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('You do not have permission to add media to this album');

      expect(User.findById).toHaveBeenCalledWith(MOCK_USER_ID);
      expect(Album.findById).toHaveBeenCalledWith(MOCK_ALBUM_ID); // Llamado por el controlador
      expect(mediaItemService.uploadToCloudinary).not.toHaveBeenCalled();
      expect(MediaItem.create).not.toHaveBeenCalled();
      // expect(Album.findByIdAndUpdate).not.toHaveBeenCalled(); // Si aplica
    });
  });

  describe('Get Media Items', () => {
    it('should get all media items in an album if the user has access', async () => {
      // Usuario autenticado y token ya están configurados por el beforeEach global
      const mockAlbum = createMockAlbum(MOCK_USER_ID, MOCK_ALBUM_ID, { isPublic: false });
      mockAlbumFindById(mockAlbum);

      const mockMediaItems = [
        createMockMediaItem(MOCK_USER_ID, MOCK_ALBUM_ID, 'media1', { title: 'Media 1' }),
        createMockMediaItem(MOCK_USER_ID, MOCK_ALBUM_ID, 'media2', { title: 'Media 2' })
      ];
      (MediaItem.find as jest.Mock).mockReturnValueOnce({
        sort: jest.fn().mockReturnValueOnce(mockMediaItems)
      });

      const response = await request(app)
          .get(`/api/albums/${MOCK_ALBUM_ID}/media`)
          .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.results).toBe(mockMediaItems.length);
      expect(response.body.data.mediaItems).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ title: 'Media 1' }),
            expect.objectContaining({ title: 'Media 2' })
          ])
      );
      expect(Album.findById).toHaveBeenCalledWith(MOCK_ALBUM_ID);
      expect(MediaItem.find).toHaveBeenCalledWith({ album: MOCK_ALBUM_ID });
      expect(User.findById).toHaveBeenCalledWith(MOCK_USER_ID);
    });

    it('should return 403 if user tries to access media in a private album they do not own', async () => {
      const privateAlbum = createMockAlbum(MOCK_OTHER_USER_ID, MOCK_ALBUM_ID, { isPublic: false });
      mockAlbumFindById(privateAlbum);

      const response = await request(app)
          .get(`/api/albums/${MOCK_ALBUM_ID}/media`)
          .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('You do not have permission to access this album');
      expect(Album.findById).toHaveBeenCalledWith(MOCK_ALBUM_ID);
      expect(MediaItem.find).not.toHaveBeenCalled();
      expect(User.findById).toHaveBeenCalledWith(MOCK_USER_ID);
    });

    it('should return 404 if album does not exist', async () => {
      (Album.findById as jest.Mock).mockResolvedValueOnce(null);

      const response = await request(app)
          .get(`/api/albums/${MOCK_ALBUM_ID}/media`)
          .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Album not found');
      expect(Album.findById).toHaveBeenCalledWith(MOCK_ALBUM_ID);
      expect(MediaItem.find).not.toHaveBeenCalled();
      expect(User.findById).toHaveBeenCalledWith(MOCK_USER_ID);
    });

    it('should get a single media item by ID if the user has access', async () => {
      // Usuario autenticado y token ya están configurados por el beforeEach global
      const mockMediaItem = createMockMediaItem(MOCK_USER_ID, MOCK_ALBUM_ID, MOCK_MEDIA_ID, {
        title: 'Test Media',
        url: 'https://test.com/media.jpg'
      });
      const mockAlbum = createMockAlbum(MOCK_USER_ID, MOCK_ALBUM_ID);

      mockMediaItemFindById(mockMediaItem);
      mockAlbumFindById(mockAlbum);

      const response = await request(app)
          .get(`/api/media/${MOCK_MEDIA_ID}`)
          .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.mediaItem._id).toBe(MOCK_MEDIA_ID);
      expect(response.body.data.mediaItem.title).toBe('Test Media');
      expect(MediaItem.findById).toHaveBeenCalledWith(MOCK_MEDIA_ID);
      expect(Album.findById).toHaveBeenCalledWith(MOCK_ALBUM_ID);
      expect(User.findById).toHaveBeenCalledWith(MOCK_USER_ID);
    });
  });

  describe('Update Media Item', () => {
    it('should update a media item if the user is the uploader', async () => {
      const mockMediaItem = createMockMediaItem(MOCK_USER_ID, MOCK_ALBUM_ID, MOCK_MEDIA_ID, {
        title: 'Old Title',
        description: 'Old Description',
        save: jest.fn().mockResolvedValue({
          _id: MOCK_MEDIA_ID,
          album: MOCK_ALBUM_ID,
          uploader: MOCK_USER_ID,
          title: 'New Title',
          description: 'New Description'
        })
      });
      mockMediaItemFindById(mockMediaItem);

      const updateData = { title: 'New Title', description: 'New Description' };

      const response = await request(app)
          .patch(`/api/media/${MOCK_MEDIA_ID}`)
          .set('Authorization', `Bearer ${token}`)
          .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.mediaItem.title).toBe('New Title');
      expect(response.body.data.mediaItem.description).toBe('New Description');
      expect(MediaItem.findById).toHaveBeenCalledWith(MOCK_MEDIA_ID);
      expect(mockMediaItem.save).toHaveBeenCalled();
      expect(User.findById).toHaveBeenCalledWith(MOCK_USER_ID);
    });

    it('should return 403 if user tries to update a media item they do not own', async () => {
      const mockMediaItem = createMockMediaItem(MOCK_OTHER_USER_ID, MOCK_ALBUM_ID, MOCK_MEDIA_ID, {
        title: 'Old Title',
        description: 'Old Description',
        save: jest.fn()
      });
      mockMediaItemFindById(mockMediaItem);

      const updateData = { title: 'New Title' };

      const response = await request(app)
          .patch(`/api/media/${MOCK_MEDIA_ID}`)
          .set('Authorization', `Bearer ${token}`)
          .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('You do not have permission to update this media item');
      expect(MediaItem.findById).toHaveBeenCalledWith(MOCK_MEDIA_ID);
      expect(mockMediaItem.save).not.toHaveBeenCalled();
      expect(User.findById).toHaveBeenCalledWith(MOCK_USER_ID);
    });

    it('should return 404 if media item does not exist', async () => {
      (MediaItem.findById as jest.Mock).mockResolvedValueOnce(null);

      const updateData = { title: 'New Title' };

      const response = await request(app)
          .patch(`/api/media/${MOCK_MEDIA_ID}`)
          .set('Authorization', `Bearer ${token}`)
          .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Media item not found');
      expect(MediaItem.findById).toHaveBeenCalledWith(MOCK_MEDIA_ID);
      expect(User.findById).toHaveBeenCalledWith(MOCK_USER_ID);
    });
  });

  describe('Delete Media Item', () => {
    it('should delete a media item if the user is the uploader', async () => {
      const mockMediaItem = createMockMediaItem(MOCK_USER_ID, MOCK_ALBUM_ID, MOCK_MEDIA_ID, {
        cloudinaryPublicId: 'mockCloudinaryId'
      });
      const mockAlbum = createMockAlbum(MOCK_USER_ID, MOCK_ALBUM_ID, {
        mediaItems: [MOCK_MEDIA_ID]
      });

      mockMediaItemFindById(mockMediaItem);
      mockAlbumFindById(mockAlbum);

      // Mock de transacción de mongoose
      const mockSession = {
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        endSession: jest.fn()
      };
      jest.spyOn(mongoose, 'startSession').mockResolvedValueOnce(mockSession as any);

      // Mock de eliminación en MediaItem y actualización en Album
      (MediaItem.findByIdAndDelete as jest.Mock).mockResolvedValueOnce(mockMediaItem);
      mockAlbum.save.mockResolvedValueOnce(mockAlbum);

      // Mock de cloudinary
      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValueOnce({ result: 'ok' });

      const response = await request(app)
          .delete(`/api/media/${MOCK_MEDIA_ID}`)
          .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Media item deleted successfully');
      expect(MediaItem.findById).toHaveBeenCalledWith(MOCK_MEDIA_ID);
      expect(Album.findById).toHaveBeenCalledWith(MOCK_ALBUM_ID);
      expect(MediaItem.findByIdAndDelete).toHaveBeenCalledWith(MOCK_MEDIA_ID, { session: mockSession });
      expect(mockAlbum.save).toHaveBeenCalledWith({ session: mockSession });
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('mockCloudinaryId');
      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
      expect(User.findById).toHaveBeenCalledWith(MOCK_USER_ID);
    });

    it('should return 403 if user is not uploader nor album owner', async () => {
      const mockMediaItem = createMockMediaItem(MOCK_OTHER_USER_ID, MOCK_ALBUM_ID, MOCK_MEDIA_ID, {
        cloudinaryPublicId: 'mockCloudinaryId'
      });
      const mockAlbum = createMockAlbum('anotherOwner', MOCK_ALBUM_ID, {
        mediaItems: [MOCK_MEDIA_ID]
      });

      mockMediaItemFindById(mockMediaItem);
      mockAlbumFindById(mockAlbum);

      const response = await request(app)
          .delete(`/api/media/${MOCK_MEDIA_ID}`)
          .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('You do not have permission to delete this media item');
      expect(MediaItem.findById).toHaveBeenCalledWith(MOCK_MEDIA_ID);
      expect(Album.findById).toHaveBeenCalledWith(MOCK_ALBUM_ID);
      expect(MediaItem.findByIdAndDelete).not.toHaveBeenCalled();
      expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
      expect(User.findById).toHaveBeenCalledWith(MOCK_USER_ID);
    });

    it('should return 404 if media item does not exist', async () => {
      (MediaItem.findById as jest.Mock).mockResolvedValueOnce(null);

      const response = await request(app)
          .delete(`/api/media/${MOCK_MEDIA_ID}`)
          .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Media item not found');
      expect(MediaItem.findById).toHaveBeenCalledWith(MOCK_MEDIA_ID);
      expect(Album.findById).not.toHaveBeenCalled();
      expect(MediaItem.findByIdAndDelete).not.toHaveBeenCalled();
      expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
      expect(User.findById).toHaveBeenCalledWith(MOCK_USER_ID);
    });
  });
});
