import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dishesApi } from '../services/dishesApi';
import type Dish from '../types/dishes';
import type { CreateDishRequest, UpdateDishRequest, DishFilters, Category } from '../types/dishes';

// Query Keys
export const dishesKeys = {
  all: ['dishes'] as const,
  lists: () => [...dishesKeys.all, 'list'] as const,
  list: (filters?: DishFilters) => [...dishesKeys.lists(), filters] as const,
  details: () => [...dishesKeys.all, 'detail'] as const,
  detail: (id: number) => [...dishesKeys.details(), id] as const,
  categories: () => [...dishesKeys.all, 'categories'] as const,
};

// Get all dishes
export const useDishes = (filters?: DishFilters) => {
  return useQuery({
    queryKey: dishesKeys.list(filters),
    queryFn: () => dishesApi.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get dish by ID
export const useDish = (id: number) => {
  return useQuery({
    queryKey: dishesKeys.detail(id),
    queryFn: () => dishesApi.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get all categories
export const useCategories = () => {
  return useQuery({
    queryKey: dishesKeys.categories(),
    queryFn: () => dishesApi.getCategories(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Create dish mutation
export const useCreateDish = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dish: CreateDishRequest) => dishesApi.create(dish),
    onSuccess: () => {
      // Invalidate and refetch dishes list
      queryClient.invalidateQueries({ queryKey: dishesKeys.lists() });
    },
  });
};

// Update dish mutation
export const useUpdateDish = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dish }: { id: number; dish: UpdateDishRequest }) =>
      dishesApi.update(id, dish),
    onSuccess: (data) => {
      // Invalidate and refetch dishes list and specific dish
      queryClient.invalidateQueries({ queryKey: dishesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dishesKeys.detail(data.id) });
    },
  });
};

// Delete dish mutation
export const useDeleteDish = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => dishesApi.delete(id),
    onSuccess: () => {
      // Invalidate and refetch dishes list
      queryClient.invalidateQueries({ queryKey: dishesKeys.lists() });
    },
  });
};
