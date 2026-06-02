# 実装仕様書 01 ｜ 試合別予想 ＋ 自動採点 ＋ ライブ順位

> このファイルは Claude Code に「読んで実装して」と渡すための仕様書です。
> 既存の `wcup-vite`（React + Vite + Supabase）プロジェクトに機能を追加します。

---

## 0. この機能の狙い

今のアプリは「大会前に一発で予想（優勝国・得点王・日本代表成績）」が中心で、
予想を入れたあと本番までやることがなく、開かなくなりやすい。

この機能で、**大会期間中ずっと開く理由**を作る:

- 参加者が「試合ごと」に勝敗を予想する
- 試合結果が入ると自動で採点される
- 大会内のランキングが試合のたびに動く

これは Superbru（世界260万人の予想プールアプリ）の中核ループ。リテンションの最大レバー。

---

## 1. 大前提（守ること）

- **既存機能を壊さない。** 現在の優勝予想・日本代表成績・ベスト11・大会作成・チャット等はそのまま残す。今回の機能は「追加」。
- 既存の Supabase テーブル `tournaments` の `participants`（JSON配列）と `results`（JSON）を拡張する形で実装する。新しいカラムを増やすより、JSON内にフィールドを足す方が既存を壊しにくい。
- `vite.config.js` の `base: '/wcup-yosou/'` は変更しない。
- 変更は段階的に。**まず Phase A（勝敗3択）を完成・動作確認 → その後 Phase B（スコア予想）** の順で。一度に全部やらない。

---

## 2. データ設計

### 2-1. 試合データ `MATCHES`（新規・フロント定数）

W杯2026 の全試合を定数として持つ。`App.jsx` 内に `MATCHES` 配列を新設する。
組み合わせ未確定の部分は仮で入れ、後から実際の対戦カードに差し替えられる構造にする。

```js
const MATCHES = [
  // グループステージ（12組 × 6試合 = 72試合）
  { id: "gA-1", stage: "group", group: "A", home: "アメリカ", away: "ウルグアイ",
    kickoff: "2026-06-11T19:00:00+09:00", homeScore: null, awayScore: null, status: "scheduled" },
  // ... 全グループ分
  // 決勝トーナメント（既存の BRACKET_DATA を流用・統合してよい）
  { id: "r32-1", stage: "r32", home: "グループA1位", away: "グループB2位",
    kickoff: "2026-07-01T...", homeScore: null, awayScore: null, status: "scheduled" },
  // ...
];
```

- `status`: `"scheduled"`（予想受付中）／`"locked"`（キックオフ後・予想締切）／`"finished"`（結果確定）
- `homeScore` / `awayScore`: 結果確定後に入る。`null` なら未確定
- 既存の `WC_GROUPS`（チーム）と `BRACKET_DATA`（決勝T）があるので、それを元に `MATCHES` を生成してよい

### 2-2. 参加者の試合別予想（既存 participants JSON を拡張）

各参加者オブジェクトに `matchPredictions` を追加する。既存フィールド（`predictions` 等）は触らない。

```js
participant = {
  id, name, icon,
  predictions: { winner, japanResult, japanMvp },   // ← 既存。そのまま
  matchPredictions: {                                // ← 今回追加
    "gA-1": { pick: "home", homeScore: null, awayScore: null, points: null },
    "gA-2": { pick: "draw", ... },
  },
  totalMatchPoints: 0,                               // ← 今回追加（試合予想の累計点）
}
```

- `pick`: `"home"` / `"draw"` / `"away"`（Phase A はこれだけ使う）
- `homeScore` / `awayScore`: Phase B で使うスコア予想（Phase A では null のまま）
- `points`: その試合で獲得した点（採点後に入る）

---

## 3. 採点ルール（初期値・あとで調整可能にする）

Superbru方式を参考にしたシンプルな段階制。定数で持って、後から数字を変えられるようにする。

```js
const SCORING = {
  outcome: 3,   // 勝/ 分 / 負 を当てたら 3点
  exact:   2,   // さらにスコアも完全的中なら +2点（合計5点）
};
```

- **Phase A**: `outcome`（勝敗3択の的中）だけ採点。スコア予想なし。
- **Phase B**: スコア予想を追加し、完全的中で `exact` ボーナスを加算。
- 採点関数 `scoreMatch(prediction, match)` を作り、結果確定済みの試合だけ採点する。

---

## 4. 画面・UI

すべて既存のデザイントーン（青 `#005BAC` / 赤 `#E60033` / モバイル幅 max480）に合わせる。

### 4-1. 試合一覧ページ（新規ページ `matches`）
- 日付順に試合カードを並べる。「今日」「これから」「結果確定」でセクション分け
- 各カードに: 両チーム名＋国旗（既存 `FlagImg` を流用）、キックオフ時刻、自分の予想、結果（確定後）、獲得点
- `status: "scheduled"` のカードはタップで予想入力。`"locked"` 以降は予想変更不可（グレーアウト）

### 4-2. 予想入力（Phase A）
- 各試合で「ホーム勝ち / 引き分け / アウェイ勝ち」の3択ボタン（既存 `Chips` コンポーネントを流用可）
- 締切は `kickoff`。キックオフ時刻を過ぎたら入力ロック

### 4-3. 大会内ランキング（既存 `PgRanking` を拡張 or 新ビュー）
- `totalMatchPoints` の降順で参加者を並べる
- 1〜3位は強調（既存の rankOne/rankTwo/rankThree アニメーションCSSが styles.css にあるので流用）
- 各参加者の「直近の試合で何点取ったか」も出すと盛り上がる

### 4-4. 自分の成績サマリー
- 的中率（当たった試合 / 採点済み試合）、累計ポイント、現在の順位

---

## 5. 自動採点の流れ

1. 大会の管理者（主催者）が、試合結果（スコア or 勝敗）を入力する画面を用意する
   （既存に管理者画面 `PgAdmin` があるので、そこに「試合結果入力」を追加）
2. 結果が入力され `status: "finished"` になったら、その試合の全参加者の予想を `scoreMatch` で採点
3. 各 `matchPredictions[matchId].points` に点を入れ、`totalMatchPoints` を再集計
4. Supabase に保存（既存 `saveT` を使う）→ リアルタイム購読（既存 `subscribeToTournament`）でランキングが全員に即反映

> ※ 試合結果の「自動取得」（ESPN API連携）は優先度7で別途やる。今回は**管理者の手動入力**でよい。
> コードに `fetchBracketFromESPN` の下地があるので、後で差し込めるようにだけしておく。

---

## 6. 実装ステップ（この順で進める）

- **Step 1**: `MATCHES` 定数を用意（グループステージ＋決勝T。組み合わせは仮でOK、差し替え可能に）
- **Step 2**: `participants` JSON に `matchPredictions` / `totalMatchPoints` を足す（既存データが無くても落ちないよう、未定義はデフォルト値で扱う）
- **Step 3**: 試合一覧ページ（予想入力・締切ロック）を作る
- **Step 4**: 管理者の試合結果入力 → `scoreMatch` で自動採点 → 保存
- **Step 5**: ランキングに `totalMatchPoints` を反映、リアルタイム更新を確認
- ここまでが **Phase A**。動作確認できたら報告。
- **Step 6（Phase B）**: スコア予想欄を追加、`exact` ボーナス採点を実装

---

## 7. 既存を壊さないための注意

- 既存の参加者データには `matchPredictions` が無い。読み込み時に `participant.matchPredictions || {}`、`participant.totalMatchPoints || 0` で必ずフォールバックする。
- `dbToApp` / `saveT`（既存のDB変換・保存関数）を拡張する際、既存フィールドのマッピングは絶対に消さない。
- 締切判定（`isDeadlinePassed` が既存にある）と同じ時刻ユーティリティを使い回す。

---

## 8. 完了条件（テスト観点）

- [ ] 2人以上の参加者で、同じ試合に違う予想を入れられる
- [ ] キックオフ時刻を過ぎた試合は予想変更できない
- [ ] 管理者が結果を入れると、全員の予想が自動採点され点が入る
- [ ] ランキングが `totalMatchPoints` 順に並び替わり、別端末にもリアルタイム反映される
- [ ] 既存の優勝予想・日本代表予想・大会作成・チャットが今まで通り動く（デグレなし）

---

## 9. 実装後

動作確認できたら「Phase A 完了」と報告してください。
次は優先順位2位（採点ルールの可視化）→ 3位（トップ導線の整理）と進めます。
