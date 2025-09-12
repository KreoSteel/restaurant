import supabase from '../utils/supabase';
import Dish, { CreateDishRequest, UpdateDishRequest, DishFilters, Category } from '../types/dishes';

export const getDishesOperation = async (filters?: DishFilters): Promise<Dish[]> => {
    let query = supabase
        .from('dishes')
        .select(`
            *,
            category:categories(id, name, description),
            ingredients:dish_contents(
                ingredient:ingredients(id, name, quantity)
            )
        `)
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

    if (filters?.min_rating !== undefined) {
        query = query.gte('rating', filters.min_rating);
    }

    if (filters?.max_rating !== undefined) {
        query = query.lte('rating', filters.max_rating);
    }

    if (filters?.category_id !== undefined) {
        query = query.eq('category_id', filters.category_id);
    }

    const { data, error } = await query;

    if (error) {
        throw error;
    }

    // Transform the data to match our interface
    return data?.map((dish: any) => ({
        ...dish,
        ingredients: dish.ingredients?.map((item: any) => item.ingredient).filter(Boolean) || []
    })) || [];
};

export const getDishByIdOperation = async (id: number): Promise<Dish | null> => {
    const { data, error } = await supabase
        .from('dishes')
        .select(`
            *,
            category:categories(id, name, description),
            ingredients:dish_contents(
                ingredient:ingredients(id, name, quantity)
            )
        `)
        .eq('id', id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            return null; // No rows returned
        }
        throw error;
    }

    // Transform the data to match our interface
    return {
        ...data,
        ingredients: data.ingredients?.map((item: any) => item.ingredient).filter(Boolean) || []
    };
};

export const createDishOperation = async (dishData: CreateDishRequest): Promise<Dish> => {
    const { ingredients, ...dishInfo } = dishData;

    // Create the dish first
    const { data: dish, error: dishError } = await supabase
        .from('dishes')
        .insert({
            name: dishInfo.name,
            description: dishInfo.description,
            price: dishInfo.price || 0,
            rating: dishInfo.rating,
            category_id: dishInfo.category_id
        })
        .select()
        .single();

    if (dishError) {
        throw dishError;
    }

    // If ingredients are provided, create dish_contents relationships
    if (ingredients && ingredients.length > 0) {
        const dishContents = ingredients.map(ingredientId => ({
            dish_id: dish.id,
            ingredient_id: ingredientId
        }));

        const { error: contentsError } = await supabase
            .from('dish_contents')
            .insert(dishContents);

        if (contentsError) {
            // If adding ingredients fails, we should clean up the dish
            await supabase.from('dishes').delete().eq('id', dish.id);
            throw contentsError;
        }
    }

    // Return the complete dish with relationships
    return getDishByIdOperation(dish.id) as Promise<Dish>;
};

export const updateDishOperation = async (id: number, dishData: UpdateDishRequest): Promise<Dish> => {
    const { ingredients, ...dishInfo } = dishData;

    // Update the dish
    const { data: dish, error: dishError } = await supabase
        .from('dishes')
        .update({
            ...(dishInfo.name && { name: dishInfo.name }),
            ...(dishInfo.description !== undefined && { description: dishInfo.description }),
            ...(dishInfo.price !== undefined && { price: dishInfo.price }),
            ...(dishInfo.rating !== undefined && { rating: dishInfo.rating }),
            ...(dishInfo.category_id !== undefined && { category_id: dishInfo.category_id }),
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

    if (dishError) {
        if (dishError.code === 'PGRST116') {
            throw new Error('Dish not found');
        }
        throw dishError;
    }

    // If ingredients are provided, update the dish_contents relationships
    if (ingredients !== undefined) {
        // First, remove existing relationships
        const { error: deleteError } = await supabase
            .from('dish_contents')
            .delete()
            .eq('dish_id', id);

        if (deleteError) {
            throw deleteError;
        }

        // Then, add new relationships if any
        if (ingredients.length > 0) {
            const dishContents = ingredients.map(ingredientId => ({
                dish_id: id,
                ingredient_id: ingredientId
            }));

            const { error: contentsError } = await supabase
                .from('dish_contents')
                .insert(dishContents);

            if (contentsError) {
                throw contentsError;
            }
        }
    }

    // Return the complete dish with relationships
    return getDishByIdOperation(id) as Promise<Dish>;
};

export const deleteDishOperation = async (id: number): Promise<Dish> => {
    // First get the dish to return it
    const dish = await getDishByIdOperation(id);
    if (!dish) {
        throw new Error('Dish not found');
    }

    // Delete dish_contents relationships first (due to foreign key constraints)
    const { error: contentsError } = await supabase
        .from('dish_contents')
        .delete()
        .eq('dish_id', id);

    if (contentsError) {
        throw contentsError;
    }

    // Then delete the dish
    const { error: dishError } = await supabase
        .from('dishes')
        .delete()
        .eq('id', id);

    if (dishError) {
        throw dishError;
    }

    return dish;
};

export const getCategoriesOperation = async (): Promise<Category[]> => {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

    if (error) {
        throw error;
    }

    return data || [];
};
