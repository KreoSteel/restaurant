import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"), 
  route("login", "routes/login.tsx"),
  route("register", "routes/register.tsx"),
  route("profile", "routes/profile.tsx"),
  route("schedule", "routes/schedule.tsx"),
  route("ingredients", "routes/ingredients.tsx"),
  route("dishes", "routes/dishes.tsx")
] satisfies RouteConfig;
