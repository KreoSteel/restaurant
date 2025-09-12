import { getIngredients, getIngredientById, createIngredient, updateIngredient, deleteIngredient } from '../services/ingredients';
import type Ingredient from '../types/ingredients';
import type { CreateIngredientRequest, UpdateIngredientRequest, IngredientFilters } from '../types/ingredients';

export async function getIngredientsOperation(filters?: IngredientFilters): Promise<Ingredient[]> {
    const { data, error } = await getIngredients(filters);
    
    if (error) {
        throw error;
    }
    
    return data;
}

export async function getIngredientByIdOperation(id: number): Promise<Ingredient | null> {
    const { data, error } = await getIngredientById(id);
    
    if (error) {
        throw error;
    }
    
    return data;
}

export async function createIngredientOperation(ingredient: CreateIngredientRequest): Promise<Ingredient> {
    const { data, error } = await createIngredient(ingredient);
    
    if (error) {
        throw error;
    }
    
    if (!data) {
        throw new Error('Failed to create ingredient');
    }
    
    return data;
}

export async function updateIngredientOperation(id: number, ingredient: UpdateIngredientRequest): Promise<Ingredient> {
    const { data, error } = await updateIngredient(id, ingredient);
    
    if (error) {
        throw error;
    }
    
    if (!data) {
        throw new Error('Ingredient not found');
    }
    
    return data;
}

export async function deleteIngredientOperation(id: number): Promise<Ingredient> {
    const { data, error } = await deleteIngredient(id);
    
    if (error) {
        throw error;
    }
    
    if (!data) {
        throw new Error('Ingredient not found');
    }
    
    return data;
}
