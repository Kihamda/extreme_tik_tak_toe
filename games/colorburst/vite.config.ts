import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  base: "/games/colorburst/",
  build: {
    outDir: "dist",
    assetsDir: "assets",
  },
  plugins: [react()],
});
