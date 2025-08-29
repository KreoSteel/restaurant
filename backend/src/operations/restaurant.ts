import { getRestaurants } from "../services/restaurant";
import Restaurant from "../types/restaurants";

export async function getRestaurantsOperation(): Promise<Restaurant[]> {
    try {
        const { data, error } = await getRestaurants()
        if (error) {
            throw error
        }
        return data
    } catch (error) {
        console.error("Error fetching restaurants:", error)
        throw error
    }
} 