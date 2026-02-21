---
description: "Astro ポータルサイト portal/ を構築する。ゲーム一覧・個別ページ・AdSense 枠・SEO を全部込みで実装する。"
---

# ポータルサイト構築タスク

`portal/` ディレクトリに Astro 製のゲームポータルサイトを構築します。
ポータルが育つほど新作ゲームの初速が上がる設計にします。

---

## 要件

- フレームワーク: Astro (静的サイト生成 = SSG)
- デプロイ: Cloudflare Pages (全ゲーム + portal を一括 `dist/` にビルドして配信)
- データ管理: `portal/src/data/games.json` 1ファイルで全ゲームを管理
- AdSense: 各ゲームページに広告枠を設置
- SEO: 各ゲームページで固有 title/description/OGP を設定
- **PWA: プラットフォーム全体を単一 PWA として公開 (scope: `/`)**
  - `public/manifest.webmanifest` でマニフェストを定義
  - `@vite-pwa/astro` で Service Worker を生成
  - SW の scope は `/` (全 `/games/*/` パスもカバー)

---

## AI が自律実行する構築手順

### Step 1: Astro プロジェクト初期化

```bash
cd portal
npm create astro@latest . -- --template minimal --install --no-git --typescript strict
npm install @vite-pwa/astro
```

### Step 2: ファイル構成

```
portal/
  src/
    layouts/
      BaseLayout.astro    # head タグ・SW 登録・AdSense・共通 CSS
    components/
      GameCard.astro       # ゲームカード (一覧用)
      AdBanner.astro       # AdSense 広告コンポーネント
      GameGrid.astro       # ゲーム一覧グリッド
    pages/
      index.astro          # トップ: 新着 + 全ゲーム一覧
      games/
        [id].astro         # 各ゲーム詳細ページ
    data/
      games.json           # ゲームメタデータ
  public/
    manifest.webmanifest   # プラットフォーム全体 PWA マニフェスト
    thumbnails/            # ゲームサムネイル画像 (空 OK)
    _headers               # Cloudflare Pages キャッシュヘッダー
  astro.config.mjs         # output: 'static' + @vite-pwa/astro
  package.json
```

### Step 3: games.json スキーマ

```ts
interface Game {
  id: string; // kebab-case
  title: string; // 日本語タイトル
  description: string; // 60字以内の一言説明
  path: string; // /games/[id]/  (同一ドメイン内パス)
  thumbnail: string; // /thumbnails/[id].png
  tags: string[]; // ジャンルタグ
  publishedAt: string; // YYYY-MM-DD
  featured: boolean; // トップ表示フラグ
}
```

### Step 4: BaseLayout.astro

```astro
---
interface Props {
  title: string;
  description: string;
  ogImage?: string;
  canonicalUrl: string;
}
const { title, description, ogImage, canonicalUrl } = Astro.props;
const ADSENSE_PUB_ID = import.meta.env.PUBLIC_ADSENSE_PUB_ID; // CF Pages 環境変数
---
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
  <meta name="description" content={description}>
  <link rel="canonical" href={canonicalUrl}>
  <meta property="og:title" content={title}>
  <meta property="og:description" content={description}>
  <meta property="og:type" content="website">
  <meta property="og:url" content={canonicalUrl}>
  {ogImage && <meta property="og:image" content={ogImage}>}
  <meta name="twitter:card" content="summary_large_image">
  {ADSENSE_PUB_ID && (
    <script async src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_PUB_ID}`} crossorigin="anonymous"></script>
  )}
</head>
<body>
  <slot />
</body>
</html>
```

### Step 5: index.astro (トップページ)

- featured ゲームをヒーローエリアに表示
- 全ゲームを publishedAt 降順でグリッド表示
- AdBanner を適切な位置 (ゲーム一覧の中間) に配置
- 内部リンク: `game.path` を使って `/games/[id]/` へ遷移 (target=\_self)

### Step 6: [id].astro (ゲーム詳細ページ)

- getStaticPaths() で games.json から全 id を生成
- ゲーム説明 + プレイボタン (`game.path` へのリンク)
- 他のゲームへの内部リンク (3本)
- AdBanner を上下に配置

### Step 7: astro.config.mjs

```ts
import { defineConfig } from "astro/config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  output: "static",
  vite: {
    plugins: [
      VitePWA({
        registerType: "autoUpdate",
        scope: "/", // 全ゲーム (/games/*/) をカバー
        manifest: false, // manifest.webmanifest は public/ に手書きで置く
        workbox: {
          globPatterns: ["**/*.{html,js,css,png,webp,svg,ico}"],
          navigateFallback: null, // SSG なので navigateFallback は不要
          runtimeCaching: [
            {
              // 各ゲームのアセットを訪問時にキャッシュ
              urlPattern: /^\/games\/.+\/assets\//,
              handler: "CacheFirst",
              options: {
                cacheName: "game-assets",
                expiration: { maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
          ],
        },
      }),
    ],
  },
});
```

### Step 8: public/manifest.webmanifest

```json
{
  "name": "ブラウザゲームポータル",
  "short_name": "GamePortal",
  "description": "無料ブラウザゲームが逆次リリースされるゲームプラットフォーム",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "theme_color": "#1a1a2e",
  "background_color": "#1a1a2e",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### Step 9: 動作確認

```bash
cd portal && npm run build
# 全体ビルドの担はルートから:
bash scripts/build-all.sh
```

---

## ゲーム追加時の更新手順 (以後)

`portal/src/data/games.json` の `games` 配列に追記するだけ。
git push → GitHub Actions (build-and-deploy.yml) が全体を再ビルドして CF Pages に自動デプロイする。

---

## 完了後の報告

```
✅ portal/ 構築完了

[人間がやること]
1. Cloudflare Pages プロジェクトで環境変数を設定:
   PUBLIC_ADSENSE_PUB_ID=ca-pub-xxxxxxxx
   (備考: AdSense 审査通過後まで広告は非表示)
2. iconl-192.png / icon-512.png を portal/public/ に配置
```
