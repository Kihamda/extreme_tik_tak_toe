# Game Template

新しいゲームを追加するときはこのテンプレートをコピーして `games/[id]/` を作成する

## 使い方

1. `games/_template` を `games/your-game-id` にコピー
2. `package.json` の `name` を変更
3. `vite.config.ts` の `base` を `/games/your-game-id/` に変更
4. `portal/src/data/games.json` に新規ゲームを追加
