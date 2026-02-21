# Copilot Instructions

## Project Overview

**このリポジトリはこの1つだけ使用する。** ブラウザゲームプラットフォーム全体をこのモノレポで管理する。

```
extreme_tik_tok_toe/
  games/
    _template/        # 新作ゲームの雛形
    ntiktaktoe/       # Game #1 「n目並べ」
      src/            # 元の src/ をここに移動する
      index.html
      vite.config.ts
      package.json
    game-02/          # Game #2 ([将来])
  portal/             # ゲーム一覧セート (Astro)
    src/
      data/games.json # ゲームメタデータ一元管理
  .github/
    workflows/
    prompts/
    agents/
```

各ゲーム (`games/*/`) と `portal/` は全体 `scripts/build-all.sh` で一括ビルドされ、単一の Cloudflare Pages プロジェクトにデプロイする。

## Architecture

```
games/ntiktaktoe/src/
  App.tsx              # アプリ全体の状態管理。ゲームフェーズ制御の唯一の場所
  components/          # 表示専用コンポーネント（StartScreen, GameView, ResultScreen）
  lib/
    types.ts           # 型定義のみ。ロジック・副作用なし
    constants.ts       # DEFAULT_COLORS, DEFAULT_MARKS など定数
    settings.ts        # GameSettings の生成・クローン関数
    players.ts         # プレイヤー設定の純粋関数 (add/remove/update)
    board.ts           # ボード操作・勝利判定の純粋関数
    storage.ts         # localStorage への読み書き（副作用はここだけ）
```

**新ゲームの追加手順**: `games/_template/` をコピー → `games/[game-id]/` にリネーム → `src/` を書き換え → `portal/src/data/games.json` に追記

**設計方針**:

- `lib/` の関数はすべて純粋関数。状態・副作用を持たない
- 全ゲーム状態は `App.tsx` の useState が一元管理
- `GameSettings` は必ず `cloneGameSettings()` でディープコピーしてから渡す
- プレイヤー設定変更は関数型アップデータで行う: `setNewGameSettings(prev => updatePlayerName(prev, index, name))`

## Game Phase Flow

`"before"` → (ゲーム開始) → `"in_progress"` → (勝者決定) → `"after"` → (リセット) → `"before"`

型: `AppPhase = "before" | "in_progress" | "after"`

## Build & Dev Commands

各ゲームと portal はそれぞれのディレクトリ内で実行する:

```bash
# 特定のゲームを開発する場合
cd games/ntiktaktoe
npm install
npm run dev          # 開発サーバー起動
npm run build        # tsc -b && vite build
npm run lint         # ESLint チェック

# portal を開発する場合
cd portal
npm install
npm run dev
npm run build
```

- **ビルドコマンド**:
  - 全体: `bash scripts/build-all.sh` (全ゲーム + portal → `dist/`)
  - 山 portal: `cd portal && npm run build`
  - 1ゲーム: `cd games/[id] && npm run build`
- **各ゲームの base パス**: `base: '/games/[game-id]/'` が必須 (Cloudflare Pages 単一ドメイン配下)
- **URL 構造**: `https://[CF-domain]/` (ポータル) / `https://[CF-domain]/games/[id]/` (各ゲーム)

## Code Style

- **型インポートは必ず `import type`**: `verbatimModuleSyntax: true` のため必須
- **strict モード全有効**: `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch` など
- CSS は `src/App.css` の単一ファイル。BEM ライクなクラス名（例: `.start-card`, `.player-config-item`）
- コンポーネントは props を明示的な interface で型定義する
- 不要なコメントは書かない

## Key Types ([games/ntiktaktoe/src/lib/types.ts](../games/ntiktaktoe/src/lib/types.ts))

```ts
Board = CellValue[][]          // CellValue = string | null
GameSettings { board: { width, height }, players: Player[], winLength }
Player { name, mark, color }
PersistedState                 // localStorage 保存用スナップショット
DevicePreferences              // デバイス固有設定（確認モード等）
```

## Integration Points

- **localStorage**: `saveGameState` / `loadGameState` / `clearSavedGame` (`lib/storage.ts`)
- 外部 API・認証・テストフレームワークは未使用
- Vite の `base: '/games/[game-id]/'` 設定あり（Cloudflare Pages パスベース配信）

## Platform Strategy

収益化ロードマップは [ROADMAP.md](../ROADMAP.md) を参照。

**ビジョン**: 多様なゲームが次々リリースされるプラットフォーム。すべてのゲームとポータルはこのリポジトリ内で開発する。

**ホスティング戦略**:

- Cloudflare Pages (無料・無制限帯域・CDN) 単一プロジェクト
- `scripts/build-all.sh` で全ゲーム + portal を `dist/` に一括ビルド
- GitHub Actions (`build-and-deploy.yml`) が main push 時に自動デプロイ
- Cloudflare エッジキャッシュ + Service Worker の2層キャッシュ
- PWA: `portal/` 内の単一 SW + manifest が scope `/` で全ゲームをカバー

**優先順位**:

1. モノレポ構成にリストラクチャ: `src/` → `games/ntiktaktoe/src/`、`portal/` ディレクトリ作成
2. Game #1 (`games/ntiktaktoe/`) を Cloudflare Pages に公開、AdSense 审査申請
3. `portal/` を Cloudflare Pages 内の `/` のルートとして公開
4. `games/` 配下に新作を月1〜2本追加、`games.json` + SNS 自動投稿

**据りにすべきパターン**: `games/ntiktaktoe/src/lib/` の純粋関数設計。新ゲーム作成時もこの設計を踏襲する。

## Copilot Agents & Prompts

### Agents (@エージェント名 で呼ぶ)

| ファイル                                     | 用途                                                      |
| -------------------------------------------- | --------------------------------------------------------- |
| `.github/agents/gamedev.agent.md`            | 機能実装・バグ修正・lint/build まで自律実行               |
| `.github/agents/growth.agent.md`             | 収益化・SEO・SNS戦略をコードレベルで実行                  |
| `.github/agents/platform-architect.agent.md` | モノレポ移行・ポータル構築・Cloudflare Pages設定          |
| `.github/agents/game-factory.agent.md`       | 「〇〇ゲームを作って」の一言で完成まで全工程実行          |
| `.github/agents/agent-editor.agent.md`       | エージェント/プロンプト/Copilot設定の管理・整合性チェック |

### Prompts (`#プロンプト名` で呼ぶ)

| ファイル                                       | 用途                                   |
| ---------------------------------------------- | -------------------------------------- |
| `.github/prompts/new-game-full.prompt.md`      | ゲーム全工程 (実装→PWA→SEO→portal登録) |
| `.github/prompts/monorepo-migration.prompt.md` | 現在の src/ をモノレポ構造に一括移行   |
| `.github/prompts/portal-setup.prompt.md`       | Astro ポータルサイト構築               |
| `.github/prompts/game-ideation.prompt.md`      | 新作ゲーム企画を5本生成                |
| `.github/prompts/pwa.prompt.md`                | PWA 実装 (vite-plugin-pwa)             |
| `.github/prompts/seo.prompt.md`                | SEO / OGP / sitemap 対応               |
| `.github/prompts/add-feature.prompt.md`        | 機能追加 (AI対戦・テーマ・統計等)      |
| `.github/prompts/sns-automation.prompt.md`     | SNS 自動投稿スクリプト実装             |

### Workflows (Actions タブから手動実行)

| ファイル                                 | 用途                                                         |
| ---------------------------------------- | ------------------------------------------------------------ |
| `.github/workflows/build-and-deploy.yml` | **メイン**: main push 時に全体ビルド + CF Pages 自動デプロイ |
| `.github/workflows/ci.yml`               | PR 時の自動 lint + build チェック                            |
| `.github/workflows/release-pipeline.yml` | リリース時の最終ビルド確認 + Twitter 自動投稿                |
| `.github/workflows/deploy.yml`           | GitHub Pages デプロイ (移行前の暫定、将来削除予定)           |

### 人間がやること

→ [`YourSuckJobs.md`](../YourSuckJobs.md) を参照
