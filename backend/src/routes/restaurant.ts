import { restaurantController } from "../controllers/restaurant";
import { Router } from "express";

const router = Router()

router.get('/', restaurantController.getRestaurants)

export default router