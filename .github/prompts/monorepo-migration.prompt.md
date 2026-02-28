---
description: "【移行完了済み】旧モノレポ構成から単一Viteプロジェクトへの統合は完了済み。現在のアーキテクチャのリファレンスとして残す。"
---

# アーキテクチャリファレンス (旧: モノレポ移行タスク)

> **このプロンプトは移行完了済みのため、メンテナンス不要です。**
> 現在のアーキテクチャのリファレンスとして残しています。

---

## 現在のアーキテクチャ (統合済み)

単一の Vite プロジェクトに統合済み。以下の構成で運用中。

```
games/
  _template/           # 新作ゲームの雛形 (index.html + src/App.tsx + main.tsx)
  [game-id]/           # 14本のReactゲーム (index.html + src/*)
src/
  shared/              # 全ゲーム共通 (GameShell, ParticleLayer, ScorePopup, useAudio, useParticles)
  portal/data/games.json  # ゲームメタデータ一元管理
plugins/
  portal-ssg.ts        # Viteプラグイン: ポータルHTML/sitemap/headers/redirects生成
public/                # 静的アセット (thumbnails, manifest.webmanifest, sw.js)
index.html             # 開発用ランチャー (ビルド非対象)
vite.config.ts         # マルチエントリ (games/*) + SSGプラグイン
package.json           # 単一 (ルートのみ)
```

## ビルド

```bash
npm run build   # = tsc -b && vite build (約600ms)
```

出力: `dist/` (ポータル + 全ゲーム + sitemap.xml + \_headers + \_redirects)

## URL構造

- `https://game.kihamda.net/` → ポータル (SSG生成)
- `https://game.kihamda.net/games/[id]/` → 各ゲームSPA

## 廃止されたもの

- `portal/` ディレクトリ (Astro) → `plugins/portal-ssg.ts` に移行
- `packages/` ディレクトリ → 不要化
- `turbo.json` / Turborepo → 不要化
- `scripts/build-all.sh` → 単一 `vite build` に置換
- 各ゲームの個別 `package.json` / `vite.config.ts` / `tsconfig.json` → ルートに集約済み

## 新ゲーム追加手順

1. `games/_template/` を `games/[game-id]/` にコピー
2. `src/` 内を実装 (共通ライブラリ: `import { GameShell, useAudio } from "../../../src/shared"`)
3. `index.html` に title/meta/OGP/canonical/GA4 を設定
4. `src/portal/data/games.json` にエントリ追加
5. `public/thumbnails/[game-id].svg` にサムネイル追加
6. `npm run build` で確認
