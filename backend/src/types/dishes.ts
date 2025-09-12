export default interface Dish {
    id: number;
    name: string | null;
    description: string | null;
    price: number;
    rating: number | null;
    category_id: number | null;
    created_at: string;
    updated_at: string | null;
    category?: {
        id: number;
        name: string | null;
        description: string | null;
    };
    ingredients?: {
        id: number;
        name: string | null;
        quantity: number;
    }[];
}

export interface CreateDishRequest {
    name: string;
    description?: string;
    price?: number;
    rating?: number;
    category_id?: number;
    ingredients?: number[]; // Array of ingredient IDs
}

export interface UpdateDishRequest {
    name?: string;
    description?: string;
    price?: number;
    rating?: number;
    category_id?: number;
    ingredients?: number[]; // Array of ingredient IDs
}

export interface DishFilters {
    search?: string;
    min_price?: number;
    max_price?: number;
    min_rating?: number;
    max_rating?: number;
    category_id?: number;
}

export interface Category {
    id: number;
    name: string | null;
    description: string | null;
    created_at: string;
    updated_at: string | null;
}
