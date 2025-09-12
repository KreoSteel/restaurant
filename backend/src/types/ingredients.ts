export default interface Ingredient {
    id: number;
    name: string | null;
    description: string | null;
    price: number;
    quantity: number;
    created_at: string;
    updated_at: string | null;
}

export interface CreateIngredientRequest {
    name: string;
    description?: string;
    price?: number;
    quantity?: number;
}

export interface UpdateIngredientRequest {
    name?: string;
    description?: string;
    price?: number;
    quantity?: number;
}

export interface IngredientFilters {
    search?: string;
    min_price?: number;
    max_price?: number;
    min_quantity?: number;
    max_quantity?: number;
}
