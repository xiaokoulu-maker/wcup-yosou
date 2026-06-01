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

### 実施順とコミット

| # | 画面 | 状態 | スクショ | コミット |
|---|------|------|---------|---------|
| 1 | PgJoin | ✅ 完了 | ライブデータ必要・撮影不可 | e6afb51 |
| 2 | PgPredict + ShareBox | ✅ 完了 | ライブデータ必要・撮影不可 | ac3148f |
| 3 | PgHome HomeB (ダッシュボード) | ✅ 完了 | ライブデータ必要・撮影不可 | b5bd1eb |
| 4 | PgMatches (試合予想) | ✅ 完了 | ライブデータ必要・撮影不可 | 7954507 |
| 5 | PgRanking | ✅ 完了 | ライブデータ必要・撮影不可 | 5ec2bd5 |
| 6 | PgBadges | ✅ 完了 | ライブデータ必要・撮影不可 | ab24c98 |
| 7 | PgJapanMode (samurai) | ✅ 完了 | ライブデータ必要・撮影不可 | 655bc9d |
| 8 | PgMyPage | ✅ 完了 | ライブデータ必要・撮影不可 | 03a3107 |
| 9 | PgBracket | ✅ 完了 | ライブデータ必要・撮影不可 | 95ce8fa |
| 10 | PgGlobalChat | ✅ 完了 | ライブデータ必要・撮影不可 | 33d04d3 |
| 11 | PgTournament (room) | ✅ 完了 | ライブデータ必要・撮影不可 | 97adcd8 |

---

## 最終サマリー

**完了日**: 2026-06-02（無人自走）  
**ブランチ**: `redesign-wip`（本番未反映 — npm run deploy / git push は一切実行していない）

### 変更ファイル
| ファイル | 内容 |
|---------|------|
| `src/App.jsx` | 11画面のJSX構造をリデザイン（ロジック・calcPts・Supabase・Stripe・trackEvent・nav は変更なし） |
| `src/styles.css` | デザインシステムCSS追加（~19KB）: :root トークン、全共通クラス、画面固有CSS |
| `src/ds-icons.jsx` | 新規: icons.jsx ES module変換 |
| `src/ds-ui.jsx` | 新規: ui.jsx ES module変換（Flag/Stat/Tabs/Banner/PageHead/SectionHead等） |
| `PROGRESS.md` | 本ファイル |
| `redesign-screenshots/home-a.png` | HomeA 起動スクショ（390x844）|

### コミット一覧（redesign-wip）
```
122c46d feat(design-system): Phase 1 — デザインシステム土台
2ee0bfc chore: add PROGRESS.md and redesign-screenshots dir
e6afb51 feat(join): PgJoin redesign
ac3148f feat(predict): PgPredict+ShareBox redesign
b5bd1eb feat(home-b): HomeB redesign
7954507 feat(matches): PgMatches redesign
5ec2bd5 feat(ranking): PgRanking redesign
ab24c98 feat(badges): PgBadges redesign
655bc9d feat(japan): PgJapanMode redesign
03a3107 feat(mypage): PgMyPage redesign
95ce8fa feat(bracket): PgBracket redesign
33d04d3 feat(chat+bracket): PgGlobalChat/PgBracket redesign
97adcd8 feat(tournament): PgTournament redesign
```

### 見本なし・未リデザイン画面（ベストエフォートまたは未変更）
PgCreate, PgUpgrade, PgStats, PgAdmin, PgGroups, PgSchedule, PgCountry, PgBest11, PgBest16, PgWorldMode, PgSurvival, PgSinglePred, PgGlobalStats, PgMoreMenu, PgSoloPredict, PgCoinShop

### スクショ
- `redesign-screenshots/home-a.png` — HomeA (Samurai Blue ランディング) 390x844

### 注意点
- 全 `npm run build` 緑確認済み
- `npm run deploy` / `git push origin` は実行していない
- HomeA (Samurai Blue) は基準画面として変更なし
- ライブ状態を要する画面（大会参加後のHomeB/Matches等）はスクショ撮影不可
