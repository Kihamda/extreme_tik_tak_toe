---
description: "SEO 対策・OGP タグ・sitemap.xml を追加してWeb検索からの流入を増やす。"
---

# SEO / OGP 対応タスク

このゲームが Google / Twitter / LINE などで発見・シェアされやすくなるよう対応してください。

## Step 1: `index.html` メタタグ追加

以下を `<head>` 内に追加:

```html
<!-- 基本 SEO -->
<meta
  name="description"
  content="2〜10人対応！自由なボードサイズで遊べるn目並べ。ブラウザで即プレイ"
/>
<meta
  name="keywords"
  content="n目並べ, 五目並べ, 三目並べ, tic-tac-toe, ボードゲーム, ブラウザゲーム"
/>
<link rel="canonical" href="https://YOUR_DOMAIN/" />

<!-- OGP (Facebook / LINE) -->
<meta
  property="og:title"
  content="n目並べ — 自由なルールで遊べる多人数対応ボードゲーム"
/>
<meta
  property="og:description"
  content="ボードサイズ・プレイヤー数・揃える数を自由に設定！ブラウザで即プレイ"
/>
<meta property="og:type" content="website" />
<meta property="og:url" content="https://YOUR_DOMAIN/" />
<meta property="og:image" content="https://YOUR_DOMAIN/og-image.png" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta
  name="twitter:title"
  content="n目並べ — 自由なルールで遊べる多人数対応ボードゲーム"
/>
<meta name="twitter:image" content="https://YOUR_DOMAIN/og-image.png" />
```

## Step 2: `public/robots.txt` 作成

```
User-agent: *
Allow: /
Sitemap: https://YOUR_DOMAIN/sitemap.xml
```

## Step 3: `public/sitemap.xml` 作成

シングルページなのでシンプルに:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://YOUR_DOMAIN/</loc>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
```

## Step 4: OGP 画像生成

`public/og-image.png` (1200x630px) を作成する。内容は:

- 背景: グラデーション `#e8eaf6 → #c5cae9`
- タイトル: 「n目並べ」大きめフォント
- キャッチコピー: 「2〜10人対応・自由なルール設定」
- ゲームボードの簡易イメージ

## 実際のドメインに差し替える箇所

- `YOUR_DOMAIN` を公開 URL に変更
- GitHub Pages なら `https://username.github.io/リポジトリ名`
- Vercel なら自動割り当てドメイン
