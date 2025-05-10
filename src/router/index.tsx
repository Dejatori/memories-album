import { RouteObject } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import AlbumDetailPage from '../pages/AlbumDetailPage';

// Define the routes for the application
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/album/:id',
    element: <AlbumDetailPage />,
  },
  {
    path: '*',
    element: <div>Page not found</div>,
  },
];
