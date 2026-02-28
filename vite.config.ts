import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { resolve } from "path";
import { readdirSync, existsSync } from "fs";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const gamesDir = resolve(__dirname, "games");

// _template と _ プレフィックスのディレクトリを除外して自動検出
const gameEntries = Object.fromEntries(
  readdirSync(gamesDir)
    .filter((name) => !name.startsWith("_"))
    .filter((name) => existsSync(resolve(gamesDir, name, "index.html")))
    .map((name) => [name, resolve(gamesDir, name, "index.html")]),
);

export default defineConfig({
  plugins: [react()],
  root: resolve(__dirname),
  build: {
    outDir: resolve(__dirname, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: gameEntries,
    },
  },
});
