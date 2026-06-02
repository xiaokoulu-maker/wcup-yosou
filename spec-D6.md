# 実装仕様書 D6 ｜ 日本代表モード画面の侍ブルー化

> このファイルは Claude Code に「読んで実装して」と渡すための仕様書です。
> 既存の `PgJapan`（日本代表モード）を `design-reference/` のデザインに沿って
> 侍ブルー基調に置き換えます。spec-09 で実装した次の日本戦カウントダウン、
> 得点者予想、応援クイック投稿の機能を保持しつつ、見た目を磨き上げます。

---

## 0. このフェーズの位置づけ

ホーム（D2）、予想（D3）、ランキング（D4）、チャット（D5）に続いて、
**このアプリ最大の差別化ポイント**である日本代表モードを侍ブルー化する。

FIFA 公式アプリや Superbru は「日本代表中心の世界観」を作れない。
ここを徹底的に磨き上げることで、日本のW杯ファンが「**これ俺たちのアプリだ**」と
感じる体験を作る。

D6 の対象:
- `PgJapan`（日本代表モード）
- 速報バナー（試合中なら出す）
- 次の日本戦カウントダウン
- 得点者予想ミニ（spec-09）
- 応援クイック投稿（spec-09）
- 過去戦績・グループ順位（既存があれば活かす）

他の画面（コインショップ、シェアカード等）は触らない。

---

## 1. 大前提（守ること）

- **既存機能（spec-01〜11、spec-D1〜D5）を一切壊さない**
- spec-09 の機能維持:
  - 次の日本戦カウントダウン
  - 得点者予想（`JAPAN_SQUAD`、`japanScorer` 保存）
  - 応援クイック投稿バー
  - 日本戦結果の特別演出
- 既存の `PgJapan` の関数シグネチャ・props は維持
- データ取得ロジック（`MATCHES` から日本戦をフィルタ等）は触らない
- モバイル幅 max 400px

---

## 2. 参照すべきファイル

| ファイル | 用途 |
|---------|------|
| `design-reference/README.md` の `### 9. 日本代表モード` セクション | 仕様 |
| `design-reference/japan_share.jsx` の `JapanModeScreen` 関数 | 参考実装 |
| `design-reference/screens/06-japan.jpg` | ピクセル基準 |

**重要**: `japan_share.jsx` を全文読まない。`JapanModeScreen` を Grep で絞る。

---

## 3. 日本代表モード画面の仕様

### 3-1. レイアウト構造（上から順）

1. **ヘッダー**
   - 左に戻るボタン `←`
   - 中央: 「🇯🇵 日本代表モード」（大、白）
   - 右: 共有ボタン（任意）

2. **速報バナー**（試合中のみ、`status === "live"`）
   - 赤背景の細長いバー、LIVE と試合状況を表示
   - 例: `🔴 LIVE 日本 1-0 ドイツ ・ 後半 67分`
   - 試合中じゃない時は表示しない

3. **次の日本戦カードバナー**（メインビジュアル）
   - 大きな金枠カード（`bg-gradient-to-br from-gold/30 to-gold/10 border-2 border-gold`）
   - 上ラベル `次の日本戦まで`
   - 中央: `🇯🇵 日本 vs 🇩🇪 ドイツ` 大きく
   - 大きなカウントダウン（`DD : HH : MM` 形式、tabular-nums、金色）
   - 下に `6/16 (火) 22:00 KO / シアトル · Lumen Field`
   - 全体タップで予想画面に遷移

4. **応援クイック投稿バー**（spec-09、日本戦時間帯のみ）
   - 「🇯🇵 応援メッセージを送ろう！」
   - 2×2 グリッドのクイックボタン（spec-D5 で更新済み）
   - 試合時間外は非表示

5. **得点者予想ミニ**（spec-09、次の日本戦カードの下）
   - 「日本の得点者を予想（+5pt）」
   - 2×2 グリッドで主要選手（大きく見せる）
   - 選択時は金枠、未選択は薄白枠
   - 各セルに「本命 18%」（投票割合、参加者がいれば動的計算、いなければ非表示）
   - 全選手リンク `全選手を見る ›`（将来用）

6. **過去戦績**（任意セクション、データがあれば）
   - 直近5戦の結果を小さくリスト表示
   - 既存実装があれば活かす、無ければ「W杯期間中に表示されます」のプレースホルダー

7. **グループ順位**（既存実装があれば）
   - 日本が所属するグループの順位表
   - シンプルなテーブル

### 3-2. 主要 Tailwind クラスの目安

- 画面背景: `bg-navy-base text-text-on-navy`
- 速報バナー（LIVE）: `bg-hinomaru text-white font-bold flex items-center gap-2 px-4 py-2 mx-5 mt-2 rounded-card animate-pulse`
- 次の日本戦カード: `mx-5 mt-4 bg-gradient-to-br from-gold/30 to-gold/10 border-2 border-gold rounded-card-lg p-5 text-text-on-navy shadow-cta-gold`
- カウントダウン数字: `text-display font-black tabular-nums text-gold`
- 応援クイック投稿: `bg-white/5 border border-white/10 rounded-card p-3 mx-5 mt-4`
- 得点者セル（未選択）: `bg-white/5 border border-white/15 rounded-card p-3 active:scale-[.98] transition`
- 得点者セル（選択）: `bg-gold/10 border-2 border-gold ring-1 ring-gold/40 rounded-card p-3`

### 3-3. 次の日本戦カードバナーの実装例

```jsx
function NextJapanBanner({ match, onClick }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!match) {
    return (
      <div className="mx-5 mt-4 bg-white/5 border border-white/10 rounded-card-lg p-5 text-center text-text-on-navy">
        🇯🇵 日本代表お疲れ様でした
      </div>
    );
  }
  const diff = Math.max(0, new Date(match.kickoff).getTime() - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff / 3600000) % 24);
  const m = Math.floor((diff / 60000) % 60);
  const opponent = match.home === "日本" ? match.away : match.home;
  const venue = match.venue || "";
  const dateLabel = formatDateJP(match.kickoff); // 例: "6/16 (火) 22:00 KO"

  return (
    <button
      onClick={onClick}
      className="w-full mx-5 mt-4 bg-gradient-to-br from-gold/30 to-gold/10 border-2 border-gold rounded-card-lg p-5 text-text-on-navy shadow-cta-gold active:scale-[.99] transition"
      style={{ width: "calc(100% - 2.5rem)" }}
    >
      <div className="text-xs text-gold font-bold tracking-widest">次の日本戦まで</div>
      <div className="mt-3 text-2xl font-black">
        🇯🇵 日本 <span className="text-text-on-navy-dim">vs</span> {opponent}
      </div>
      <div className="mt-4 flex items-baseline gap-3 justify-center font-black tabular-nums text-gold">
        <div><span className="text-5xl">{d}</span><span className="text-sm ml-1">日</span></div>
        <div><span className="text-5xl">{String(h).padStart(2, "0")}</span><span className="text-sm ml-1">時</span></div>
        <div><span className="text-5xl">{String(m).padStart(2, "0")}</span><span className="text-sm ml-1">分</span></div>
      </div>
      <div className="mt-3 text-sm text-text-on-navy-dim text-center">
        {dateLabel} {venue && `· ${venue}`}
      </div>
    </button>
  );
}
```

### 3-4. 得点者予想ミニ（spec-09）

```jsx
function JapanScorerPick({ matchId, currentPick, onPick, totalVotes }) {
  // 上位4選手（FW中心）。spec-09 の JAPAN_SQUAD から
  const topPicks = JAPAN_SQUAD.slice(0, 4); // FW/MFを優先
  return (
    <div className="mx-5 mt-4">
      <div className="flex items-baseline justify-between mb-2">
        <div className="font-bold">日本の得点者を予想 <span className="text-gold text-xs">+5pt</span></div>
        <button className="text-xs text-text-on-navy-dim">全選手を見る ›</button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {topPicks.map(p => {
          const isSelected = currentPick === p.id;
          const votes = totalVotes?.[p.id] || 0;
          const percent = totalVotes?.total > 0
            ? Math.round((votes / totalVotes.total) * 100)
            : null;
          return (
            <button
              key={p.id}
              onClick={() => onPick(p.id)}
              className={
                isSelected
                  ? "bg-gold/10 border-2 border-gold ring-1 ring-gold/40 rounded-card p-3 text-left active:scale-[.98] transition"
                  : "bg-white/5 border border-white/15 rounded-card p-3 text-left active:scale-[.98] transition"
              }
            >
              <div className="flex items-baseline justify-between">
                <div className="text-xs text-text-on-navy-dim">#{p.number} {p.position}</div>
                {percent !== null && (
                  <div className="text-xs text-text-on-navy-weak">本命 {percent}%</div>
                )}
              </div>
              <div className="mt-1 font-bold text-text-on-navy">{p.name}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

### 3-5. 速報バナー（試合中のみ）

```jsx
function LiveBanner({ liveMatch }) {
  if (!liveMatch) return null;
  return (
    <div className="mx-5 mt-2 bg-hinomaru text-white rounded-card flex items-center gap-2 px-4 py-2 shadow-cta-red">
      <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
      <span className="font-bold text-sm">LIVE</span>
      <span className="text-sm">
        🇯🇵 日本 {liveMatch.homeScore}-{liveMatch.awayScore} {liveMatch.opponent}
      </span>
      <span className="ml-auto text-xs">{liveMatch.statusText}</span>
    </div>
  );
}
```

`liveMatch` は MATCHES の中で `status === "live"` の日本戦。無ければ null で何も表示しない。

---

## 4. 実装ステップ（この順で進める）

- **Step 1**: `design-reference/README.md` の ### 9. 日本代表モード セクションと
  `design-reference/japan_share.jsx` の `JapanModeScreen` を Grep で絞って読む
- **Step 2**: 既存の `PgJapan` を見つけて JSX を新デザインに書き換える
  （関数のシグネチャ・props は維持）
- **Step 3**: ヘッダーを侍ブルー化
- **Step 4**: 速報バナー（LiveBanner）を実装（試合中のみ表示）
- **Step 5**: 次の日本戦カードバナー（NextJapanBanner）を実装
- **Step 6**: 応援クイック投稿バー（spec-09 のロジック維持、見た目だけ更新）
- **Step 7**: 得点者予想ミニ（spec-09 のロジック維持、見た目を金枠カードに）
- **Step 8**: 過去戦績・グループ順位（既存があれば活かす、無ければそのまま）
- **Step 9**: ビルドが通ることを確認
- **Step 10**: **`npm run deploy` で本番に公開**
- **Step 11**: 「実装完了 + デプロイ完了」と報告

---

## 5. 細かい注意

- **次の日本戦の取得**: `MATCHES.filter(m => (m.home === "日本" || m.away === "日本") && new Date(m.kickoff) > now).sort(...)`[0]
  既存のロジックがあればそれを使う
- **試合がもう無い場合**: `match` が null のときは「🇯🇵 日本代表お疲れ様でした」を表示
- **得点者投票の集計**: `tourn.participants` から `japanScorer` 別に集計。
  参加者が少ない時は割合非表示
- **応援クイック投稿の表示判定**: spec-09 の既存ロジック（キックオフ1h前〜終了2h後）を維持
- **タップ遷移**: 次の日本戦カードをタップしたら、その日本戦の予想画面（PgMatches with matchId）へ遷移
- **絵文字旗**: 🇯🇵 🇩🇪 等はそのまま使用

---

## 6. 完了条件（テスト観点）

- [ ] PgJapan が新デザインで表示される
  - 「🇯🇵 日本代表モード」のヘッダー
  - 試合中なら速報バナーが赤で点滅
- [ ] 次の日本戦カードが金枠バナーで大きく表示される
  - `日本 vs 対戦相手`
  - 大きなカウントダウン（DD日 HH時 MM分、金色）
  - 開催日時と会場
- [ ] タップで予想画面に遷移する
- [ ] 得点者予想ミニが2×2 の金枠カードで表示
  - 選択時は金リングで強調
  - 投票割合（あれば）が見える
- [ ] 応援クイック投稿バーは日本戦時間帯にのみ表示
- [ ] 日本戦が全て終わっていれば「お疲れ様でした」表示
- [ ] ホーム（D2）→ 日本代表モード（D6）の遷移で、世界観が揃って見える
- [ ] 既存の spec-01〜11、D1〜D5 機能が壊れていない
- [ ] **ビルドが通り、本番に自動デプロイされている**

---

## 7. 自動デプロイの指示

Claude Code への指示として、**実装完了後に以下を自動実行する**:

1. `npm run build` でビルド確認
2. ビルドが通ったら `npm run deploy` で本番公開
3. 「実装完了 + デプロイ完了」と報告

ビルドが失敗した場合は、そこで止まって原因を報告すること（デプロイには進まない）。

---

## 8. 実装後

動作確認できたら「**spec-D6 完了**」と報告してください。

次は **spec-D7（コインショップ・バッジ画面の侍ブルー化）** に進みます。
コイン残高ヘッダー、毎日ログインボーナス、ミッション、バッジコレクションを
侍ブルーで仕上げます。
