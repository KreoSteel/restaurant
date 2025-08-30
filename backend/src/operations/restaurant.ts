import { getRestaurants, getRestaurantById, createRestaurant, updateRestaurant } from "../services/restaurant";
import Restaurant from "../types/restaurants";

export async function getRestaurantsOperation(): Promise<Restaurant[]> {
    const { data, error } = await getRestaurants()
    if (error) {
        throw error
    }
    return data
}

export async function getRestaurantByIdOperation(id: number): Promise<Restaurant> {
        const { data, error } = await getRestaurantById(id)
        if (error) {
            throw error
        }

    return data
}

export async function createRestaurantOperation(restaurant: Partial<Restaurant>): Promise<Restaurant> {
    const { data, error } = await createRestaurant(restaurant)
    if (error) {
        throw error
    }
    return data
}

export async function updateRestaurantOperation(id: number, restaurant: Partial<Restaurant>): Promise<Restaurant> {
    const { data, error } = await updateRestaurant(id, restaurant)
    if (error) {
        throw error
    }
    return data
}