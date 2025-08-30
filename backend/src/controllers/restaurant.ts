import { getRestaurantsOperation, getRestaurantByIdOperation, createRestaurantOperation, updateRestaurantOperation } from "../operations/restaurant";
import { Request, Response } from "express";
import { paginate, Pagination } from "../utils/pagination";
import { updateRestaurant } from "../services/restaurant";


export const restaurantController = {
    getRestaurants: async (req: Request, res: Response): Promise<void> => {
        try {
            const page = parseInt(req.query.page as string) || 1
            const limit = parseInt(req.query.limit as string) || 10
            const restaurants = await getRestaurantsOperation()
            const paginatedRestaurants = paginate(restaurants, page, limit)
            if (paginatedRestaurants.page > paginatedRestaurants.total) {
                res.status(404).json({ error: "Page not found" })
            }
            if (!paginatedRestaurants) {
                res.status(404).json({ error: "No restaurants found" })
            }
            res.status(200).json({ message: "Restaurants fetched successfully", paginatedRestaurants })
        } catch (error) {
            res.status(500).json({ error: "Failed to fetch restaurants" })
        }
    },

    getRestaurantById: async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id)
            if (!id) {
                res.status(400).json({ error: "Invalid restaurant id" })
            }

            const restaurant = await getRestaurantByIdOperation(id)

            if (!restaurant) {
                res.status(404).json({ error: "Restaurant not found" })
            }

            console.log(restaurant)
            res.status(200).json({ message: "Restaurant fetched successfully", restaurant })
        } catch (error) {
            res.status(500).json({ error: "Failed to fetch restaurant" })
        }
    },

    createRestaurant: async (req: Request, res: Response): Promise<void> => {
        try {
            const { address, budget, finish_construction } = req.body
            const restaurant = await createRestaurantOperation({ address, budget, finish_construction })
            res.status(201).json({ message: "Restaurant created successfully", restaurant })
        } catch (error) {
            res.status(500).json({ error: "Failed to create restaurant" })
        }
    },

    updateRestaurant: async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id)
            const { address, budget, finish_construction, start_construction } = req.body
            const restaurant = await updateRestaurantOperation(id, { address, budget, finish_construction, start_construction })
            res.status(200).json({ message: "Restaurant updated successfully", restaurant })
            console.log(restaurant)
            if (!restaurant) {
                res.status(404).json({ error: "Restaurant not found" })
            }
        } catch (error) {
            res.status(500).json({ error: "Failed to update restaurant" })
        }
    }
}