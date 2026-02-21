---
description: "このゲームを PWA 化する。vite-plugin-pwa を使って Service Worker・manifest・オフライン対応を実装する。"
---

# PWA 化タスク

**女案**: PWA はプラットフォーム全体で単一化する方針。
`portal/` 内の `@vite-pwa/astro` の SW が scope `/` で全 `games/*` パスをカバーするため、
**各ゲーム単体に `vite-plugin-pwa` を入れる必要はない**。

portal 側の PWA 実装については `.github/prompts/portal-setup.prompt.md` を参照。

上記の理由でこのプロンプトは PWA の応用範囲をカバーする。
格第な PWA 実装雑務・デバッグに利用すること。

---

## portal の PWA 構成 (組ⁿ込み階)

`portal/astro.config.mjs` で `@vite-pwa/astro` を設定済み。
詳細は `.github/prompts/portal-setup.prompt.md` の Step 7 を参照。

## 個別ゲームでPWA対応を追加する場合 (不要なはず)

2. **Web App Manifest 設定**
   - アプリ名: `n目並べ` (short_name: `n目並べ`)
   - テーマカラー: `#5c6bc0` (既存のメインカラー)
   - 背景色: `#e8eaf6`
   - display: `standalone`
   - アイコンは `public/icons/` に 192x192 と 512x512 を配置 (SVG でも可)

3. **Service Worker 設定**
   - `generateSW` 戦略を使用
   - `dist/` 配下のアセットをすべてキャッシュ
   - オフラインフォールバックを設定

4. **`index.html` への追加**
   - `<meta name="theme-color">` タグ
   - Apple Touch Icon 対応 meta タグ

5. **インストールプロンプト (任意)**
   - PWA インストールボタンを StartScreen に追加検討

## 注意点

- `vite.config.ts` の `base: "./"` 設定を維持する
- TypeScript strict モードが有効なので型エラーを出さない
- `import type` を使うべき場所では必ず使う

## 完了確認

- `npm run build` が通ること
- `npm run preview` で Lighthouse PWA スコアが 90+ になること
