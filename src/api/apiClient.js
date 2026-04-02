import axios from 'axios';

const API_BASE_URL = 'https://a22b-2401-4900-93e4-8fe7-dd94-3335-b9c0-6b69.ngrok-free.app/api'; // Standard Android Emulator Loopback

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
