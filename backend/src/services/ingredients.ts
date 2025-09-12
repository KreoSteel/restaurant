import supabase from '../utils/supabase';
import type Ingredient from '../types/ingredients';
import type { CreateIngredientRequest, UpdateIngredientRequest, IngredientFilters } from '../types/ingredients';

export async function getIngredients(filters?: IngredientFilters): Promise<{ data: Ingredient[], error: any }> {
    try {
        let query = supabase
            .from('ingredients')
            .select('*')
            .order('created_at', { ascending: false });

        // Apply filters
        if (filters?.search) {
            query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
        }

        if (filters?.min_price !== undefined) {
            query = query.gte('price', filters.min_price);
        }

        if (filters?.max_price !== undefined) {
            query = query.lte('price', filters.max_price);
        }

        if (filters?.min_quantity !== undefined) {
            query = query.gte('quantity', filters.min_quantity);
        }

        if (filters?.max_quantity !== undefined) {
            query = query.lte('quantity', filters.max_quantity);
        }

        const { data, error } = await query;

        return { data: data || [], error };
    } catch (error) {
        return { data: [], error };
    }
}

export async function getIngredientById(id: number): Promise<{ data: Ingredient | null, error: any }> {
    try {
        const { data, error } = await supabase
            .from('ingredients')
            .select('*')
            .eq('id', id)
            .single();

        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
}

export async function createIngredient(ingredient: CreateIngredientRequest): Promise<{ data: Ingredient | null, error: any }> {
    try {
        const { data, error } = await supabase
            .from('ingredients')
            .insert([{
                name: ingredient.name,
                description: ingredient.description || null,
                price: ingredient.price || 0,
                quantity: ingredient.quantity || 0,
            }])
            .select()
            .single();

        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
}

export async function updateIngredient(id: number, ingredient: UpdateIngredientRequest): Promise<{ data: Ingredient | null, error: any }> {
    try {
        const updateData: any = {
            updated_at: new Date().toISOString(),
        };

        if (ingredient.name !== undefined) updateData.name = ingredient.name;
        if (ingredient.description !== undefined) updateData.description = ingredient.description;
        if (ingredient.price !== undefined) updateData.price = ingredient.price;
        if (ingredient.quantity !== undefined) updateData.quantity = ingredient.quantity;

        const { data, error } = await supabase
            .from('ingredients')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
}

export async function deleteIngredient(id: number): Promise<{ data: Ingredient | null, error: any }> {
    try {
        const { data, error } = await supabase
            .from('ingredients')
            .delete()
            .eq('id', id)
            .select()
            .single();

        return { data, error };
    } catch (error) {
        return { data: null, error };
    }
}
