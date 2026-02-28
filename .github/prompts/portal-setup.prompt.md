---
description: "Vite SSG プラグイン (plugins/portal-ssg.ts) でゲームポータルを生成する。ビルド時に静的HTML・sitemap・headers・redirectsを出力する。"
---

# ポータルサイト構築タスク

`plugins/portal-ssg.ts` の Vite プラグインでゲームポータルサイトを生成します。
Astro は廃止済み。ポータルはビルド時に SSG プラグインが静的 HTML として出力する。

---

## 現在のアーキテクチャ

- ポータル生成: `plugins/portal-ssg.ts` (Vite プラグイン)
- データソース: `src/portal/data/games.json`
- 出力先: `dist/index.html` (ビルド時自動生成)
- デプロイ: Cloudflare Pages (全ゲームと同一 `dist/` に出力)
- PWA: `public/manifest.webmanifest` + `public/sw.js` (手書き・静的配信)

---

## SSG プラグインが生成するもの

`npm run build` (= `tsc -b && vite build`) 実行時に以下を `dist/` に出力:

| ファイル      | 内容                                      |
| ------------- | ----------------------------------------- |
| `index.html`  | ゲーム一覧ポータル (SEO/OGP/構造化データ) |
| `sitemap.xml` | 全ゲームの URL を含むサイトマップ         |
| `_headers`    | Cloudflare Pages キャッシュヘッダー       |
| `_redirects`  | リダイレクトルール                        |

## プラグインの構成

`plugins/portal-ssg.ts`:

```ts
import type { Plugin } from "vite";

export function portalSSG(): Plugin {
  return {
    name: "portal-ssg",
    closeBundle() {
      // 1. src/portal/data/games.json を読み込む
      // 2. ポータル HTML をレンダリング
      // 3. sitemap.xml を生成
      // 4. _headers を生成
      // 5. _redirects を生成
      // すべて dist/ に書き出す
    },
  };
}
```

## ゲームメタデータ

`src/portal/data/games.json`:

```json
{
  "games": [
    {
      "id": "ntiktaktoe",
      "title": "n目並べ",
      "description": "盤面サイズやプレイヤー人数を自由に調整できるエクストリームな n目並べ",
      "path": "/games/ntiktaktoe/",
      "thumbnail": "/thumbnails/ntiktaktoe.svg",
      "tags": ["strategy", "multiplayer"],
      "publishedAt": "2026-02-21",
      "featured": true
    }
  ]
}
```

## URL 構造

- `https://game.kihamda.net/` → ポータル (SSG 生成)
- `https://game.kihamda.net/games/[id]/` → 各ゲーム SPA

## PWA 構成

- `public/manifest.webmanifest` — プラットフォーム全体 PWA マニフェスト (scope: `/`)
- `public/sw.js` — Service Worker (手書き、静的配信)
- 各ゲームに `vite-plugin-pwa` は **不要**

## Cloudflare Pages キャッシュ設定

SSG プラグインが `dist/_headers` を生成する:

```
/assets/*
  Cache-Control: public, max-age=31536000, immutable
/games/*/assets/*
  Cache-Control: public, max-age=31536000, immutable
/*.html
  Cache-Control: public, max-age=0, must-revalidate
/sw.js
  Cache-Control: no-store
/manifest.webmanifest
  Cache-Control: public, max-age=3600
```

## ゲーム追加時の更新手順

`src/portal/data/games.json` の `games` 配列に追記するだけ。
git push → GitHub Actions が `npm run build` → CF Pages に自動デプロイ。

## ポータル HTML を変更する場合

`plugins/portal-ssg.ts` を直接編集する。

- `renderPortalHtml()` でポータルのレイアウト・デザインを変更
- `renderGameCard()` でゲームカードのテンプレートを変更
- SEO/OGP タグは `renderPortalHtml()` 内で設定

---

## 完了後の報告

```
✅ ポータル更新完了

確認:
  npm run build && npm run preview
  # ブラウザで http://localhost:4173/ にアクセス
```
