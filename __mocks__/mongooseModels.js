const mockAlbum = {
    _id: 'mockAlbumId',
    name: 'Mock Album',
    owner: 'mockUserId',
    isPublic: false,
    mediaItems: [],
    save: jest.fn().mockResolvedValue(this),
};

const mockAlbums = [
    { _id: 'album1', name: 'My Private Album', owner: 'mockUserId', isPublic: false, mediaItems: [] },
    { _id: 'album2', name: 'Public Album', owner: 'otherUserId', isPublic: true, mediaItems: [] }
];

const mockMediaItem = {
    _id: 'mockMediaId',
    album: 'mockAlbumId',
    uploader: 'mockUserId',
    save: jest.fn().mockResolvedValue(this),
};

const mockMediaItems = [
    {
        _id: 'media1',
        album: 'mockAlbumId',
        uploader: 'mockUserId',
        title: 'Media 1',
        url: 'https://test.com/media1.jpg'
    },
    {
        _id: 'media2',
        album: 'mockAlbumId',
        uploader: 'mockUserId',
        title: 'Media 2',
        url: 'https://test.com/media2.jpg'
    }
];

module.exports = {
    Album: {
        findById: jest.fn().mockResolvedValue(mockAlbum),
        find: jest.fn().mockResolvedValue([mockAlbum]),
        findAlbums: jest.fn().mockImplementation(() => ({
            sort: jest.fn().mockReturnValue(mockAlbums)
        })),
        create: jest.fn().mockResolvedValue(mockAlbum),
        findByIdAndDelete: jest.fn().mockResolvedValue(mockAlbum),
        deleteMany: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    },
    MediaItem: {
        findById: jest.fn().mockResolvedValue(mockMediaItem),
        find: jest.fn().mockResolvedValue([mockMediaItem]),
        findMediaItems: jest.fn().mockImplementation(() => ({
            sort: jest.fn().mockReturnValue(mockMediaItems)
        })),
        create: jest.fn().mockResolvedValue(mockMediaItem),
        deleteMany: jest.fn().mockResolvedValue({ deletedCount: 1 }),
        findByIdAndDelete: jest.fn().mockResolvedValue(mockMediaItem),
    },
    User: {
        findById: jest.fn().mockResolvedValue({ _id: 'mockUserId' }),
        create: jest.fn().mockResolvedValue({ _id: 'mockUserId' }),
        deleteMany: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    },
};