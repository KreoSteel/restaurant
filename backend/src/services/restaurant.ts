import supabase from "../utils/supabase";
import Restaurant from "../types/restaurants";

export async function getRestaurants(): Promise<{ data: Restaurant[], error: any }> {
    const { data, error } = await supabase.from('restaurant_locations').select('*')
    if (error) {
        throw error
    }
    return { data: data as Restaurant[], error }
}