import { defineConfig, type UserConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

/**
 * 全ゲーム共通の base Vite 設定
 * 各ゲームでは createGameViteConfig(gameName) を使う
 */
export function createGameViteConfig(gameName: string): UserConfig {
  return defineConfig({
    base: `/games/${gameName}/`,
    build: {
      outDir: "dist",
      assetsDir: "assets",
    },
    plugins: [react()],
  });
}
