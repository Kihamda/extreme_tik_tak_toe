import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://game.kihamda.net",
  output: "static",
  integrations: [sitemap()],
});
