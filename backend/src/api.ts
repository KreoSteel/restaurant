import express from "express";
import cors from "cors";
import { validateEnv } from "./utils/validate";
import restaurantRouter from "./routes/restaurant";
import roleRouter from "./routes/roles";
import employeeRouter from "./routes/employee";
import scheduleRouter from "./routes/schedule";
import ingredientsRouter from "./routes/ingredients";
import dishesRouter from "./routes/dishes";

// Load environment variables first


validateEnv();

const app = express();

// Enable CORS for frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

app.use('/api/restaurants', restaurantRouter)
app.use('/api/roles', roleRouter)
app.use('/api/employees', employeeRouter)
app.use('/api/schedule', scheduleRouter)
app.use('/api/ingredients', ingredientsRouter)
app.use('/api/dishes', dishesRouter)

app.listen(3000, async () => {
    console.log("Server is running on port 3000");
});
