import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import type { Plugin } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE_URL = "https://game.kihamda.net";

interface Game {
  id: string;
  title: string;
  description: string;
  path: string;
  thumbnail: string;
  tags: string[];
  publishedAt: string;
  featured: boolean;
}

interface GamesData {
  games: Game[];
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function loadGames(): GamesData {
  const jsonPath = resolve(
    __dirname,
    "..",
    "src",
    "portal",
    "data",
    "games.json",
  );
  return JSON.parse(readFileSync(jsonPath, "utf-8")) as GamesData;
}

function renderGameCard(game: Game, badge?: string): string {
  const tagsHtml = game.tags
    .map((tag) => `<span>${escapeHtml(tag)}</span>`)
    .join("");

  const badgeHtml = badge
    ? `<span class="badge">${escapeHtml(badge)}</span>`
    : "";

  return `<article class="card">
  <a href="${escapeHtml(game.path)}" class="card-cover-link" aria-hidden="true" tabindex="-1"></a>
  <a href="${escapeHtml(game.path)}" class="thumb-link" aria-label="${escapeHtml(game.title)} をプレイする">
    <img src="${escapeHtml(game.thumbnail)}" alt="${escapeHtml(game.title)} thumbnail" loading="lazy" />
  </a>
  <div class="content">
    <div class="topline">
      <h2>${escapeHtml(game.title)}</h2>
      ${badgeHtml}
    </div>
    <p>${escapeHtml(game.description)}</p>
    <div class="tags">${tagsHtml}</div>
    <div class="actions">
      <a href="${escapeHtml(game.path)}" class="play">今すぐプレイ</a>
    </div>
  </div>
</article>`;
}

function renderPortalHtml(data: GamesData): string {
  const games = [...data.games];

  const byDateDesc = [...games].sort(
    (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
  );

  const featuredGames = games.filter((g) => g.featured);
  const newestGames = byDateDesc.slice(0, 2);

  const recommendedGames = [...games]
    .sort((a, b) => {
      const score = (game: Game) => {
        let total = 0;
        if (game.featured) total += 3;
        if (game.tags.includes("multiplayer")) total += 2;
        if (game.tags.includes("arcade") || game.tags.includes("reflex"))
          total += 1;
        return total;
      };
      const scoreDiff = score(b) - score(a);
      if (scoreDiff !== 0) return scoreDiff;
      return Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
    })
    .slice(0, 3);

  const allGames = [...games].sort((a, b) => {
    const featuredDiff = Number(b.featured) - Number(a.featured);
    if (featuredDiff !== 0) return featuredDiff;
    return Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
  });

  const pathsJson = escapeHtml(JSON.stringify(allGames.map((g) => g.path)));

  const title = "ブラウザゲームポータル | game.kihamda.net";
  const description = `今日の気分で遊べるブラウザゲームポータル。新着・おすすめ・ランダムからすぐプレイ。${games.length}本のゲームが無料で楽しめる`;

  const newestCardsHtml = newestGames
    .map((g) => renderGameCard(g, "NEW"))
    .join("\n");

  const recommendedCardsHtml = recommendedGames
    .map((g) => renderGameCard(g, g.featured ? "注目" : "PICK"))
    .join("\n");

  const allCardsHtml = allGames.map((g) => renderGameCard(g)).join("\n");

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="description" content="${escapeHtml(description)}" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:type" content="website" />
<meta property="og:url" content="${SITE_URL}/" />
<meta property="og:site_name" content="game.kihamda.net" />
<meta name="twitter:card" content="summary" />
<meta name="twitter:title" content="${escapeHtml(title)}" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
<link rel="canonical" href="${SITE_URL}/" />
<link rel="manifest" href="/manifest.webmanifest" />
<title>${escapeHtml(title)}</title>
<style>
:root { color-scheme: light; font-family: Inter, system-ui, -apple-system, Segoe UI, sans-serif; }
body { margin: 0; background: linear-gradient(135deg, #eef2ff 0%, #f8fafc 100%); color: #0f172a; }
main { max-width: 1080px; margin: 0 auto; padding: 24px; }
a { color: inherit; }

.hero {
  display: grid;
  gap: 14px;
  margin-bottom: 24px;
  padding: 20px;
  border-radius: 20px;
  background: linear-gradient(160deg, #111827 0%, #1e293b 55%, #334155 100%);
  color: #f8fafc;
}
.eyebrow { margin: 0; font-size: 13px; font-weight: 700; color: #bfdbfe; }
.hero h1 { margin: 0; font-size: clamp(26px, 5.5vw, 40px); line-height: 1.2; letter-spacing: -0.02em; }
.lead { margin: 0; color: #cbd5e1; max-width: 60ch; }
.hero-cta { display: grid; gap: 10px; }
.hero-cta a {
  display: inline-flex; justify-content: center; align-items: center;
  min-height: 44px; padding: 0 14px; border-radius: 12px;
  text-decoration: none; font-weight: 700; background: #f8fafc; color: #0f172a;
}
.hero-cta a:last-child { background: #22d3ee; color: #0f172a; }
.hero-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.hero-stats p { margin: 0; padding: 10px; border-radius: 10px; background: rgba(148,163,184,.2); font-size: 13px; color: #cbd5e1; }
.hero-stats strong { display: block; font-size: 18px; color: #f8fafc; }

.section { display: grid; gap: 12px; margin-bottom: 26px; }
.section-head h2 { margin: 0; font-size: 22px; }
.section-head p { margin: 6px 0 0; color: #475569; }
.grid { display: grid; gap: 16px; }

.card {
  display: grid; gap: 0; border-radius: 16px; background: white;
  box-shadow: 0 6px 20px rgba(15,23,42,.08); overflow: hidden; position: relative;
}
.card-cover-link { position: absolute; inset: 0; border-radius: 16px; z-index: 0; }
.thumb-link { display: block; text-decoration: none; }
.card img { width: 100%; height: auto; object-fit: cover; min-height: 180px; background: #e2e8f0; display: block; }
.content { padding: 16px; }
.topline { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.content h2 { margin: 0; font-size: clamp(20px, 4vw, 24px); }
.badge {
  display: inline-flex; align-items: center; border-radius: 999px;
  padding: 4px 10px; font-size: 12px; font-weight: 800; background: #dbeafe; color: #1d4ed8;
}
.content p { margin: 0 0 10px; color: #334155; }
.tags { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
.tags span { font-size: 12px; padding: 3px 8px; border-radius: 999px; background: #e0e7ff; color: #3730a3; }
.actions {
  display: flex; gap: 10px; flex-wrap: wrap; position: relative; z-index: 1;
}
.actions a {
  display: inline-flex; justify-content: center; align-items: center;
  min-height: 40px; text-decoration: none; border-radius: 10px;
  padding: 8px 12px; font-weight: 700; border: 1px solid #cbd5e1; color: #0f172a; background: #f8fafc;
}
.actions .play { background: #1d4ed8; color: #fff; border-color: #1d4ed8; }

@media (min-width: 760px) {
  .hero { padding: 28px; }
  .hero-cta { display: flex; flex-wrap: wrap; }
  .hero-cta a { justify-content: flex-start; }
}
@media (min-width: 720px) {
  .card { grid-template-columns: 200px 1fr; gap: 16px; }
  .card img { height: 100%; min-height: 100%; }
}
</style>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-L7TY3RFZB7"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-L7TY3RFZB7');</script>
</head>
<body>
<main>
  <section class="hero" aria-labelledby="top-title">
    <p class="eyebrow">今日の1本が見つかるゲームポータル</p>
    <h1 id="top-title">遊ぶまで3秒 新着も定番もここで完結</h1>
    <p class="lead">反射神経で燃える日も じっくり頭を使いたい日もある その気分に合わせてすぐ遊べるようにまとめた</p>
    <div class="hero-cta" data-random-cta data-paths="${pathsJson}">
      <a href="#new">新着から選ぶ</a>
      <a href="#recommended">おすすめを見る</a>
      <a href="${escapeHtml(allGames[0]?.path ?? "/")}" data-random-link>ランダムで1本</a>
    </div>
    <div class="hero-stats" aria-label="ゲーム数サマリー">
      <p><strong>${games.length}</strong> タイトル公開中</p>
      <p><strong>${newestGames.length}</strong> 件の新着</p>
      <p><strong>${featuredGames.length}</strong> 件の注目作</p>
    </div>
  </section>

  <section id="new" class="section">
    <div class="section-head">
      <h2>新着ゲーム</h2>
      <p>追加されたばかりのゲーム まずはここから触るのが最短ルート</p>
    </div>
    <div class="grid">
${newestCardsHtml}
    </div>
  </section>

  <section id="recommended" class="section">
    <div class="section-head">
      <h2>おすすめピック</h2>
      <p>初見でも遊びやすいものを中心に 厳選して並べた</p>
    </div>
    <div class="grid">
${recommendedCardsHtml}
    </div>
  </section>

  <section id="all" class="section">
    <div class="section-head">
      <h2>全タイトル</h2>
      <p>迷ったら詳細を開いてルール確認 そのままワンタップでプレイへ</p>
    </div>
    <div class="grid">
${allCardsHtml}
    </div>
  </section>
</main>
<script>
(function(){
  var root = document.querySelector("[data-random-cta]");
  var randomLink = root ? root.querySelector("[data-random-link]") : null;
  var rawPaths = root ? root.getAttribute("data-paths") : null;
  if (randomLink && rawPaths) {
    try {
      var paths = JSON.parse(rawPaths);
      if (Array.isArray(paths) && paths.length > 0) {
        var index = Math.floor(Math.random() * paths.length);
        randomLink.setAttribute("href", paths[index]);
      }
    } catch(e) {}
  }
})();
</script>
<script>if("serviceWorker" in navigator){window.addEventListener("load",()=>{navigator.serviceWorker.register("/sw.js").catch(()=>{});});}</script>
</body>
</html>`;
}

function generateSitemap(data: GamesData): string {
  const latestDate = data.games.reduce(
    (max, g) => (g.publishedAt > max ? g.publishedAt : max),
    data.games[0]?.publishedAt ?? new Date().toISOString().slice(0, 10),
  );

  const urls = [
    `  <url>\n    <loc>${SITE_URL}/</loc>\n    <lastmod>${latestDate}</lastmod>\n    <priority>1.0</priority>\n  </url>`,
    ...data.games.map(
      (g) =>
        `  <url>\n    <loc>${SITE_URL}/games/${g.id}/</loc>\n    <lastmod>${g.publishedAt}</lastmod>\n    <priority>0.7</priority>\n  </url>`,
    ),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;
}

function generateHeaders(): string {
  return `/assets/*
  Cache-Control: public, max-age=31536000, immutable
/games/*/assets/*
  Cache-Control: public, max-age=31536000, immutable
/*.html
  Cache-Control: public, max-age=0, must-revalidate
/games/*/*.html
  Cache-Control: public, max-age=0, must-revalidate
/sw.js
  Cache-Control: no-store
/manifest.webmanifest
  Cache-Control: public, max-age=3600
/games/*
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff`;
}

function generateRedirects(data: GamesData): string {
  return data.games
    .map((g) => `/games/${g.id}/*  /games/${g.id}/index.html  200`)
    .join("\n");
}

export function portalSSG(): Plugin {
  return {
    name: "portal-ssg",
    apply: "build",
    generateBundle() {
      const data = loadGames();

      this.emitFile({
        type: "asset",
        fileName: "index.html",
        source: renderPortalHtml(data),
      });

      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source: generateSitemap(data),
      });

      this.emitFile({
        type: "asset",
        fileName: "_headers",
        source: generateHeaders(),
      });

      this.emitFile({
        type: "asset",
        fileName: "_redirects",
        source: generateRedirects(data),
      });
    },
  };
}
