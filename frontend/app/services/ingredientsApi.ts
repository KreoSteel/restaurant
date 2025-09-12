import { safeLocalStorage } from '../utils/storage';
import type Ingredient from '../types/ingredients';
import type { CreateIngredientRequest, UpdateIngredientRequest, IngredientFilters } from '../types/ingredients';

const API_BASE_URL = 'http://localhost:3000/api';

const getAuthHeaders = () => {
  const token = safeLocalStorage.getItem('supabase_token') || safeLocalStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const ingredientsApi = {
  // Get all ingredients with optional filters
  getAll: async (filters?: IngredientFilters): Promise<Ingredient[]> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.min_price !== undefined) params.append('min_price', filters.min_price.toString());
    if (filters?.max_price !== undefined) params.append('max_price', filters.max_price.toString());
    if (filters?.min_quantity !== undefined) params.append('min_quantity', filters.min_quantity.toString());
    if (filters?.max_quantity !== undefined) params.append('max_quantity', filters.max_quantity.toString());

    const url = `${API_BASE_URL}/ingredients${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.details || 'Failed to fetch ingredients');
    }

    const data = await response.json();
    return data.data || [];
  },

  // Get ingredient by ID
  getById: async (id: number): Promise<Ingredient> => {
    const response = await fetch(`${API_BASE_URL}/ingredients/${id}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.details || 'Failed to fetch ingredient');
    }

    const data = await response.json();
    return data.data;
  },

  // Create new ingredient
  create: async (ingredient: CreateIngredientRequest): Promise<Ingredient> => {
    const response = await fetch(`${API_BASE_URL}/ingredients`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(ingredient),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.details || 'Failed to create ingredient');
    }

    const data = await response.json();
    return data.data;
  },

  // Update ingredient
  update: async (id: number, ingredient: UpdateIngredientRequest): Promise<Ingredient> => {
    const response = await fetch(`${API_BASE_URL}/ingredients/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(ingredient),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.details || 'Failed to update ingredient');
    }

    const data = await response.json();
    return data.data;
  },

  // Delete ingredient
  delete: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/ingredients/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.details || 'Failed to delete ingredient');
    }
  },
};
