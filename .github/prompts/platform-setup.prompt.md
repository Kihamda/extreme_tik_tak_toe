---
description: "このモノレポに `portal/` ディレクトリを作成し、Astro でゲームポータルサイトを構築する。全ゲームを一元管理し AdSense を配置する。"
---

# ゲームポータルサイト構築タスク

**このリポジトリ内**に `portal/` ディレクトリを作成し、Astro でゲームプラットフォームのポータルサイトを構築してください。別リポジトリは作成しない。

## 設計方鷑

- **ゲームの追加 = `portal/src/data/games.json` に1エントリ追加するだけ**になるよう設計する
- 各ゲーム (`games/*/`) は Vercel に別プロジェクトとして登録し、ポータルから iframe またはリダイレクトで配信
- AdSense を全ページに配置
- SEO ファースト — Astro の SSG で全ページを静的生成

---

## Step 1: `portal/` ディレクトリの初期化

```bash
cd portal
npm create astro@latest . -- --template minimal --typescript strict
npm install
```

**採用技術**:

- Astro (SSG) — SEO 最強、ゼロ JSデフォルト
- TypeScript strict
- Vercel デプロイ (Root Directory: `portal`)

---

## Step 2: ゲームメタデータ管理

`portal/src/data/games.json` を作成:

```json
[
  {
    "id": "ntiktaktoe",
    "title": "n目並べ",
    "description": "2〜10人対応！自由なボードサイズで遊べるアドバンスド三目並べ",
    "url": "https://ntiktaktoe.vercel.app",
    "thumbnail": "/thumbnails/ntiktaktoe.png",
    "tags": ["ボードゲーム", "対戦", "2人", "複数人"],
    "releaseDate": "2026-02-21",
    "featured": true
  }
]
```

`src/lib/games.ts` でスキーマ型を定義:

```ts
export interface GameMeta {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnail: string;
  tags: string[];
  releaseDate: string;
  featured: boolean;
}
```

---

## Step 3: ページ構成

| ページ | パス           | 内容                               |
| ------ | -------------- | ---------------------------------- |
| トップ | `/`            | 新着・おすすめゲーム一覧 + AdSense |
| 一覧   | `/games/`      | 全ゲーム + タグフィルター          |
| 詳細   | `/games/[id]/` | 説明・iframe プレイ + AdSense      |
| タグ   | `/tags/[tag]/` | タグ別一覧 (SEO ロングテール)      |

各ページに以下を必ず含む:

- `<title>` と `<meta name="description">`
- OGP タグ (og:image は各ゲームのサムネイル)
- 構造化データ (`@type: WebApplication`)
- sitemap.xml 自動生成 (`@astrojs/sitemap`)

---

## Step 4: AdSense 配置

`src/components/AdUnit.astro` を作成:

```astro
---
interface Props {
  slot: string
  format?: 'auto' | 'rectangle' | 'horizontal'
}
const { slot, format = 'auto' } = Astro.props
---
<ins class="adsbygoogle"
  style="display:block"
  data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
  data-ad-slot={slot}
  data-ad-format={format}>
</ins>
<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
```

配置箇所:

- ゲーム一覧: 6件ごとに1個
- 詳細ページ: iframe の上下に各1個

---

## Step 5: 新作ゲーム追加フロー

新しいゲームをリリースするたびにやること:

1. `games/_template/` をコピー → `games/[game-id]/` にリネーム (このリポジトリ内で作業)
2. `games/[game-id]/src/` を書き換えてゲームを実装
3. Vercel に新プロジェクトを追加 (Root Directory: `games/[game-id]`) → URL を取得
4. `portal/src/data/games.json` に1エントリ追加 → git push → `portal/` 自動再ビルド
5. SNS 自動投稿ワークフローをトリガー

---

## Step 6: 内部リンク戦略

各ゲーム詳細ページの下部に「他のゲームもプレイ」セクションを追加:

- 同じタグを持つゲームを3〜4本表示
- プラットフォーム全体の回遊率 → PV 増加 → AdSense 収益増加

---

## Vercel デプロイ設定

`vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "astro"
}
```

独自ドメインは Vercel の無料プランで設定可能 (要ドメイン取得 — `.com` なら年¥1,500程度)。
