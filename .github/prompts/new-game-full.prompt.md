---
description: "新しいゲームを企画から実装・PWA・SEO・portal登録まで全工程を完走する。これ1つで完成まで行ける。"
---

# 新ゲーム全工程実行プロンプト

ゲームの概要を教えてください。あとはすべて自動で完成まで進めます。

## 入力として教えること (これだけでOK)

```
ゲームID: [kebab-case の英数字]
タイトル: [日本語タイトル]
一言説明: [〇〇するゲーム、60文字以内]
ゲームの概要: [どんなゲームか、ルールの概要]
```

---

## AI が自律実行する全工程

### Phase A: コード実装

1. `codebase` で `games/_template/` を読み込んで構造を把握する
2. `games/[game-id]/` を `_template` から作成する
3. 以下の順で実装する:

**実装順序 (この順を守る)**:

```
games/[game-id]/src/lib/types.ts       ← ゲーム固有の型定義
games/[game-id]/src/lib/constants.ts   ← 定数 (ボードサイズ、初期値など)
games/[game-id]/src/lib/[game-id].ts   ← ゲームロジック純粋関数
games/[game-id]/src/App.tsx            ← 状態管理・フェーズ制御
games/[game-id]/src/components/        ← StartScreen, GameView, ResultScreen
games/[game-id]/index.html             ← SEO / OGP メタタグ
games/[game-id]/vite.config.ts         ← base: '/games/[game-id]/' 必須
```

4. `cd games/[game-id] && npm install` を実行
5. `npm run lint && npm run build` を実行
6. エラーがあれば修正して 5 に戻る

### Phase B: vite.config.ts の base パス設定

`games/[game-id]/vite.config.ts` に **base パスを必ず設定**する。
Cloudflare Pages の単一ドメイン配下 `/games/[game-id]/` に配置されるため必須。

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/games/[game-id]/", // game-id を実際の ID に変更
  build: {
    outDir: "dist",
    assetsDir: "assets",
  },
  plugins: [react()],
});
```

**PWA について**: Service Worker と manifest は portal 側で一元管理するため、
各ゲームに `vite-plugin-pwa` は不要。

### Phase C: SEO / OGP 設定

`games/[game-id]/index.html` の `<head>` に追加:

```html
<meta name="description" content="[一言説明]" />
<meta name="keywords" content="[関連キーワード, ブラウザゲーム, 無料]" />
<meta property="og:title" content="[ゲームタイトル]" />
<meta property="og:description" content="[一言説明]" />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://[game-id].vercel.app" />
<meta property="og:image" content="https://[game-id].vercel.app/og-image.png" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="[ゲームタイトル]" />
<meta
  name="twitter:image"
  content="https://[game-id].vercel.app/og-image.png"
/>
<link rel="canonical" href="https://[game-id].vercel.app" />
```

`games/[game-id]/public/robots.txt`:

```
User-agent: *
Allow: /
Sitemap: https://[CF-Pages-ドメイン]/sitemap.xml
```

### Phase D: portal 登録

`portal/src/data/games.json` の `games` 配列に追加:

```json
{
  "id": "[game-id]",
  "title": "[タイトル]",
  "description": "[一言説明]",
  "path": "/games/[game-id]/",
  "thumbnail": "/thumbnails/[game-id].png",
  "tags": ["タグ1", "タグ2"],
  "publishedAt": "[今日の日付 YYYY-MM-DD]",
  "featured": false
}
```

---

## 完了後の報告フォーマット

```
✅ 実装完了: games/[game-id]/

変更ファイル:
- games/[game-id]/src/lib/types.ts
- games/[game-id]/src/lib/[game-id].ts
- games/[game-id]/src/App.tsx
- games/[game-id]/src/components/...
- games/[game-id]/index.html
- games/[game-id]/vite.config.ts  (base: '/games/[game-id]/')
- portal/src/data/games.json

動作確認:
  cd games/[game-id] && npm run dev
  # ブラウザで http://localhost:5173/games/[game-id]/ にアクセス

デプロイ:
  git add . && git commit -m "feat: add [game-id] game"
  git push origin main
  # → GitHub Actions (build-and-deploy.yml) が自動実行
  # → scripts/build-all.sh で dist/ に一括ビルド
  # → Cloudflare Pages に自動デプロイ
  # → URL: https://[CF-Pages-ドメイン]/games/[game-id]/

【人間がやること】
1. SNS 投稿: GitHub Actions の release-pipeline を手動トリガー
   URL: https://[CF-Pages-ドメイン]/games/[game-id]/
2. サムネイル製作: portal/public/thumbnails/[game-id].png (640x360)
```
