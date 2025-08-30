import supabase from "../utils/supabase";
import Restaurant from "../types/restaurants";

export async function getRestaurants(): Promise<{ data: Restaurant[], error: any }> {
    const { data, error } = await supabase.from('restaurant_locations').select('*')
    if (error) {
        throw error
    }
    return { data: data as Restaurant[], error }
}


export async function getRestaurantById(id: number): Promise<{ data: Restaurant, error: any }> {
    const { data, error } = await supabase.from('restaurant_locations').select('*').eq('id', id)
    console.log(data)
    if (error) {
        throw error
    }
    return { data: data[0] as Restaurant, error }
}


export async function createRestaurant(restaurant: Partial<Restaurant>): Promise<{ data: Restaurant, error: any }> {
    const { data, error } = await supabase
        .from('restaurant_locations')
        .insert(restaurant)
        .select()
    console.log(data)
    if (error) {
        throw error
    }

    return { data: data[0], error }
}


export async function updateRestaurant(id: number, restaurant: Partial<Restaurant>): Promise<{ data: Restaurant, error: any }> {
    const { data, error } = await supabase
        .from('restaurant_locations').update(restaurant).eq('id', id).select()

    console.log(data)
    if (error) {
        throw error
    }
    return { data: data[0], error }
}