import express from "express";
import { validateEnv } from "./utils/validate";
import restaurantRouter from "./routes/restaurant";
import roleRouter from "./routes/roles";

// Load environment variables first


validateEnv();

const app = express();
app.use(express.json());

app.use('/api/restaurants', restaurantRouter)
app.use('/api/roles', roleRouter)

app.listen(3000, async () => {
    console.log("Server is running on port 3000");
});
