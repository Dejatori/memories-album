/// <reference types="vite/client" />
import axios from 'axios';
import logger from '../config/logging_conf';

// Create an axios instance with the default configuration
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // If a token exists, add it to the request headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle specific error cases
    if (error.response) {
      // The request was made, and the server responded with a status code
      // that falls out of the range of 2xx
      const { status } = error.response;
      
      if (status === 401) {
        // Unauthorized — clear token and redirect to login
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      
      if (status === 403) {
        // Forbidden — user doesn't have permission
        logger.error('Forbidden: You do not have permission to access this resource');
      }
    } else if (error.request) {
      // The request was made but no response was received
      logger.error('No response received from server:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      logger.error('Error setting up request:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
