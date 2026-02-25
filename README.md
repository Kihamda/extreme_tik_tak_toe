# extreme_tik_tok_toe platform

ブラウザゲームプラットフォームのモノレポ。全ゲームを1リポジトリで管理し、Vercel にデプロイする。

**Portal**: https://game.kihamda.net/

## ゲームラインナップ (14本)

| ID | タイトル | ジャンル |
|---|---|---|
| `ntiktaktoe` | n目並べ | ストラテジー/多人数 |
| `flashreflex` | Flash Reflex | 反射神経 |
| `gravityfour` | Gravity Four | ボード/2人対戦 |
| `memoryduel` | Memory Duel | 記憶/2人対戦 |
| `snakechaos` | Snake Chaos | アーケード |
| `merge2048` | Merge 2048 | パズル |
| `brickblast` | Brick Blast | アーケード |
| `molemania` | Mole Mania | アーケード |
| `colorburst` | Color Burst | 反射神経/パズル |
| `taptarget` | Tap Target | 反射神経 |
| `simonecho` | Simon Echo | 記憶 |
| `numhunt` | Num Hunt | 反射神経 |
| `dodgeblitz` | Dodge Blitz | アーケード |
| `typingblitz` | Typing Blitz | タイピング |

## 構成

```
extreme_tik_tok_toe/
  games/
    ntiktaktoe/    ← Game #1
    flashreflex/   ← Game #2
    gravityfour/   ← Game #3
    memoryduel/    ← Game #4
    snakechaos/    ← Game #5
    merge2048/     ← Game #6
    brickblast/    ← Game #7
    molemania/     ← Game #8
    colorburst/    ← Game #9
    taptarget/     ← Game #10
    simonecho/     ← Game #11
    numhunt/       ← Game #12
    dodgeblitz/    ← Game #13
    typingblitz/   ← Game #14
    _template/     ← 新ゲーム量産テンプレート
  portal/          ← Astro SSG ゲーム一覧ポータル
  scripts/         ← 一括ビルドスクリプト
```

## セットアップ

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
