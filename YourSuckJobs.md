# YourSuckJobs.md

> AI に任せられないやつだけここに書いてある。
> ここにないことは全部 Copilot に言えばやってくれる。

---

## 🔴 一度だけやること (初期セットアップ)

### 1. Cloudflare Pages セットアップ

1. [cloudflare.com](https://cloudflare.com) で無料アカウント作成
2. Dashboard → Pages → "Create a project" → "Connect to Git"
3. `extreme_tik_tok_toe` リポジトリを選択
4. **Build 設定**:
   - Build command: `bash scripts/build-all.sh`
   - Build output directory: `dist`
   - Node version (Environment variable): `NODE_VERSION` = `20`
5. "Save and Deploy" 押す → URLをメモ: `https://[project].pages.dev`

> 以後は main push するだけで自動デプロイされる。**(GitHub Actions に簡略化する場合は下記参照)**

---

### 1b. GitHub Actions から CF Pages にデプロイする場合 (lint チェック付き)

lint 通過後にデプロイしたい場合はこちらを設定する。

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → "My Profile" → "API Tokens" → "Create Token"
   - "Edit Cloudflare Workers" テンプレートをベースに
   - Permissions: **Cloudflare Pages: Edit**
   - "Create Token" → トークンを**コピペースト**
2. Cloudflare Dashboard → 右上アイコン → Account ID をコピペースト
3. GitHub リポジトリ → Settings → Secrets and variables → Actions → "New repository secret"
   ```
   CLOUDFLARE_API_TOKEN   ← 手順 1 のトークン
   CLOUDFLARE_ACCOUNT_ID  ← 手順 2 の Account ID
   ```
4. GitHub リポジトリ → Settings → Secrets and variables → Actions → "Variables" → "New repository variable"
   ```
   CF_PAGES_PROJECT_NAME  ← Cloudflare Pages のプロジェクト名 (例: game-portal)
   ```

---

### 2. Google AdSense 審査申請

1. [adsense.google.com](https://adsense.google.com) でアカウント作成
2. サイト URL を登録 (`https://[project].pages.dev`)
3. `<script>` タグを HTML に貼り付け → Copilot に「AdSenseタグを設置して」と頂む
4. 审査は **2〜4週間**かかる。今すぐ申請しないと収益化が遅れる
5. 审査通過後、パブリッシャーID (`ca-pub-xxxxxxxx`) を Cloudflare Pages の環境変数に設定:
   - Cloudflare Dashboard → Pages → [project] → Settings → Environment variables
   - `PUBLIC_ADSENSE_PUB_ID` = `ca-pub-xxxxxxxx`

---

### 3. Google Search Console 登録

1. [search.google.com/search-console](https://search.google.com/search-console) にアクセス
2. "プロパティを追加" → Cloudflare Pages の URL を入力
3. 所有権確認: HTML ファイル方式 → Copilot に「Search Console の確認ファイルを portal/public/ に置いて」と頂む
4. `sitemap.xml` を送信 (Copilot が生成済みなら URL を入力するだけ)

---

### 4. Twitter / X API キー取得

SNS 自動投稿を使うなら必要。使わないなら不要。

1. [developer.twitter.com](https://developer.twitter.com) でアプリ作成
2. 以下の4つを取得してコピー:
   ```
   API Key                  → TWITTER_API_KEY
   API Secret               → TWITTER_API_SECRET
   Access Token             → TWITTER_ACCESS_TOKEN
   Access Token Secret      → TWITTER_ACCESS_TOKEN_SECRET
   ```
3. GitHub リポジトリ → Settings → Secrets and variables → Actions → "New repository secret"
   で上記4つを登録する

---

### 5. GitHub Pages を無効化 (必須)

Cloudflare Pages 一本化するので古い deploy.yml による GitHub Pages デプロイは履歴に残すだけで守りはない。気になるなら:

- リポジトリ Settings → Pages → Source を "None" に変更
- または Copilot に 「.github/workflows/deploy.yml を削除して」と頂む

---

## 🟡 ゲームを追加するたびにやること

| 作業                 | 所要時間 | 方法                                                               |
| -------------------- | -------- | ------------------------------------------------------------------ |
| SNS 投稿をトリガー   | 1分      | GitHub Actions → "Release Pipeline" → Run workflow → 入力して実行  |
| サムネイル画像を置く | 5分      | `portal/public/thumbnails/[id].png` を 640x360 で用意して git push |

それ以外 (コード・SEO・PWA・portal 更新) は全部 Copilot がやる。
**ゲーム追加は `git push` するだけで CF Pages 自動デプロイされる。Vercel 添加は不要。**

---

## 🟢 Copilot に言えばやってくれること (参考)

| やりたいこと       | 言い方の例                                                       |
| ------------------ | ---------------------------------------------------------------- |
| 新ゲームを作る     | 「逆三目並べゲームを作って。ルールは〇〇」                       |
| モノレポ構造に移行 | 「モノレポに移行して」（`#monorepo-migration` を使う）           |
| ポータルを作る     | 「ポータルサイトを構築して」（`#portal-setup` を使う）           |
| PWA 化             | 「このゲームを PWA にして」（`#pwa` を使う）                     |
| SEO 対応           | 「SEO メタタグを追加して」（`#seo` を使う）                      |
| バグ修正           | 「このエラーを直して」                                           |
| ゲーム企画         | 「斬新なブラウザゲームを5本提案して」（`#game-ideation` を使う） |
| 収益戦略相談       | 「@growth 今どの Phase で何をすべき？」                          |

---

## メモ欄 (自分で埋める)

```
Cloudflare Pages URL     : https://_________________.pages.dev
Cloudflare Account ID    : _________________________________
AdSense Publisher ID     : ca-pub-_________________
GA4 Measurement ID       : G-_________________
Search Console 登録日  : 20__-__-__
AdSense 申請日        : 20__-__-__
AdSense 审査通過日    : 20__-__-__
```
