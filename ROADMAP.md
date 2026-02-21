# 収益ロードマップ — 年収200万円達成プラン

**目標**: 年収200万円 = **月17万円** の継続収益  
**予算**: ¥0  
**ビジョン**: 多様なゲームが次々リリースされる**ブラウザゲームプラットフォーム**を作る

---

## 戦略概要

**すべてのゲームとポータルは、このリポジトリ1つで管理する。**

```
extreme_tik_tok_toe/  (← このリポジトリのみ使用)
  games/
    ntiktaktoe/       ← Game #1 (現在の src/ を移動)
      src/
      vite.config.ts
      index.html
      ...
    game-02/          ← Game #2 (新規追加)
    game-03/          ← Game #3
    game-N/
  portal/             ← ゲーム一覧サイト (Astro)
    src/
      data/games.json ← ゲームメタデータ一元管理
  .github/
    workflows/        ← SNS 自動投稿・デプロイ
    prompts/
    agents/
```

- 各ゲームは Vercel の**個別プロジェクト**として独立してデプロイ (1リポジトリ複数プロジェクト対応)
- `portal/` もVercel に別プロジェクトとしてデプロイ
- **プラットフォームが育つほど新作の初速が上がる** (既存ユーザーへの告知 + SEO 内部リンク効果)

---

## 収益試算

### AdSense 必要 PV 試算

| ゲーム本数 | ゲームあたり月間PV | 合計PV      | AdSense RPM ¥400 | 月収         |
| ---------- | ------------------ | ----------- | ---------------- | ------------ |
| 10本       | 5,000              | 50,000      |                  | ¥20,000      |
| 20本       | 5,000              | 100,000     |                  | ¥40,000      |
| 30本       | 7,000              | 210,000     |                  | ¥84,000      |
| **50本**   | **8,000**          | **400,000** |                  | **¥160,000** |
| 60本       | 8,000              | 480,000     |                  | ¥192,000 ✅  |

**結論**: ゲーム60本 × 月8,000PV = 月収19万円。2年で達成可能。

---

## Phase 0 ── 今週「Game #1 を公開 + プラットフォームを設計する」

目標: n目並べを公開し、プラットフォームの土台を作る

**Game #1 (このリポジトリ) の公開**

- [ ] バグ洗い出し & 修正 (`npm run lint` 全通過)
- [ ] PWA 化 (`vite-plugin-pwa`)
- [ ] SEO meta タグ + OGP 設定
- [ ] Vercel にデプロイ (`game-01.yourdomain.vercel.app`)
- [ ] Google Search Console 登録
- [ ] AdSense 審査申請 (審査に数週間かかるので**今すぐ申請**)

**モノレポへのリストラクチャ**

- [ ] `src/` → `games/ntiktaktoe/src/` に移動、ルートの `vite.config.ts` も移動
- [ ] `games/ntiktaktoe/` を Vercel プロジェクトとして設定 (Root Directory: `games/ntiktaktoe`)
- [ ] `portal/` ディレクトリを作成 (Astro)
- [ ] `portal/src/data/games.json` でゲームメタデータを一元管理
- [ ] Game #2 の企画を決定

**Copilot 活用**: `/pwa`・`/seo` プロンプトを使う、`/platform-setup` でポータル構築

---

## Phase 1 ── 1〜3ヶ月「プラットフォームを公開する」

目標: `portal/` 公開・ゲーム5本・SNS 自動化稼働

- [ ] `portal/` を Vercel にデプロイ (Root Directory: `portal`)
  - トップ: ゲーム一覧 + 新着カード
  - 各ゲームページ: 説明・プレイボタン・AdSense
  - `portal/src/data/games.json` を更新するだけで新作が追加される仕組み
- [ ] `games/` 配下に月1〜2本のペースで新ゲームを追加 → `games.json` に登録 → Vercel に新プロジェクト追加
- [ ] SNS 自動化を GitHub Actions で構築 (新作公開 → 自動ポスト)
- [ ] Google Analytics 4 をプラットフォームと各ゲームに設置
- [ ] 内部リンク: 各ゲームページから他のゲームへ誘導

**Copilot 活用**: `/platform-setup` でポータル構築、`/game-ideation` で企画生成、`/sns-automation` で投稿自動化

---

## Phase 2 ── 3〜6ヶ月「量産体制の確立」

目標: ゲーム15本・月5万PV・AdSense 収益開始

- [ ] `games/` 配下にゲームを追加するテンプレート (`games/_template/`) を確立
- [ ] 企画〜公開のリードタイムを1週間以内に短縮
- [ ] SEO: 各ゲームページに攻略 Tips・ルール説明記事を付ける
- [ ] 多言語対応 (EN 追加でグローバル流入)
- [ ] 内部リンク戦略 (ゲーム間で相互誘導)

---

## Phase 3 ── 6〜12ヶ月「スケールと質の向上」

目標: ゲーム30本・月20万PV・月収5万円

- [ ] バイラル性のある「一発ネタ」ゲームで爆発的流入を狙う
- [ ] ゲームランキング・コメント機能 (Supabase 無料枠)
- [ ] Reddit / Hacker News Show HN への投稿自動化

---

## Phase 4 ── 12〜24ヶ月「年収200万達成」

目標: ゲーム60本・月40万PV・月収17万円

- [ ] AI によるゲーム企画・コード生成の全自動化パイプライン構築
- [ ] 人気ゲームの続編・バリエーション展開
- [ ] YouTube / TikTok での自動動画投稿

---

## ゲーム企画の方向性

受けやすいジャンルと切り口:

| ジャンル         | 例                                            |
| ---------------- | --------------------------------------------- |
| 変則ルール系     | このゲーム (n目並べ)、逆三目並べ、重力ありTTT |
| 即席パーティ系   | ブラウザで2人対戦できるカジュアルゲーム       |
| バイラル一発ネタ | 「○○しか勝たん」判定ゲーム、比較ゲーム        |
| 懐かし + 現代風  | クラシックゲームの現代的リメイク              |
| AI 対戦型        | 絶対に勝てないAI、敢えて弱いAI                |

**Copilot 活用**: `/game-ideation` で「斬新なゲーム企画を5本出して」と依頼

---

## Copilot エージェント体制 (オーケストレーション)

**人間は `@consultant` (相談役) とだけ会話する。** 相談役が判断してサブエージェントに委譲する。

```
あなた (人間)
  └── @consultant (相談役/オーケストレーター)
        ├── @game-factory       ゲーム量産 (企画→実装→portal登録)
        ├── @gamedev            既存コードの実装・修正・リファクタ
        ├── @platform-architect モノレポ・インフラ・デプロイ
        ├── @growth             収益戦略・KPI分析・ロードマップ管理
        ├── @seo-specialist     SEO最適化・メタタグ・構造化データ
        ├── @sns-manager        SNS運用・自動投稿・バイラル戦略
        ├── @copywriter         ゲーム説明文・LP・マーケティングコピー
        └── @qa-tester          ビルド検証・品質チェック・パフォーマンス
```

### 作業フロー例

| やりたいこと   | 人間の発言              | 相談役の委譲先                            |
| -------------- | ----------------------- | ----------------------------------------- |
| 新ゲーム作成   | 「○○ゲーム作って」      | game-factory → qa-tester → seo-specialist |
| バグ修正       | 「○○が動かない」        | gamedev → qa-tester                       |
| デプロイ設定   | 「CF Pages に載せたい」 | platform-architect                        |
| 収益分析       | 「今の進捗どう?」       | growth                                    |
| SEO 改善       | 「検索に出てこない」    | seo-specialist                            |
| SNS 投稿       | 「Twitter で告知して」  | sns-manager + copywriter                  |
| 次何やるべきか | 「次なにする?」         | growth → consultant が判断                |

### 日報 (DAILY_LOG.md)

相談役が作業の開始・完了を `DAILY_LOG.md` に自動記録する。
「今なにやってたっけ?」と聞けば即答できる。

### プロンプト一覧 (直接使う場合)

| やること           | 使うファイル                               |
| ------------------ | ------------------------------------------ |
| ゲーム企画生成     | `.github/prompts/game-ideation.prompt.md`  |
| ポータルサイト構築 | `.github/prompts/platform-setup.prompt.md` |
| 機能追加           | `.github/prompts/add-feature.prompt.md`    |
| PWA 実装           | `.github/prompts/pwa.prompt.md`            |
| SEO 対応           | `.github/prompts/seo.prompt.md`            |
| SNS 自動化構築     | `.github/prompts/sns-automation.prompt.md` |

---

## KPI トラッカー

| 指標         | Ph.0 | Ph.1   | Ph.2    | Ph.3    | Ph.4      |
| ------------ | ---- | ------ | ------- | ------- | --------- |
| ゲーム本数   | 1    | 5      | 15      | 30      | 60        |
| 月間PV       | -    | 10,000 | 50,000  | 200,000 | 400,000   |
| AdSense 月収 | ¥0   | ¥4,000 | ¥20,000 | ¥80,000 | ¥160,000+ |
