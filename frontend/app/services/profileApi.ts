import httpClient from '../utils/httpClient';
import type Employee from '../types/employee';

export interface ProfileResponse {
  message: string;
  data: Employee;
}

export interface ProfileError {
  error: string;
  details: string;
}

export const profileApi = {
  // Get current user's profile (employee data)
  getProfile: async (): Promise<ProfileResponse> => {
    try {
      console.log('Profile API - Making request to /employees/profile');
      const response = await httpClient.get('/employees/profile');
      console.log('Profile API - Response received:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Profile API - Get Profile Error:', error);
      console.error('Profile API - Error response:', error.response?.data);
      throw error;
    }
  },

  // Update current user's profile (employee data)
  updateProfile: async (profileData: Partial<Employee>): Promise<ProfileResponse> => {
    try {
      const response = await httpClient.patch('/employees/profile', profileData);
      return response.data;
    } catch (error: any) {
      console.error('Profile API - Update Profile Error:', error);
      throw error;
    }
  }
};