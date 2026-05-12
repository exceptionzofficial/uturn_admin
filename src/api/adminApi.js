import apiClient from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const adminApi = {
  // Auth
  login: async (username, password) => {
    const response = await apiClient.post('admin/login', { username, password });
    if (response.data?.token) {
      await AsyncStorage.setItem('admin_token', response.data.token);
      await AsyncStorage.setItem('admin_data', JSON.stringify(response.data.admin));
    }
    return response.data;
  },
  
  logout: async () => {
    await AsyncStorage.removeItem('admin_token');
    await AsyncStorage.removeItem('admin_data');
  },

  getAdminData: async () => {
    const data = await AsyncStorage.getItem('admin_data');
    return data ? JSON.parse(data) : null;
  },

  // Sub-Admins
  getSubAdmins: async () => {
    const response = await apiClient.get('admin/sub-admins');
    return response.data;
  },
  createSubAdmin: async (data) => {
    const response = await apiClient.post('admin/sub-admins', data);
    return response.data;
  },
  updatePermissions: async (id, permissions) => {
    const response = await apiClient.put(`admin/sub-admins/${id}/permissions`, { permissions });
    return response.data;
  },

  // Dashboard & Logs
  getDashboard: async () => {
    const response = await apiClient.get('admin/detailed-dashboard');
    return response.data;
  },
  getLogs: async (limit = 100) => {
    const response = await apiClient.get(`admin/logs?limit=${limit}`);
    return response.data;
  },

  // Drivers
  getDrivers: async () => {
    const response = await apiClient.get('admin/drivers');
    return response.data;
  },
  getActiveDrivers: async () => {
    const response = await apiClient.get('admin/active-drivers');
    return response.data;
  },
  verifyDriver: async (id, verified, rejectionReason = '') => {
    const response = await apiClient.patch(`admin/drivers/${id}/verify`, { verified, rejectionReason });
    return response.data;
  },
  blockDriver: async (id, blocked, blockReason = '') => {
    const response = await apiClient.patch(`admin/drivers/${id}/block`, { blocked, blockReason });
    return response.data;
  },

  // Vendors
  getVendors: async () => {
    const response = await apiClient.get('admin/vendors');
    return response.data;
  },
  verifyVendor: async (id, verified, rejectionReason = '') => {
    const response = await apiClient.patch(`admin/vendors/${id}/verify`, { verified, rejectionReason });
    return response.data;
  },
  blockVendor: async (id, blocked, blockReason = '') => {
    const response = await apiClient.patch(`admin/vendors/${id}/block`, { blocked, blockReason });
    return response.data;
  },

  // Common Moderation
  getBlockedUsers: async () => {
    const response = await apiClient.get('admin/blocked-users');
    return response.data;
  },

  // Rides & Customers
  getRides: async () => {
    const response = await apiClient.get('admin/rides');
    return response.data;
  },
  getCustomers: async () => {
    const response = await apiClient.get('admin/customers');
    return response.data;
  }
};

export default adminApi;
