# Vite configuration for the frontend
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],   # Enable React JSX support
});
