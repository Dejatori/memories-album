import React from 'react';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Welcome to Memories Album</h1>
      <p className="mb-4">
        This is a platform where you can create albums and store your precious memories.
      </p>
      <div className="flex gap-4 mt-6">
        <Link 
          to="/login" 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Login
        </Link>
        <Link 
          to="/album/example" 
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
        >
          View Sample Album
        </Link>
      </div>
    </div>
  );
};

export default HomePage;
