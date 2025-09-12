import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ingredientsApi } from '../services/ingredientsApi';
import type Ingredient from '../types/ingredients';
import type { CreateIngredientRequest, UpdateIngredientRequest, IngredientFilters } from '../types/ingredients';

// Query Keys
export const ingredientsKeys = {
  all: ['ingredients'] as const,
  lists: () => [...ingredientsKeys.all, 'list'] as const,
  list: (filters?: IngredientFilters) => [...ingredientsKeys.lists(), filters] as const,
  details: () => [...ingredientsKeys.all, 'detail'] as const,
  detail: (id: number) => [...ingredientsKeys.details(), id] as const,
};

// Get all ingredients
export const useIngredients = (filters?: IngredientFilters) => {
  return useQuery({
    queryKey: ingredientsKeys.list(filters),
    queryFn: () => ingredientsApi.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get ingredient by ID
export const useIngredient = (id: number) => {
  return useQuery({
    queryKey: ingredientsKeys.detail(id),
    queryFn: () => ingredientsApi.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Create ingredient mutation
export const useCreateIngredient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ingredient: CreateIngredientRequest) => ingredientsApi.create(ingredient),
    onSuccess: () => {
      // Invalidate and refetch ingredients list
      queryClient.invalidateQueries({ queryKey: ingredientsKeys.lists() });
    },
  });
};

// Update ingredient mutation
export const useUpdateIngredient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ingredient }: { id: number; ingredient: UpdateIngredientRequest }) =>
      ingredientsApi.update(id, ingredient),
    onSuccess: (data) => {
      // Invalidate and refetch ingredients list and specific ingredient
      queryClient.invalidateQueries({ queryKey: ingredientsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ingredientsKeys.detail(data.id) });
    },
  });
};

// Delete ingredient mutation
export const useDeleteIngredient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => ingredientsApi.delete(id),
    onSuccess: () => {
      // Invalidate and refetch ingredients list
      queryClient.invalidateQueries({ queryKey: ingredientsKeys.lists() });
    },
  });
};
