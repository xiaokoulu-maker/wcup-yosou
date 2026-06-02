# 実装仕様書 12 ｜ マイページ（自分の情報を一目で見る画面）

> このファイルは Claude Code に「読んで実装して」と渡すための仕様書です。
> 自分の予想・参加大会・統計を**一画面で見られるマイページ**を追加します。
> ログイン機能は使わず、既存の `myId`（localStorage）ベースで動かします。

---

## 0. この機能の狙い

現状、自分の情報が5箇所にバラバラに散ってる:
- ホームでチラ見え
- ランキングで自分の順位
- バッジ画面でバッジ
- コインショップでコイン
- 試合予想画面で自分の予想

これだと「俺、何の大会に参加してたっけ？」「最近どんな予想入れたっけ？」が**一目で分からない**。

この機能で:
- **1画面**で自分のプロフィール・統計・参加大会・予想履歴を見られる
- 各セクションから詳細ページへワンタップで遷移
- 「自分の情報を見るならココ」のホームベースを作る

---

## 1. 大前提（守ること）

- **既存機能（spec-01〜11、spec-D1〜D9）を一切壊さない**
- ログイン機能は導入しない。既存の `myId`（localStorage）を使う
- 既存の `tourn`, `participant`, `MATCHES` 等のデータ構造から取得
- 侍ブルー基調（spec-D 系のデザイントークン）で実装
- モバイル幅 max 400px

---

## 2. マイページ画面の仕様

### 2-1. レイアウト構造（上から順）

1. **ヘッダー**
   - 左に戻るボタン `←`
   - 中央: 「👤 マイページ」
   - 右: ⚙️ 設定（任意、無くてもOK）

2. **プロフィールヘッダーカード**（白カード）
   - 大きなアバター（左）
   - 右側に:
     - ニックネーム（大）
     - サブテキスト（「参加開始: 2026/05/15」等）
     - 「✏️ プロフィール編集」リンク（ニックネーム変更モーダル起動）

3. **統計サマリー（4枚カードグリッド）**
   - 累計ポイント
   - 的中率（X% / N試合中）
   - 🔥 連続的中（current / best）
   - 🌐 全国順位（spec-11 のデータ、無ければ「-」）

4. **参加中の大会セクション**
   - 「参加中の大会 (N)」見出し
   - 大会ごとにカード:
     - 大会名
     - 自分の順位（X位 / N人中）
     - 累計pt
     - 「開く →」リンク（その大会へ遷移）
   - 複数大会対応（同じ myId で複数の tourn に入ってる場合）

5. **最近の予想セクション**
   - 「最近の予想」見出し
   - 直近10件くらいを縦リスト:
     - 試合（例: 🇯🇵 日本 vs 🇩🇪 ドイツ）
     - 自分の予想（🇯🇵 日本勝ち）
     - 結果（未確定 / +3pt 的中 / 0pt 外れ）
     - 試合日時
   - 件数が多ければ「もっと見る」リンク

6. **その他（ショートカット）**
   - 🪙 コインショップへ
   - 🏅 バッジコレクションへ
   - 🌐 全国ランキングへ
   - これらを白カード3つで横並びor縦並び

### 2-2. データ取得ロジック

```js
// プロフィール
const myParticipant = tourn?.participants?.find(p => p.id === myId);
const nickname = myParticipant?.nickname || "ゲスト";
const icon = myParticipant?.icon;

// 統計
const totalPoints = myParticipant?.totalMatchPoints || 0;
const predictions = Object.values(myParticipant?.matchPredictions || {});
const finishedPredictions = predictions.filter(p => p.points != null);
const hits = finishedPredictions.filter(p => p.points > 0).length;
const hitRate = finishedPredictions.length > 0
  ? Math.round((hits / finishedPredictions.length) * 100)
  : null;
const streak = myParticipant?.streak || { current: 0, best: 0 };

// 全国順位（spec-11 のキャッシュから）
const globalRank = JSON.parse(localStorage.getItem("wcup_globalRank") || "null");

// 参加大会一覧
// myId と一致する participant を持つ tourn を全部取得
const myTourns = await fetchAllTournamentsForUser(myId);
// もしくは localStorage の "wcup_joinedTourns" に大会IDリストを保存している場合はそれを使う

// 最近の予想（直近10件、予想日時の降順）
const recentPredictions = predictions
  .map(p => ({ ...p, match: MATCHES.find(m => m.id === p.matchId) }))
  .filter(p => p.match)
  .sort((a, b) => new Date(b.match.kickoff) - new Date(a.match.kickoff))
  .slice(0, 10);
```

### 2-3. 主要 Tailwind クラスの目安

- 画面背景: `bg-navy-base text-text-on-navy`
- プロフィールヘッダー: `bg-white text-text-on-white rounded-card-lg shadow-data-card p-5 mx-5 mt-4 flex items-center gap-4`
- 統計カードグリッド: `grid grid-cols-2 gap-3 mx-5 mt-4`
- 統計カード: `bg-white text-text-on-white rounded-card shadow-data-card p-4 text-center`
- セクション見出し: `text-title-sm font-extrabold mx-5 mt-6 mb-3`
- 大会カード: `bg-white text-text-on-white rounded-card shadow-data-card p-4 mx-5 mt-3`
- 予想リスト行: `bg-white/5 border border-white/15 rounded-card p-3 mx-5 mt-2 flex items-center justify-between`

### 2-4. プロフィールヘッダーの実装例

```jsx
function ProfileHeader({ nickname, icon, joinedAt, onEdit }) {
  return (
    <div className="bg-white text-text-on-white rounded-card-lg shadow-data-card p-5 mx-5 mt-4">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-navy-base flex items-center justify-center text-2xl">
          {icon || nickname?.[0] || "?"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-title font-extrabold truncate">{nickname}</div>
          {joinedAt && (
            <div className="text-xs text-text-on-white-gray mt-1">
              参加開始: {formatDate(joinedAt)}
            </div>
          )}
          <button onClick={onEdit} className="text-xs text-hinomaru font-bold mt-2">
            ✏️ プロフィール編集
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 2-5. 統計カードの実装例

```jsx
function StatsGrid({ totalPoints, hitRate, hits, total, streak, globalRank }) {
  const stats = [
    {
      label: "累計ポイント",
      value: totalPoints.toLocaleString(),
      unit: "pt",
      color: "text-hinomaru",
    },
    {
      label: "的中率",
      value: hitRate !== null ? `${hitRate}%` : "-",
      sub: hitRate !== null ? `${hits}/${total}` : null,
      color: "text-success",
    },
    {
      label: "🔥 連続的中",
      value: streak.current,
      sub: `自己ベスト ${streak.best}`,
      color: "text-gold",
    },
    {
      label: "🌐 全国順位",
      value: globalRank ? `#${globalRank}` : "-",
      sub: null,
      color: "text-navy-base",
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 mx-5 mt-4">
      {stats.map((s, i) => (
        <div key={i} className="bg-white text-text-on-white rounded-card shadow-data-card p-4 text-center">
          <div className="text-xs text-text-on-white-gray">{s.label}</div>
          <div className={`text-2xl font-black tabular-nums mt-1 ${s.color}`}>
            {s.value}
            {s.unit && <span className="text-sm ml-1 text-text-on-white-gray">{s.unit}</span>}
          </div>
          {s.sub && <div className="text-xs text-text-on-white-gray mt-1">{s.sub}</div>}
        </div>
      ))}
    </div>
  );
}
```

### 2-6. 最近の予想リストの実装例

```jsx
function RecentPredictionsList({ predictions }) {
  if (predictions.length === 0) {
    return (
      <div className="bg-white/5 border border-white/15 rounded-card p-6 mx-5 mt-2 text-center text-text-on-navy-dim">
        まだ予想を入れていません
      </div>
    );
  }
  return (
    <div>
      {predictions.map((p, i) => {
        const m = p.match;
        const myPickLabel = formatPick(p.pick, m); // 例: "🇯🇵 日本勝ち"
        const result =
          p.points == null ? "未確定" :
          p.points > 0 ? `+${p.points}pt 的中` :
          "0pt";
        const resultColor =
          p.points == null ? "text-text-on-navy-dim" :
          p.points > 0 ? "text-success" : "text-text-on-navy-weak";
        return (
          <div key={i} className="bg-white/5 border border-white/15 rounded-card p-3 mx-5 mt-2">
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm text-text-on-navy-dim">
                {m.home} vs {m.away}
              </div>
              <div className={`text-xs font-bold ${resultColor}`}>{result}</div>
            </div>
            <div className="text-base font-bold text-text-on-navy">
              → {myPickLabel}
            </div>
            <div className="text-xs text-text-on-navy-weak mt-1">
              {formatDateJP(m.kickoff)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

---

## 3. ナビゲーションへの組み込み

### 3-1. ホーム画面からマイページへ

`PgHome` の HomeB（参加済み）モードで、ヘッダー右側のアバター部分をタップすると
マイページへ遷移できるようにする:

```jsx
<button onClick={() => nav("mypage")} className="w-8 h-8 rounded-full overflow-hidden">
  <Avatar icon={myParticipant.icon} nickname={myParticipant.nickname} />
</button>
```

### 3-2. ルーティングに追加

既存の `nav` ステートに `"mypage"` を追加。

```jsx
{nav === "mypage" && <PgMyPage tourn={tourn} myId={myId} onBack={() => setNav("home")} ...rest />}
```

---

## 4. 実装ステップ（この順で進める）

- **Step 1**: 既存の `nav` ステート（or ルーティング）に `"mypage"` を追加
- **Step 2**: 新規コンポーネント `PgMyPage` を実装
  - ヘッダー
  - ProfileHeader
  - StatsGrid
  - 参加中の大会セクション
  - 最近の予想セクション
  - ショートカット（コインショップ/バッジ/全国ランキング）
- **Step 3**: ホーム（HomeB）のアバター部分にマイページへの遷移を追加
- **Step 4**: プロフィール編集機能（既存のニックネーム変更モーダルを再利用）
- **Step 5**: ビルドが通ることを確認
- **Step 6**: **`npm run deploy` で本番に公開**
- **Step 7**: 「実装完了 + デプロイ完了」と報告

---

## 5. 細かい注意

- **参加大会の取得**: 既存の `tourn` は現在見てる大会1つ。複数大会対応するなら
  `fetchAllTournamentsForUser(myId)` を実装、Supabase で `participants` テーブルから
  `id = myId` の participants を含む `tournaments` を JOIN で取得
  - **シンプル版**: まずは現在の `tourn` 1つだけ表示でOK（実装工数削減）
  - 複数大会対応は後でも追加できる
- **未参加状態（HomeA）**: マイページは「参加してる人向け」。未参加なら「大会に参加しよう」
  のCTAを出す
- **戻る挙動**: ヘッダーの戻るボタンは `nav("home")` でホームへ
- **デバイス変更時**: localStorage がリセットされると新規ユーザー扱い。これは
  既知の制約として表示しなくてOK（ログイン機能は別 spec で対応する場合に明示）

---

## 6. 完了条件（テスト観点）

- [ ] ホーム（HomeB）のアバターをタップするとマイページへ遷移
- [ ] マイページにプロフィールヘッダー（アバター + ニックネーム）が表示される
- [ ] 統計4枚カード（累計pt / 的中率 / 連続的中 / 全国順位）が表示される
- [ ] 参加中の大会が1つ以上表示される
- [ ] 最近の予想が直近10件まで表示される（予想ゼロのときは空状態UI）
- [ ] 各セクションから関連画面（コインショップ、バッジ等）へ遷移できる
- [ ] プロフィール編集（ニックネーム変更）が動く
- [ ] 戻るボタンでホームに戻れる
- [ ] 侍ブルー基調のデザインで、他画面（D2〜D9）と世界観が揃って見える
- [ ] 既存の spec-01〜11、D1〜D9 機能が壊れていない
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

動作確認できたら「**spec-12 完了**」と報告してください。
これで「自分の情報を一目で見られる」体験ができ、ログイン機能無しでも
回遊性が大幅に上がります。
