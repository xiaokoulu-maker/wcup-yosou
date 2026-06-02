# 実装仕様書 D3 ｜ 試合予想画面の侍ブルー化

> このファイルは Claude Code に「読んで実装して」と渡すための仕様書です。
> 既存の `PgMatches`（試合一覧＋予想入力画面）と、その完了モーダルを、
> `design-reference/` のデザインに沿って侍ブルー基調に置き換えます。

---

## 0. このフェーズの位置づけ

spec-D2 でホームが侍ブルー化された。次は **試合予想画面（PgMatches）**。
ホーム→予想 がコア体験なので、この2画面が新デザインになれば
ユーザーが最も時間を使う部分が世界観で揃う。

D3 の対象:
- `PgMatches`（試合一覧、予想入力、3択ボタン、コイン賭けスライダー、得点者予想）
- 予想完了モーダル（spec-04, spec-06 で機能追加した完了モーダル）

他の画面（ランキング、チャット、優勝予想等）は触らない。

---

## 1. 大前提（守ること）

- **既存機能（spec-01〜11、spec-D1〜D2）を一切壊さない**
- 予想画面以外（PgHome は D2 で済、PgRanking, PgChat 等）は触らない
- 既存の状態管理（`tourn`, `myId`, `matchPredictions`, `coins` 等）を維持
- 既存の保存処理（`savePick`, `placeBet`, `saveT`）はそのまま使う
- 既存の採点ルール表示（spec-02 の `ScoringRulesCard`）は活かす
- spec-10 のコイン賭け、spec-09 の得点者予想は維持
- モバイル幅 max 400px（390×844 基準）

---

## 2. 参照すべきファイル

| ファイル | 用途 |
|---------|------|
| `design-reference/README.md` の `### 4. 試合予想` セクション | 仕様 |
| `design-reference/predict_rank.jsx` の `PredictScreen` 関数 | 参考実装 |
| `design-reference/screens/03-predict.jpg` | ピクセル基準 |

**重要**: `predict_rank.jsx` を全文読まない。`PredictScreen` 関数を Grep で
絞って、必要な構造・スタイル・コピーを抽出して、既存の `PgMatches` に統合する。

---

## 3. 試合予想画面の仕様

### 3-1. レイアウト構造（上から順）

1. **ヘッダー**
   - 左に戻るボタン `←`
   - 中央に画面タイトル `試合を予想`
   - サブタイトル `グループC 第1節` 等（試合の文脈）
   - 右に `+3pt` のピル（採点ルール、`ScoringRulesCard` の簡易版）

2. **採点ルールカード**（spec-02 のもの、コンパクト版）
   - 「採点のしくみ ▼」折りたたみ

3. **試合カード**（リスト or 1つずつ）
   - 白カード `bg-white rounded-card shadow-data-card`
   - 上部: 試合の文脈 `グループC 第1節`、開催地 `📍 シアトル · Lumen Field`、締切 `あと 4h 12m`
   - 中央: 大きく対戦カード表示
     - 左に `🇯🇵 日本 (JPN)` のチップ風表示
     - 中央に `VS`（または時間 `21:00`）
     - 右に `🇩🇪 ドイツ (GER)`
   - 旗の代わりに、絵文字旗または既存の `FlagImg` を使用

4. **勝敗3択ボタン**（試合カードの下）
   - 横並び3つ（または縦並びでも良いが design-reference では横並び）
   - 白背景、選択時は **赤背景** `bg-hinomaru text-white shadow-cta-red`
   - 各ボタンに:
     - チーム名 or `引き分け`
     - 賭けるオッズ表示（コイン機能と連動）例: `2.4倍`
   - タップで `pick` ステートが切り替わる

5. **コイン賭けスライダー**（spec-10 のもの、デザイン強化）
   - スライダー: `<input type="range" min="0" max={残高} step="10" className="accent-hinomaru" />`
   - 上に「賭ける額」現在値の大表示（tabular-nums）
   - 下に「的中で +N🪙」「残高 X🪙」
   - 0 のときは「賭けない」表示（賭けは任意）

6. **得点者予想ミニ**（日本戦のみ、spec-09 のもの）
   - 2×2 グリッドで主要選手
   - 選択時は **金枠** `border-2 border-gold ring-1 ring-gold/50`
   - 各セルに「本命 18%」みたいな投票割合
   - ヘッダーに `全選手・本命を見る ›`（将来のリンク、今は無視可）

7. **主要 CTA**（画面下、固定でも可）
   - `この予想で決定する` 赤背景、`shadow-cta-red`、大きめ
   - タップで `savePick` → 完了モーダル

### 3-2. 主要 Tailwind クラスの目安

- 背景全体: `bg-navy-base text-text-on-navy`
- 試合カード: `bg-white text-text-on-white rounded-card shadow-data-card p-4`
- 3択ボタン（未選択）: `bg-white text-text-on-white rounded-card-lg border border-gray-200`
- 3択ボタン（選択中）: `bg-hinomaru text-white rounded-card-lg shadow-cta-red`
- スライダー: `accent-hinomaru`
- 得点者セル（未選択）: `bg-white/5 border border-white/10 rounded-card p-3`
- 得点者セル（選択）: `bg-white/10 border-2 border-gold rounded-card`
- 主要CTA: `bg-hinomaru hover:bg-hinomaru-hover active:bg-hinomaru-active shadow-cta-red rounded-card-lg w-full py-3 text-white font-bold active:scale-[.98] transition`

### 3-3. 試合カードの構造例

```jsx
function MatchCard({ match, myPrediction, onPickChange, ...rest }) {
  return (
    <div className="bg-white text-text-on-white rounded-card shadow-data-card p-4">
      {/* 文脈 */}
      <div className="flex items-center justify-between text-xs text-text-on-white-gray mb-3">
        <span>{match.context || "グループC 第1節"}</span>
        <span className="text-hinomaru font-bold">あと {timeUntilKickoff}</span>
      </div>
      <div className="text-xs text-text-on-white-gray mb-3">
        📍 {match.venue || "Lumen Field"}
      </div>
      {/* 対戦 */}
      <div className="grid grid-cols-3 items-center gap-2">
        <TeamSide team={match.home} />
        <div className="text-center">
          <div className="text-3xl font-black tabular-nums">VS</div>
          <div className="text-xs mt-1">{formatTime(match.kickoff)}</div>
        </div>
        <TeamSide team={match.away} align="right" />
      </div>
      {/* 3択ボタン */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        <PickBtn pick="home" current={myPrediction?.pick} onClick={onPickChange}>
          {match.home}<br/><span className="text-xs">{getOdds("home")}倍</span>
        </PickBtn>
        <PickBtn pick="draw" current={myPrediction?.pick} onClick={onPickChange}>
          引き分け<br/><span className="text-xs">{getOdds("draw")}倍</span>
        </PickBtn>
        <PickBtn pick="away" current={myPrediction?.pick} onClick={onPickChange}>
          {match.away}<br/><span className="text-xs">{getOdds("away")}倍</span>
        </PickBtn>
      </div>
    </div>
  );
}

function PickBtn({ pick, current, onClick, children }) {
  const isSelected = pick === current;
  return (
    <button
      onClick={() => onClick(pick)}
      className={
        isSelected
          ? "bg-hinomaru text-white rounded-card-lg shadow-cta-red py-3 px-2 font-bold active:scale-[.98] transition"
          : "bg-white text-text-on-white rounded-card-lg border border-gray-200 py-3 px-2 active:scale-[.98] transition"
      }
    >
      {children}
    </button>
  );
}
```

### 3-4. コイン賭けスライダー

```jsx
function CoinBetSlider({ balance, bet, onBetChange, pickOdds }) {
  const payout = Math.floor(bet * pickOdds);
  return (
    <div className="bg-white/5 border border-white/10 rounded-card p-4 mt-3 text-text-on-navy">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-xs text-text-on-navy-dim">コインを賭ける（任意）</span>
        <span className="text-xs text-text-on-navy-dim">残高 {balance.toLocaleString()} 🪙</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-black tabular-nums">{bet}</span>
        <span className="text-sm">🪙</span>
      </div>
      <input
        type="range"
        min="0"
        max={balance}
        step="10"
        value={bet}
        onChange={(e) => onBetChange(Number(e.target.value))}
        className="w-full mt-2 accent-hinomaru"
      />
      <div className="text-xs text-text-on-navy-dim mt-2">
        {bet > 0 ? <>的中で <span className="text-gold font-bold">+{payout} 🪙</span></> : "賭けないで予想する"}
      </div>
    </div>
  );
}
```

### 3-5. 完了モーダル（spec-04, spec-06 の機能を維持しつつデザイン更新）

```jsx
{showDoneModal && (
  <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur flex items-end sm:items-center justify-center">
    <div className="bg-navy-base text-text-on-navy w-full sm:max-w-sm rounded-t-sheet sm:rounded-sheet
                    shadow-hero p-6 animate-wc-sheet">
      <div className="text-center mb-4">
        <div className="text-3xl mb-2">⚽</div>
        <div className="text-title font-extrabold">予想を決定しました！</div>
        <div className="text-sm text-text-on-navy-dim mt-2">
          結果が出たら自動で採点されます
        </div>
      </div>
      <div className="space-y-2">
        <button className="w-full bg-hinomaru rounded-card-lg shadow-cta-red py-3 font-bold">
          📷 予想を画像で投稿
        </button>
        <button className="w-full bg-gold text-navy-base rounded-card-lg py-3 font-bold">
          📣 みんなにこの予想を見せる
        </button>
        <button className="w-full bg-white/10 border border-white/20 rounded-card-lg py-2.5">
          もう1試合予想する
        </button>
        <button className="w-full text-text-on-navy-dim py-2 text-sm">
          閉じる
        </button>
      </div>
    </div>
  </div>
)}
```

---

## 4. 実装ステップ（この順で進める）

- **Step 1**: `design-reference/README.md` の試合予想セクションと
  `design-reference/predict_rank.jsx` の `PredictScreen` 関数を Grep で読む
- **Step 2**: 既存の `PgMatches` を見つけて、JSX を**新デザインに書き換える**
  （関数のシグネチャ・props は維持、中身だけ）
- **Step 3**: 試合カードを新デザイン（白カード + 大きな対戦表示）に
- **Step 4**: 3択ボタンを新デザイン（白/赤の切替）に
- **Step 5**: コイン賭けスライダーを新デザインに置き換え（spec-10 の機能維持）
- **Step 6**: 日本戦の得点者予想ミニを新デザインに（spec-09 の機能維持）
- **Step 7**: 完了モーダルを新デザインに（spec-04, spec-06 のボタン群を維持しつつ）
- **Step 8**: 採点ルールカード（spec-02）を新デザインに合わせる
- **Step 9**: ビルドが通ることを確認
- **Step 10**: 他画面が壊れていないか確認

---

## 5. 細かい注意

- **既存のロジックを必ず使う**: `savePick`, `placeBet`, `toggleScorerPick` などの
  関数名・処理は触らず、UI から呼ぶ形を維持
- **完了モーダルのボタン**: spec-04（画像シェア）、spec-06（みんなに見せる）、
  既存の「もう1試合予想する」「閉じる」は**すべて残す**
- **採点ルール表示**: spec-02 の `ScoringRulesCard` を、新デザインの中に
  自然に組み込む（白カードとして表示、開閉可）
- **コイン賭けが0のとき**: 「賭けないで予想する」と表示してOK
- **得点者予想は日本戦のみ表示**: `match.home === "日本" || match.away === "日本"`
  のときだけセクションを出す
- **`pick` 選択の永続化**: 既存ロジックそのまま。`savePick` で `tourn` 全体を保存
- **オッズ表示**: spec-10 で実装した `calculateOdds` を呼んで動的に表示
- **戻るボタン**: 既存の `nav("home")` や `nav("tournament")` のロジックを維持

---

## 6. 完了条件（テスト観点）

- [ ] PgMatches が新デザインで表示される
  - ヘッダーに `試合を予想` と `+3pt` ピル
  - 試合カードが白カードで、対戦が大きく表示される
  - 3択ボタンが横並び、選択時は赤
  - コイン賭けスライダーが侍ブルー背景で表示
  - 日本戦には得点者予想ミニ（金枠選択）
  - 「この予想で決定する」CTA が赤
- [ ] 予想が保存され、完了モーダルが新デザインで出る
- [ ] 完了モーダルから「📷 画像で投稿」「📣 みんなに見せる」が動く
- [ ] コインを賭けて予想すると、コインが減って、的中で増える
- [ ] 日本戦で得点者を選んで予想を入れられる
- [ ] 採点ルールカードが表示される
- [ ] 戻るボタンでホームに戻れる
- [ ] ホーム（D2 で新デザイン）と試合予想（D3 で新デザイン）でデザインが揃って見える
- [ ] 他画面（ランキング、チャット等）は旧デザインのまま動く
- [ ] 既存の spec-01〜11、D1、D2 機能が壊れていない
- [ ] ビルドが通る

---

## 7. 実装後

動作確認できたら「**spec-D3 完了**」と報告してください。

次は **spec-D4（ランキング画面の侍ブルー化）** に進みます。
表彰台（2-1-3の配置）、3タブ（試合予想 / 大会予想 / コインリッチ）、
全国ランキング（spec-11）を侍ブルー化します。
