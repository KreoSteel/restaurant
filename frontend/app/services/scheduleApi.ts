import httpClient from '../utils/httpClient';
import type { 
  Shift, 
  EmployeeSchedule, 
  ScheduleAssignment, 
  CreateShiftRequest, 
  AssignEmployeeRequest, 
  UnassignEmployeeRequest,
  ScheduleFilters 
} from '../types/schedule';

export interface ScheduleApiResponse<T> {
  message: string;
  data: T;
}

export interface ScheduleApiError {
  error: string;
  details: string | Record<string, string>;
}

export const scheduleApi = {
  // Shift management
  getShifts: async (filters?: ScheduleFilters): Promise<ScheduleApiResponse<Shift[]>> => {
    try {
      const params = new URLSearchParams();
      if (filters?.start_date) params.append('start_date', filters.start_date);
      if (filters?.end_date) params.append('end_date', filters.end_date);
      if (filters?.location_id) params.append('location_id', filters.location_id.toString());
      if (filters?.role_id) params.append('role_id', filters.role_id.toString());

      const response = await httpClient.get(`/schedule/shifts?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('Schedule API - Get Shifts Error:', error);
      throw error;
    }
  },

  getShiftByDate: async (date: string): Promise<ScheduleApiResponse<Shift>> => {
    try {
      const response = await httpClient.get(`/schedule/shifts/${date}`);
      return response.data;
    } catch (error: any) {
      console.error('Schedule API - Get Shift by Date Error:', error);
      throw error;
    }
  },

  createShift: async (shiftData: CreateShiftRequest): Promise<ScheduleApiResponse<Shift>> => {
    try {
      const response = await httpClient.post('/schedule/shifts', shiftData);
      return response.data;
    } catch (error: any) {
      console.error('Schedule API - Create Shift Error:', error);
      throw error;
    }
  },

  updateShift: async (date: string, shiftData: Partial<Shift>): Promise<ScheduleApiResponse<Shift>> => {
    try {
      const response = await httpClient.put(`/schedule/shifts/${date}`, shiftData);
      return response.data;
    } catch (error: any) {
      console.error('Schedule API - Update Shift Error:', error);
      throw error;
    }
  },

  deleteShift: async (date: string): Promise<ScheduleApiResponse<Shift>> => {
    try {
      const response = await httpClient.delete(`/schedule/shifts/${date}`);
      return response.data;
    } catch (error: any) {
      console.error('Schedule API - Delete Shift Error:', error);
      throw error;
    }
  },

  // Employee schedule management
  getEmployeeSchedules: async (filters?: ScheduleFilters): Promise<ScheduleApiResponse<EmployeeSchedule[]>> => {
    try {
      const params = new URLSearchParams();
      if (filters?.start_date) params.append('start_date', filters.start_date);
      if (filters?.end_date) params.append('end_date', filters.end_date);
      if (filters?.location_id) params.append('location_id', filters.location_id.toString());
      if (filters?.role_id) params.append('role_id', filters.role_id.toString());

      const response = await httpClient.get(`/schedule/employee-schedules?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('Schedule API - Get Employee Schedules Error:', error);
      throw error;
    }
  },

  getScheduleAssignments: async (filters?: ScheduleFilters): Promise<ScheduleApiResponse<ScheduleAssignment[]>> => {
    try {
      const params = new URLSearchParams();
      if (filters?.start_date) params.append('start_date', filters.start_date);
      if (filters?.end_date) params.append('end_date', filters.end_date);
      if (filters?.location_id) params.append('location_id', filters.location_id.toString());
      if (filters?.role_id) params.append('role_id', filters.role_id.toString());

      const response = await httpClient.get(`/schedule/assignments?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('Schedule API - Get Schedule Assignments Error:', error);
      throw error;
    }
  },

  assignEmployee: async (assignmentData: AssignEmployeeRequest): Promise<ScheduleApiResponse<EmployeeSchedule>> => {
    try {
      const response = await httpClient.post('/schedule/assign', assignmentData);
      return response.data;
    } catch (error: any) {
      console.error('Schedule API - Assign Employee Error:', error);
      throw error;
    }
  },

  unassignEmployee: async (unassignData: UnassignEmployeeRequest): Promise<ScheduleApiResponse<EmployeeSchedule>> => {
    try {
      const response = await httpClient.delete('/schedule/unassign', { data: unassignData });
      return response.data;
    } catch (error: any) {
      console.error('Schedule API - Unassign Employee Error:', error);
      throw error;
    }
  },

  // Utility functions
  getEmployeesByRole: async (roleId: number, locationId?: number): Promise<ScheduleApiResponse<any[]>> => {
    try {
      const params = new URLSearchParams();
      if (locationId) params.append('locationId', locationId.toString());

      const response = await httpClient.get(`/schedule/employees/role/${roleId}?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('Schedule API - Get Employees by Role Error:', error);
      throw error;
    }
  },

  getScheduleValidation: async (startDate: string, endDate: string, locationId?: number): Promise<ScheduleApiResponse<any>> => {
    try {
      const params = new URLSearchParams();
      if (locationId) params.append('locationId', locationId.toString());

      const response = await httpClient.get(`/schedule/validation/${startDate}/${endDate}?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('Schedule API - Get Schedule Validation Error:', error);
      throw error;
    }
  }
};

