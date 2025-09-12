import { useQuery } from '@tanstack/react-query';
import { safeLocalStorage, isBrowser } from '../utils/storage';
import type Employee from '../types/employee';
import type Role from '../types/roles';
import type Restaurant from '../types/restaurants';

// Query Keys
export const generalKeys = {
  all: ['general'] as const,
  employees: () => [...generalKeys.all, 'employees'] as const,
  employeesList: () => [...generalKeys.employees(), 'list'] as const,
  roles: () => [...generalKeys.all, 'roles'] as const,
  rolesList: () => [...generalKeys.roles(), 'list'] as const,
  restaurants: () => [...generalKeys.all, 'restaurants'] as const,
  restaurantsList: (limit?: number) => [...generalKeys.restaurants(), 'list', limit] as const,
  profile: () => [...generalKeys.all, 'profile'] as const,
};

// Employees Query
export const useEmployees = () => {
  return useQuery({
    queryKey: generalKeys.employeesList(),
    queryFn: async () => {
      const response = await fetch('http://localhost:3000/api/employees');
      const data = await response.json();
      return data.data?.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Roles Query
export const useRoles = () => {
  return useQuery({
    queryKey: generalKeys.rolesList(),
    queryFn: async () => {
      const response = await fetch('http://localhost:3000/api/roles');
      const data = await response.json();
      return data.data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - roles don't change often
  });
};

// Restaurants Query
export const useRestaurants = (limit?: number) => {
  return useQuery({
    queryKey: generalKeys.restaurantsList(limit),
    queryFn: async () => {
      const url = limit ? `http://localhost:3000/api/restaurants?limit=${limit}` : 'http://localhost:3000/api/restaurants';
      const response = await fetch(url);
      const data = await response.json();
      return data.paginatedRestaurants?.data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - restaurants don't change often
  });
};

// Employee Profile Query
export const useEmployeeProfile = () => {
  return useQuery({
    queryKey: generalKeys.profile(),
    queryFn: async () => {
      // Check if we're in a browser environment
      if (!isBrowser) {
        throw new Error('Not in browser environment');
      }

      const token = safeLocalStorage.getItem('supabase_token') || safeLocalStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://localhost:3000/api/employees/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to load employee profile');
      }

      const data = await response.json();
      return data.data;
    },
    enabled: isBrowser && (!!safeLocalStorage.getItem('supabase_token') || !!safeLocalStorage.getItem('token')),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Combined Data Hook for Schedule Manager
export const useScheduleManagerData = () => {
  const employeesQuery = useEmployees();
  const rolesQuery = useRoles();
  const restaurantsQuery = useRestaurants(1000); // Request many locations
  const profileQuery = useEmployeeProfile();

  return {
    employees: employeesQuery.data || [],
    roles: rolesQuery.data || [],
    restaurants: restaurantsQuery.data || [],
    profile: profileQuery.data,
    isLoading: employeesQuery.isLoading || rolesQuery.isLoading || restaurantsQuery.isLoading || profileQuery.isLoading,
    isError: employeesQuery.isError || rolesQuery.isError || restaurantsQuery.isError || profileQuery.isError,
    error: employeesQuery.error || rolesQuery.error || restaurantsQuery.error || profileQuery.error,
    refetch: () => {
      employeesQuery.refetch();
      rolesQuery.refetch();
      restaurantsQuery.refetch();
      profileQuery.refetch();
    },
  };
};
