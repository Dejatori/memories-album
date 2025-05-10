import React from 'react';
import { useParams, Link } from 'react-router-dom';

const AlbumDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  // In a real application, this would fetch album data from an API
  const albumData = {
    id,
    title: 'Sample Album',
    description: 'This is a sample album to demonstrate the UI',
    createdAt: new Date().toLocaleDateString(),
    images: [
      { id: '1', url: 'https://via.placeholder.com/300x200?text=Memory+1', title: 'Memory 1' },
      { id: '2', url: 'https://via.placeholder.com/300x200?text=Memory+2', title: 'Memory 2' },
      { id: '3', url: 'https://via.placeholder.com/300x200?text=Memory+3', title: 'Memory 3' },
    ]
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4">
        <Link to="/" className="text-blue-600 hover:underline">
          &larr; Back to Home
        </Link>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-2">{albumData.title}</h1>
        <p className="text-gray-600 mb-4">Created on: {albumData.createdAt}</p>
        <p className="mb-6">{albumData.description}</p>
        
        <h2 className="text-xl font-semibold mb-4">Memories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {albumData.images.map(image => (
            <div key={image.id} className="border rounded-lg overflow-hidden">
              <img 
                src={image.url} 
                alt={image.title} 
                className="w-full h-48 object-cover"
              />
              <div className="p-3">
                <h3 className="font-medium">{image.title}</h3>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-8">
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Add New Memory
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlbumDetailPage;
