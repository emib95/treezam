import axios from 'axios';

// Get the base URL, defaulting to localhost for development
// In production, this should be set to your production API URL
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Export the base URL for image URLs (Bug 3 Fix)
export const getImageUrl = (imagePath) => {
  // Remove /api from base URL and add the image path
  const baseUrl = API_BASE_URL.replace('/api', '');
  return `${baseUrl}${imagePath}`;
};

export default api;
