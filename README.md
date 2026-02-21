# extreme_tik_tok_toe platform

このリポジトリはゲームプラットフォームのモノレポ構成

## 構成

- `games/ntiktaktoe/` 既存の React + Vite ゲーム
- `games/_template/` 新ゲーム追加テンプレート
- `portal/` Astro SSG のゲーム一覧ポータル
- `scripts/build-all.sh` platform 全体ビルド

## セットアップ

ルートで依存関係をインストール

```bash
npm install
```

## 開発

ゲームを起動

```bash
npm run dev:ntiktaktoe
```

ポータルを起動

```bash
npm run dev:portal
```

## ビルド

プラットフォーム全体を `dist/` に出力

```bash
npm run build
```

## lint

ワークスペース全体で lint 実行

```bash
npm run lint:all
```

## 新ゲーム追加手順

1. `games/_template` を `games/[your-id]` にコピー
2. `vite.config.ts` の `base` を `/games/[your-id]/` に変更
3. `portal/src/data/games.json` に登録
4. `npm run build` で `dist/games/[your-id]/` が出ることを確認
