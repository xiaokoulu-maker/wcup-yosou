# Redesign Progress — redesign-wip branch

> **本番未反映**: `npm run deploy` / `git push` は一切実行していない。全変更は `redesign-wip` ブランチのみ。

## Phase 1: デザインシステム土台 ✅ 完了 (commit: 122c46d)
- `src/styles.css` — :root トークン + 全共通クラス追記（body ルール除外）
- `src/ds-icons.jsx` — icons.jsx を ES module 変換
- `src/ds-ui.jsx` — ui.jsx を ES module 変換

---

## Phase 2: 画面リデザイン インベントリ

| page key | 関数名 | 開始行 | 見本あり | 状態 |
|----------|--------|--------|---------|------|
| home (HomeA/Samurai) | PgHome | 2167 | ✅ samurai.html/jsx（HomeA は基準・原則変えない） | スキップ(基準画面) |
| home (HomeB/ダッシュボード) | PgHome 内 | 2278 | ✅ home.html/jsx | 未着手 |
| tournament | PgTournament | 3109 | ✅ room.html/jsx | 未着手 |
| join | PgJoin | 3210 | ✅ join.html/jsx | 未着手 |
| predict | PgPredict | 3509 | ✅ my-prediction.html/jsx | 未着手 |
| predictions | PgPredictions | 3559 | ❌ なし | 未着手(見本なし) |
| ranking | PgRanking | 3622 | ✅ ranking.html/jsx | 未着手 |
| stats | PgStats | 3952 | ❌ なし | 未着手(見本なし) |
| admin | PgAdmin | 4002 | ❌ なし | スキップ(管理者) |
| upgrade | PgUpgrade | 4315 | ❌ なし | 未着手(見本なし) |
| groups | PgGroups | 4447 | ❌ なし | 未着手(見本なし) |
| schedule | PgSchedule | 4468 | ❌ なし | 未着手(見本なし) |
| country | PgCountry | 4486 | ❌ なし | 未着手(見本なし) |
| best11 | PgBest11 | 4822 | ❌ なし | 未着手(見本なし) |
| best16 | PgBest16 | 5042 | ❌ なし | 未着手(見本なし) |
| bracket | PgBracket | 5168 | ✅ bracket.html/jsx | 未着手 |
| japan | PgJapanMode | 5558 | ✅ samurai.html/jsx | 未着手 |
| globalchat | PgGlobalChat | 6059 | ✅ global-chat.html/jsx | 未着手 |
| globalstats | PgGlobalStats | 6099 | ❌ なし | 未着手(見本なし) |
| moremenu | PgMoreMenu | 6155 | ❌ なし | 未着手(見本なし) |
| solopredict | PgSoloPredict | 6182 | ❌ なし | 未着手(見本なし) |
| matches | PgMatches | 6309 | ✅ predict.html/jsx | 未着手 |
| coinshop | PgCoinShop | 6705 | ❌ なし | 未着手(見本なし) |
| badges | PgBadges | 6834 | ✅ badges.html/jsx | 未着手 |
| mypage | PgMyPage | 6988 | ✅ mypage.html/jsx | 未着手 |
| create | PgCreate | 2994 | ❌ なし | 未着手(見本なし) |
| world | PgWorldMode | 5495 | ❌ なし | 未着手(見本なし) |
| survival | PgSurvival | 5890 | ❌ なし | 未着手(見本なし) |
| singlepred | PgSinglePred | 5997 | ❌ なし | 未着手(見本なし) |

---

## Phase 2: 画面ごとの進捗

### 優先順 (見本あり): join → predict(my-prediction) → home(HomeB) → matches(predict) → ranking → badges → japan(samurai) → mypage → bracket → globalchat → tournament(room)

| # | 画面 | 状態 | スクショ | コミット |
|---|------|------|---------|---------|
| 1 | PgJoin | 未着手 | — | — |
| 2 | PgPredict (優勝予想) | 未着手 | — | — |
| 3 | PgHome HomeB | 未着手 | — | — |
| 4 | PgMatches (試合予想) | 未着手 | — | — |
| 5 | PgRanking | 未着手 | — | — |
| 6 | PgBadges | 未着手 | — | — |
| 7 | PgJapanMode | 未着手 | — | — |
| 8 | PgMyPage | 未着手 | — | — |
| 9 | PgBracket | 未着手 | — | — |
| 10 | PgGlobalChat | 未着手 | — | — |
| 11 | PgTournament (room) | 未着手 | — | — |
