import { restaurantController } from "../controllers/restaurant";
import { Router } from "express";

const router = Router()

router.get('/', restaurantController.getRestaurants)
router.get('/:id', restaurantController.getRestaurantById)
router.post('/', restaurantController.createRestaurant)
router.patch('/:id', restaurantController.updateRestaurant)

export default router