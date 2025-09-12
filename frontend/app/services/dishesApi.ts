import { safeLocalStorage } from '../utils/storage';
import type Dish from '../types/dishes';
import type { CreateDishRequest, UpdateDishRequest, DishFilters, Category } from '../types/dishes';

const API_BASE_URL = 'http://localhost:3000/api';

const getAuthHeaders = () => {
  const token = safeLocalStorage.getItem('supabase_token') || safeLocalStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const dishesApi = {
  // Get all dishes with optional filters
  getAll: async (filters?: DishFilters): Promise<Dish[]> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.min_price !== undefined) params.append('min_price', filters.min_price.toString());
    if (filters?.max_price !== undefined) params.append('max_price', filters.max_price.toString());
    if (filters?.min_rating !== undefined) params.append('min_rating', filters.min_rating.toString());
    if (filters?.max_rating !== undefined) params.append('max_rating', filters.max_rating.toString());
    if (filters?.category_id !== undefined) params.append('category_id', filters.category_id.toString());

    const url = `${API_BASE_URL}/dishes${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.details || 'Failed to fetch dishes');
    }

    const data = await response.json();
    return data.data || [];
  },

  // Get dish by ID
  getById: async (id: number): Promise<Dish> => {
    const response = await fetch(`${API_BASE_URL}/dishes/${id}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.details || 'Failed to fetch dish');
    }

    const data = await response.json();
    return data.data;
  },

  // Create new dish
  create: async (dish: CreateDishRequest): Promise<Dish> => {
    const response = await fetch(`${API_BASE_URL}/dishes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(dish),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.details || 'Failed to create dish');
    }

    const data = await response.json();
    return data.data;
  },

  // Update dish
  update: async (id: number, dish: UpdateDishRequest): Promise<Dish> => {
    const response = await fetch(`${API_BASE_URL}/dishes/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(dish),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.details || 'Failed to update dish');
    }

    const data = await response.json();
    return data.data;
  },

  // Delete dish
  delete: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/dishes/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.details || 'Failed to delete dish');
    }
  },

  // Get all categories
  getCategories: async (): Promise<Category[]> => {
    const url = `${API_BASE_URL}/dishes/categories`;
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.details || 'Failed to fetch categories');
    }

    const data = await response.json();
    return data.data || [];
  },
};
