---
description: "現在のルート src/ をモノレポ構造 games/ntiktaktoe/ に移行し、portal/ の土台も作る。一回限りの移行作業を自動化する。"
---

# モノレポ移行タスク

現在のフラット構造を `games/` + `portal/` のモノレポに移行します。
**実行前に git commit して退路を確保してください（これだけ人間作業）。**

---

## AI が自律実行する手順

### Step 1: ディレクトリ作成と移動

```bash
# games/ntiktaktoe/ を作成
mkdir -p games/ntiktaktoe

# src/ 以下をコピー
cp -r src games/ntiktaktoe/src
cp index.html games/ntiktaktoe/index.html
cp vite.config.ts games/ntiktaktoe/vite.config.ts
cp tsconfig.json games/ntiktaktoe/tsconfig.json
cp tsconfig.app.json games/ntiktaktoe/tsconfig.app.json
cp tsconfig.node.json games/ntiktaktoe/tsconfig.node.json
cp package.json games/ntiktaktoe/package.json
cp eslint.config.js games/ntiktaktoe/eslint.config.js
cp -r public games/ntiktaktoe/public
```

### Step 2: games/ntiktaktoe/package.json 修正

`name` を `@games/ntiktaktoe` に変更。ルートからの相対パスが壊れないようにする。

### Step 3: ゲームテンプレート作成

`games/_template/` に汎用テンプレートを作成する:

- `src/lib/types.ts` - 型定義の雛形
- `src/lib/constants.ts` - 定数の雛形
- `src/App.tsx` - 最小実装のゲームフェーズ制御
- `src/components/StartScreen.tsx`, `GameView.tsx`, `ResultScreen.tsx`
- `index.html` - SEO/OGP タグ付き
- `vite.config.ts` - **base: '/games/**GAME_ID**/' 入り** (PWA 設定は不要)
- `package.json` - 依存関係

### Step 4: portal/ 初期化

```bash
cd portal
npm create astro@latest . -- --template minimal --install --no-git
```

`portal/src/data/games.json` を作成:

```json
{
  "games": [
    {
      "id": "ntiktaktoe",
      "title": "n目並べ",
      "description": "2〜10人対応！ボードサイズ・揃える数を自由設定できるn目並べ。",
      "path": "/games/ntiktaktoe/",
      "thumbnail": "/thumbnails/ntiktaktoe.png",
      "tags": ["strategy", "multiplayer", "board-game"],
      "publishedAt": "2026-02-21",
      "featured": true
    }
  ]
}
```

`portal/src/pages/index.astro` を作成 (ゲーム一覧):

```astro
---
import gamesData from '../data/games.json'
const { games } = gamesData
---
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>ブラウザゲームポータル</title>
</head>
<body>
  <h1>ゲーム一覧</h1>
  <div class="games-grid">
    {games.map(game => (
      <a href={game.url} target="_blank" rel="noopener">
        <article>
          <h2>{game.title}</h2>
          <p>{game.description}</p>
        </article>
      </a>
    ))}
  </div>
</body>
</html>
```

### Step 5: ルート package.json をモノレポ用に更新

```json
{
  "name": "extreme-tik-tok-toe-platform",
  "private": true,
  "scripts": {
    "build": "bash scripts/build-all.sh",
    "dev:ntiktaktoe": "cd games/ntiktaktoe && npm run dev",
    "dev:portal": "cd portal && npm run dev",
    "lint:all": "npm run lint --workspaces --if-present"
  }
}
```

### Step 6: 動作確認

```bash
cd games/ntiktaktoe && npm install && npm run lint && npm run build
```

エラーが出たら修正してから報告する。

---

## 完了後の報告フォーマット

```
✅ モノレポ移行完了

新しい構造:
  games/ntiktaktoe/  ← 元の src/ を移動
  games/_template/   ← 新ゲーム作成用テンプレート
  portal/            ← Astro ポータル (初期状態)

動作確認:
  cd games/ntiktaktoe && npm run dev    # Game #1
  cd portal && npm run dev              # ポータル

【人間がやること】
1. Vercel: games/ntiktaktoe を Root Directory に指定してプロジェクト作成
2. Vercel: portal を Root Directory に指定してプロジェクト作成
3. portal の URL が確定したら portal/src/data/ の内部リンクを更新
4. 旧 src/ ディレクトリを削除: git rm -r src/ index.html vite.config.ts (確認後)
```
