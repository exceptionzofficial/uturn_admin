import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Production URL with trailing slash
const API_BASE_URL = 'https://uturn-nl7u.onrender.com/api/'; 

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60s for Render cold start
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;
