---
description: "GitHub Actions を使って X (Twitter) / Bluesky に新作ゲームの告知・プレイ促進ポストを自動投稿するシステムを構築する。"
---

# SNS 自動化タスク

GitHub Actions を使って、ゲームリリース時と定期的なプレイ促進ポストを自動投稿するシステムを構築してください。

## 要件

### 投稿タイミング

1. **リリース時**: 新しいゲームを Vercel にデプロイしたとき
2. **定期投稿**: 毎週月曜 9:00 JST に既存ゲームのランダム紹介

### 投稿先

- X (Twitter) — API v2 無料プラン (月1,500ポスト)
- Bluesky — AT Protocol (無料・制限なし)

---

## Step 1: ポスト内容生成スクリプト

`scripts/generate-post.ts` を新規作成:

```ts
// ゲーム情報を受け取り、SNS 投稿文を生成する純粋関数
export function generateReleasePost(game: {
  title: string;
  description: string;
  url: string;
  tags: string[];
}): string;

export function generateWeeklyPost(games: GameInfo[]): string;
```

投稿文のテンプレート:

- リリース: `🎮 新作公開！「{title}」\n{description}\n▶ {url}\n{hashtags}`
- 定期: `今週のおすすめ！「{title}」\n{description}\n▶ {url}`

### 文字数制限

- X: 280文字
- Bluesky: 300文字

---

## Step 2: GitHub Actions ワークフロー作成

### `.github/workflows/sns-post-release.yml`

トリガー: `workflow_dispatch` + Vercel デプロイ成功後の `repository_dispatch`

```yaml
name: SNS Post on Release
on:
  workflow_dispatch:
    inputs:
      game_title:
        description: "ゲームタイトル"
        required: true
      game_url:
        description: "ゲーム URL"
        required: true
      game_description:
        description: "一言説明 (140文字以内)"
        required: true
```

### `.github/workflows/sns-post-weekly.yml`

トリガー: `schedule: cron: '0 0 * * 1'` (月曜 9:00 JST = UTC 0:00)

---

## Step 3: 投稿実行スクリプト

`scripts/post-to-x.ts`:

- X API v2 の `POST /2/tweets` を使用
- OAuth 2.0 PKCE で認証

`scripts/post-to-bluesky.ts`:

- `@atproto/api` を使用 (`npm install @atproto/api`)
- App Password で認証

---

## Step 4: GitHub Secrets 設定

以下を GitHub リポジトリの Settings > Secrets に追加指示:

| シークレット名          | 内容                                    |
| ----------------------- | --------------------------------------- |
| `X_API_KEY`             | X API Key                               |
| `X_API_SECRET`          | X API Secret                            |
| `X_ACCESS_TOKEN`        | X Access Token                          |
| `X_ACCESS_TOKEN_SECRET` | X Access Token Secret                   |
| `BLUESKY_IDENTIFIER`    | Bluesky ハンドル (例: user.bsky.social) |
| `BLUESKY_APP_PASSWORD`  | Bluesky App Password                    |

---

## Step 5: ゲームリスト管理

`scripts/games.json` を作成して管理:

※ 正式なゲームメタデータは `src/portal/data/games.json` を参照すること。

```json
[
  {
    "title": "n目並べ",
    "description": "2〜10人対応！自由なルールで遊べるボードゲーム",
    "url": "https://game.kihamda.net/games/ntiktaktoe/",
    "tags": ["ボードゲーム", "ブラウザゲーム", "五目並べ"],
    "releaseDate": "2026-02-21"
  }
]
```

---

## 注意点

- secrets が未設定でも Actions が失敗しないよう `if: env.X_API_KEY != ''` でガードする
- 投稿内容のプレビューを Actions の Summary に出力する (実際に投稿する前に確認できるよう `dry-run` input を追加)
- `tsconfig.node.json` の `include` に `scripts/**` を追加する
