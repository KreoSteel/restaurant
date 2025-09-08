import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  envDir: "../", // Look for .env files in parent directory
  resolve: {
    dedupe: ['react', 'react-dom']
  },
  optimizeDeps: {
    include: ['@supabase/supabase-js', '@supabase/auth-ui-react', 'react', 'react-dom']
  },
  ssr: {
    noExternal: ['@supabase/supabase-js', '@supabase/auth-ui-react']
  }
});
