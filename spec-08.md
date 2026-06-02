# 実装仕様書 08 ｜ ゲーミフィケーション（連続的中・バッジ）

> このファイルは Claude Code に「読んで実装して」と渡すための仕様書です。
> 既存の `wcup-vite` プロジェクトに、連続的中ストリーク・バッジ獲得・
> 達成演出を追加して、ユーザーが「続けたくなる」「集めたくなる」動機を作ります。

---

## 0. この機能の狙い

予想ゲームのリテンションを最大化するのに必須の仕掛けが、
**「連続記録」と「バッジ収集」**。Duolingo / Strava / Fitbit などが
共通して採用していて、効果が実証されている王道パターン。

この機能で:

- **連続的中ストリーク**を可視化（「🔥 3連的中中」「自己ベスト 7」）
- **バッジ（実績）の収集**で長期目標を作る（初予想・10試合予想・100pt達成・等）
- バッジ獲得時の**演出**（モーダル＋音）で達成感を強化
- **「あと1試合で次のバッジ」**のような進捗表示で能動的な継続を促す

これでユーザーは「**今日も予想しないと連続が切れる**」「**あと1試合でバッジ取れる**」
と能動的に戻ってくる動機を持つ。

---

## 1. 大前提（守ること）

- **既存機能（spec-01〜07）を一切壊さない**。
- 既存の `participant` オブジェクトに JSON フィールド追加だけで対応
  （DBスキーマの破壊的変更はしない）。
- バッジ判定は **既存の採点処理（`scoreMatch` 後）に乗せる**。
  新しい採点ロジックは作らない、既存のフックポイントを使う。
- モバイル幅 max 480px で破綻しないこと。
- `vite.config.js` の `base: '/wcup-yosou/'` は変更しない。

---

## 2. 連続的中ストリーク

### 2-1. データ構造

`participant` に追加:

```js
participant = {
  // ... 既存フィールド
  streak: {
    current: 0,        // 現在の連続的中数
    best: 0,           // 自己ベスト
    lastUpdatedMatchId: null,  // 最後に判定した試合ID（重複計上防止）
  },
}
```

無い場合のフォールバック: `streak: { current: 0, best: 0 }`

### 2-2. ストリーク更新ロジック

`applyMatchResults` または採点処理の後で実行:

```js
function updateStreak(participant, matchId, isHit) {
  const streak = participant.streak || { current: 0, best: 0 };
  if (streak.lastUpdatedMatchId === matchId) return streak; // 重複防止

  const newCurrent = isHit ? streak.current + 1 : 0;
  const newBest = Math.max(streak.best || 0, newCurrent);
  return { current: newCurrent, best: newBest, lastUpdatedMatchId: matchId };
}
```

採点処理（試合結果反映時）で、各参加者の予想 ＋ 結果から isHit を判定し、
`participant.streak` を更新して保存。

### 2-3. UI 表示

#### ホーム画面（モードB）のライブステータスに追加

既存の3枚カード（今日の試合数 / 次の締切 / 自分の順位）の横に4枚目:

```
┌──────────────┐
│ 🔥 連続的中    │
│   3 連勝中     │
│   自己ベスト 5  │
└──────────────┘
```

- `streak.current >= 1` のときだけ目立たせる（炎アイコン）
- 0 のときも「自己ベスト N」だけ控えめに見せる

#### ランキング画面（spec-01 PgRanking）

各参加者の行に、ストリーク数を小さく表示:
```
1位 陸    24pt  🔥3
2位 大河  18pt  🔥1
3位 あやこ 12pt
```

ストリーク中の人だけ炎が付く視覚的アクセント。

---

## 3. バッジシステム

### 3-1. バッジ定義

`BADGES` 定数で全バッジを宣言（追加・変更しやすく）:

```js
const BADGES = [
  // === 入門 ===
  { id: "first_pred", icon: "🎯", name: "予想デビュー", desc: "初めての予想を入れた" },
  { id: "first_hit", icon: "✨", name: "ファースト的中", desc: "初めて予想を当てた" },

  // === 継続 ===
  { id: "predict_5", icon: "📝", name: "予想5試合", desc: "5試合分の予想を入れた" },
  { id: "predict_20", icon: "📚", name: "予想20試合", desc: "20試合分の予想を入れた" },
  { id: "predict_all_group", icon: "🌍", name: "グループ完全予想", desc: "全グループステージ72試合を予想" },

  // === ストリーク ===
  { id: "streak_3", icon: "🔥", name: "3連的中", desc: "連続で3試合当てた" },
  { id: "streak_5", icon: "🔥🔥", name: "5連的中", desc: "連続で5試合当てた" },
  { id: "streak_10", icon: "🔥🔥🔥", name: "10連的中", desc: "連続で10試合当てた" },

  // === ポイント ===
  { id: "pts_10", icon: "⭐", name: "10pt達成", desc: "累計10ポイント獲得" },
  { id: "pts_50", icon: "🌟", name: "50pt達成", desc: "累計50ポイント獲得" },
  { id: "pts_100", icon: "💫", name: "100pt達成", desc: "累計100ポイント獲得" },

  // === 競争 ===
  { id: "rank_1st", icon: "👑", name: "1位獲得", desc: "ランキング1位になった" },
  { id: "rank_top3", icon: "🥉", name: "TOP3", desc: "ランキング3位以内に入った" },

  // === 日本代表 ===
  { id: "japan_hit", icon: "🇯🇵", name: "日本戦的中", desc: "日本戦の予想を当てた" },

  // === 社交 ===
  { id: "shared_card", icon: "📷", name: "予想シェア", desc: "予想カードをシェアした" },
  { id: "reaction_giver", icon: "👍", name: "反応職人", desc: "10回リアクションを送った" },
];
```

### 3-2. 獲得バッジの保存

`participant` に追加:

```js
participant = {
  // ...
  badges: [
    { id: "first_pred", earnedAt: "2026-06-11T19:30:00Z" },
    { id: "streak_3", earnedAt: "2026-06-15T22:45:00Z" },
  ],
}
```

無い場合のフォールバック: `badges: []`

### 3-3. バッジ判定ロジック

`checkBadges(participant, context)` を実装。`context` に判定に必要な追加情報を渡す:

```js
function checkBadges(participant, context = {}) {
  const earned = new Set((participant.badges || []).map(b => b.id));
  const newly = [];

  const predictionsCount = Object.keys(participant.matchPredictions || {}).length;
  const totalPts = participant.totalMatchPoints || 0;
  const streak = participant.streak || { current: 0, best: 0 };

  function award(id) {
    if (earned.has(id)) return;
    newly.push({ id, earnedAt: new Date().toISOString() });
    earned.add(id);
  }

  if (predictionsCount >= 1) award("first_pred");
  if (predictionsCount >= 5) award("predict_5");
  if (predictionsCount >= 20) award("predict_20");
  if (predictionsCount >= 72) award("predict_all_group");

  if (context.isHit) award("first_hit");
  if (streak.current >= 3) award("streak_3");
  if (streak.current >= 5) award("streak_5");
  if (streak.current >= 10) award("streak_10");

  if (totalPts >= 10) award("pts_10");
  if (totalPts >= 50) award("pts_50");
  if (totalPts >= 100) award("pts_100");

  if (context.rank === 1) award("rank_1st");
  if (context.rank && context.rank <= 3) award("rank_top3");

  if (context.isJapanMatch && context.isHit) award("japan_hit");
  if (context.didShareCard) award("shared_card");
  if (context.reactionsGiven >= 10) award("reaction_giver");

  return newly;
}
```

呼び出すタイミング:
- 採点処理直後（試合結果反映時）
- 予想を入れた直後
- リアクションを送った直後
- 予想カードをシェアした直後

新規取得が出たら、participant.badges に追加保存 + 演出を発火。

### 3-4. バッジ獲得演出

#### 獲得モーダル

新規取得が1件以上あったら、画面中央にモーダル:

```
┌─────────────────────────┐
│        🎉                │
│   バッジ獲得！           │
│                          │
│      🔥                  │
│   3連的中                │
│   連続で3試合当てた       │
│                          │
│      [ OK ]              │
└─────────────────────────┘
```

- ふわっと出てくるアニメーション（既存 `trophyIn` か `fadeUp` を使う）
- 複数同時取得時は順番に表示
- OK で閉じる

#### システムチャット投稿（spec-06 連携）

バッジ獲得を大会内チャットに自動投稿:

```
🏆 [陸] さんが「🔥 3連的中」バッジを獲得！
```

これで他の参加者にも盛り上がりが伝わる（リアクション可能）。

### 3-5. プロフィール（バッジコレクション画面）

新しいページ `PgBadges`、またはホーム「他の機能」から到達できる場所に、
自分のバッジコレクション画面を追加:

```
┌──────────────────────────┐
│ 🏅 マイ・バッジ           │
│   獲得 7 / 16            │
├──────────────────────────┤
│ [🎯 予想デビュー    ✅]  │
│ [✨ ファースト的中  ✅]  │
│ [📝 予想5試合       ✅]  │
│ [📚 予想20試合      ⏳ 12/20] │
│ [🔥 3連的中         ✅]  │
│ [🔥🔥 5連的中       ⏳]  │
│ [🌟 50pt達成        ⏳ 24/50] │
│ ...                       │
└──────────────────────────┘
```

- 獲得済みは色付き＋✅
- 未獲得は薄いグレーアウト＋⏳
- 進捗が分かるものは「現在/目標」を併記（モチベになる）

---

## 4. 実装ステップ（この順で進める）

- **Step 1**: `BADGES` 定数の定義
- **Step 2**: `participant.streak`, `participant.badges` のフォールバック対応
- **Step 3**: `updateStreak()` を実装、採点処理に組み込む
- **Step 4**: `checkBadges()` を実装、各イベント（採点・予想・シェア・リアクション）後に呼ぶ
- **Step 5**: ホーム（モードB）のライブステータスに🔥ストリーク表示を追加
- **Step 6**: ランキングの各行にストリーク表示
- **Step 7**: バッジ獲得モーダルを実装（既存アニメCSSを活用）
- **Step 8**: バッジ獲得時の大会内チャットへの自動システム投稿（spec-06連携）
- **Step 9**: `PgBadges` ページ（マイ・バッジ画面）を新設し、ホームから到達できるリンクを追加
- **Step 10**: ビルドが通ることを確認

---

## 5. 細かい注意

- **二重発火防止**: 同じバッジを2回獲得しないよう、`earned.has(id)` でチェック
- **ストリーク重複防止**: 同じ試合で何度も更新しないよう `lastUpdatedMatchId` でガード
- **モーダルの邪魔さ**: 大量のバッジを同時獲得した時、5つ以上はまとめて表示するなど配慮
- **大会開始前**: 試合結果が無いとバッジが発火しないので、デバッグ用に「最初の予想を入れた」「5試合予想した」のような結果不要バッジから先に獲得できる設計にしてある
- **既存ロジックへの非破壊**: ストリーク・バッジの処理に失敗しても、採点処理は通常通り
  完了するように try/catch でガード

---

## 6. 完了条件（テスト観点）

- [ ] 1試合予想すると「🎯 予想デビュー」バッジを獲得するモーダルが出る
- [ ] 3試合連続で当てると「🔥 3連的中」が獲得される
- [ ] ホームのライブステータスに🔥ストリークが表示される（ストリーク中だけ目立つ）
- [ ] ランキングの各行に連続的中数が表示される
- [ ] バッジ獲得時、大会内チャットに「🏆 ◯◯さんがバッジ獲得！」が自動投稿される
- [ ] `PgBadges` 画面で、獲得済み・未獲得・進捗が一覧できる
- [ ] 同じバッジを2回獲得することはない
- [ ] バッジ判定が失敗してもアプリは壊れず、採点処理は通常完了する
- [ ] 既存の spec-01〜07 機能（予想・採点・シェア・通知・チャット・自動取得）が壊れていない

---

## 7. 実装後

動作確認できたら「優先順位 8 位 完了」と報告してください。
次は優先順位 9 位（日本代表特化の深掘り）に進みます。
