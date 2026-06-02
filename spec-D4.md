# 実装仕様書 D4 ｜ ランキング画面の侍ブルー化

> このファイルは Claude Code に「読んで実装して」と渡すための仕様書です。
> 既存の `PgRanking`（試合予想 / 大会予想 / コインリッチ / 全国 の4タブ）を、
> `design-reference/` のデザインに沿って侍ブルー基調に置き換えます。

---

## 0. このフェーズの位置づけ

ホーム（D2）と試合予想（D3）が侍ブルー化された。次はランキング。

D4 の目玉は **表彰台レイアウト**: Olympic風に1位を中央＆大きく、
2位左・3位右に金銀銅のリングで配置する見せ方。これが入ると
ランキングが「見るだけで盛り上がる」UI に変わる。

D4 の対象:
- `PgRanking` の全タブ:
  - ⚽ 試合予想
  - 🏆 大会予想
  - 🪙 コインリッチ
  - 🌐 全国（spec-11）

他の画面（チャット、日本代表、コインショップ等）は触らない。

---

## 1. 大前提（守ること）

- **既存機能（spec-01〜11、spec-D1〜D3）を一切壊さない**
- 既存のランキング計算ロジック（`totalMatchPoints`, `tournPoints`,
  `coins.balance`, 全国ランキング取得）は維持
- 各タブの並び替え順は維持
- 自分のエントリの強調表示（既存の YOU バッジ的なもの）は維持・強化
- シェアカード（spec-04 `ShareCardStats`, spec-11 `ShareCardGlobalRank`）の
  起動ボタンも維持
- モバイル幅 max 400px

---

## 2. 参照すべきファイル

| ファイル | 用途 |
|---------|------|
| `design-reference/README.md` の `### 5. ランキング` セクション | 仕様 |
| `design-reference/predict_rank.jsx` の `RankingScreen` 関数 | 参考実装 |
| `design-reference/screens/04-ranking.jpg` | ピクセル基準 |
| `design-reference/shared.jsx` の `Avatar`, `Tabs` | ヘルパー |

**重要**: `predict_rank.jsx` を全文読まない。`RankingScreen` 関数を
Grep で絞って、必要な構造を抽出する。

---

## 3. ランキング画面の仕様

### 3-1. レイアウト構造（上から順）

1. **ヘッダー**
   - 左に戻るボタン `←`
   - 中央に画面タイトル `ランキング`
   - 必要に応じてサブタイトル（大会名など）

2. **タブバー**（4タブ、横スクロール可能）
   - ⚽ 試合予想（既定タブ）
   - 🏆 大会予想
   - 🪙 コインリッチ
   - 🌐 全国
   - 選択中: **白ピル背景 + 濃ネイビー文字** `bg-white text-navy-base`
   - 未選択: 透明背景 + 薄白文字 `bg-transparent text-text-on-navy-dim`

3. **タブごとの内容**:

   **「⚽ 試合予想」「🏆 大会予想」「🪙 コインリッチ」共通**:
   - **表彰台セクション**（上部、後述）
   - **リスト**（4位以下、または1位含む全員リスト）
     - 自分の行はハイライト

   **「🌐 全国」タブ**:
   - **自分の全国順位カード**（上部、白カード）
     - 大きく `#312 位 / 4,521 人中`
     - 累計ポイント
   - **TOP100 リスト**
   - **「あなたの周辺」**（圏外時のみ、自分前後5人ずつ）

4. **シェアボタン**（画面下、固定 or 末尾）
   - 「📷 順位をシェア」

### 3-2. 表彰台レイアウトの実装

各タブ共通の表彰台:

```jsx
function Podium({ topThree }) {
  // topThree = [1位, 2位, 3位] の participant 配列
  const [first, second, third] = topThree;
  return (
    <div className="px-5 mt-4 mb-6">
      <div className="grid grid-cols-3 items-end gap-2">
        {/* 2位（左、小さめ） */}
        <PodiumSlot rank={2} participant={second} ringColor="silver" height="h-24" />
        {/* 1位（中央、大きく） */}
        <PodiumSlot rank={1} participant={first} ringColor="gold" height="h-32" big />
        {/* 3位（右、小さめ） */}
        <PodiumSlot rank={3} participant={third} ringColor="bronze" height="h-20" />
      </div>
    </div>
  );
}

function PodiumSlot({ rank, participant, ringColor, height, big }) {
  if (!participant) return <div className={height} />;

  const ringClass = {
    gold: "ring-4 ring-gold shadow-cta-gold",
    silver: "ring-4 ring-gray-300",
    bronze: "ring-4 ring-amber-700",
  }[ringColor];

  const crownEmoji = rank === 1 ? "👑" : rank === 2 ? "🥈" : "🥉";

  return (
    <div className="flex flex-col items-center">
      {rank === 1 && <div className="text-2xl mb-1">{crownEmoji}</div>}
      <div className={`relative ${big ? "w-20 h-20" : "w-16 h-16"} rounded-full overflow-hidden ${ringClass}`}>
        <Avatar icon={participant.icon} nickname={participant.nickname} />
      </div>
      <div className={`mt-2 ${big ? "text-lg font-black" : "text-sm font-bold"} text-text-on-navy text-center`}>
        {rank !== 1 && <span className="mr-1">{crownEmoji}</span>}
        {participant.nickname}
      </div>
      <div className={`text-xs text-text-on-navy-dim tabular-nums`}>
        {participant.points.toLocaleString()} pt
      </div>
      {/* 台座 */}
      <div className={`mt-2 w-full ${height} rounded-t-card bg-gradient-to-b from-white/10 to-white/5
                       border-t border-white/20 flex items-start justify-center pt-2`}>
        <div className={`${big ? "text-3xl" : "text-xl"} font-black text-gold tabular-nums`}>
          {rank}
        </div>
      </div>
    </div>
  );
}
```

### 3-3. リスト行のデザイン

4位以下のリスト:

```jsx
function RankRow({ rank, participant, isMine }) {
  return (
    <div
      className={
        isMine
          ? "bg-white text-text-on-white rounded-card shadow-data-card px-4 py-3 flex items-center gap-3 border-l-4 border-hinomaru"
          : "bg-white/5 border border-white/10 rounded-card px-4 py-3 flex items-center gap-3 text-text-on-navy"
      }
    >
      <div className={`w-8 text-center font-black tabular-nums ${isMine ? "text-hinomaru" : "text-text-on-navy-dim"}`}>
        {rank}
      </div>
      <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10">
        <Avatar icon={participant.icon} nickname={participant.nickname} />
      </div>
      <div className="flex-1">
        <div className={`font-bold ${isMine ? "text-text-on-white" : "text-text-on-navy"}`}>
          {participant.nickname}
        </div>
        {isMine && <span className="text-xs bg-hinomaru text-white rounded-full px-2 py-0.5 ml-1">YOU</span>}
        {participant.streak?.current >= 3 && (
          <span className="text-xs text-gold ml-2">🔥 {participant.streak.current}</span>
        )}
      </div>
      <div className={`font-black tabular-nums ${isMine ? "text-text-on-white" : "text-text-on-navy"}`}>
        {participant.points.toLocaleString()} pt
      </div>
    </div>
  );
}
```

### 3-4. タブの実装

```jsx
function RankTabs({ activeTab, onTabChange }) {
  const tabs = [
    { id: "match", label: "⚽ 試合予想" },
    { id: "tournament", label: "🏆 大会予想" },
    { id: "coin", label: "🪙 コインリッチ" },
    { id: "global", label: "🌐 全国" },
  ];
  return (
    <div className="px-5 mt-3 flex gap-2 overflow-x-auto no-scrollbar">
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onTabChange(t.id)}
          className={
            activeTab === t.id
              ? "bg-white text-navy-base font-bold rounded-full px-4 py-2 whitespace-nowrap"
              : "bg-transparent text-text-on-navy-dim border border-white/15 rounded-full px-4 py-2 whitespace-nowrap"
          }
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
```

### 3-5. 全国タブの自分の順位カード

```jsx
function GlobalSelfCard({ myGlobalRank, totalUsers, myPoints }) {
  if (!myGlobalRank) {
    return (
      <div className="bg-white text-text-on-white rounded-card shadow-data-card mx-5 mt-4 p-5 text-center">
        <div className="text-text-on-white-gray text-sm">あなたはまだランクインしていません</div>
        <div className="mt-1 font-bold">予想を入れて全国ランキングに登場！</div>
      </div>
    );
  }
  return (
    <div className="bg-white text-text-on-white rounded-card shadow-data-card mx-5 mt-4 p-5 text-center">
      <div className="text-xs text-text-on-white-gray tracking-widest font-bold">YOUR GLOBAL RANK</div>
      <div className="flex items-baseline justify-center gap-1 mt-2">
        <span className="text-5xl font-black tabular-nums text-hinomaru">#{myGlobalRank}</span>
        <span className="text-text-on-white-gray text-sm">位</span>
      </div>
      <div className="text-text-on-white-gray text-sm mt-1">
        / {totalUsers.toLocaleString()} 人中
      </div>
      <div className="border-t border-gray-200 mt-3 pt-3 text-text-on-white-gray">
        累計 <span className="text-text-on-white font-black text-xl">{myPoints}</span> pt
      </div>
    </div>
  );
}
```

---

## 4. 実装ステップ（この順で進める）

- **Step 1**: `design-reference/README.md` の ### 5. ランキング セクションと
  `design-reference/predict_rank.jsx` の `RankingScreen` を Grep で読む
- **Step 2**: 既存の `PgRanking` の JSX を新デザインに書き換える
  （関数のシグネチャ・props は維持）
- **Step 3**: タブバー（4タブ、白ピル切替）を実装
- **Step 4**: 表彰台（Podium / PodiumSlot）を実装
- **Step 5**: リスト行（RankRow、自分強調）を実装
- **Step 6**: 「⚽ 試合予想」「🏆 大会予想」「🪙 コインリッチ」の各タブで
  既存のデータ取得を使い、表彰台 + リスト で表示
- **Step 7**: 「🌐 全国」タブで GlobalSelfCard + TOP100 リスト + 周辺リストを実装
  （既存の spec-11 の取得ロジックを使う）
- **Step 8**: シェアボタン（既存の `ShareCardStats`, `ShareCardGlobalRank` を起動）
- **Step 9**: ビルドが通ることを確認
- **Step 10**: 他画面が壊れていないか確認

---

## 5. 細かい注意

- **Avatar の実装**: 既存に Avatar コンポーネントがあるならそれを使う。
  無ければシンプルに `<div>{icon}</div>` でもOK（emoji を表示するだけ）
- **表彰台が3人揃わない場合**: 参加者が1-2人のとき、空のスロットは
  `<div className={height} />` で空にする（破綻させない）
- **streak 表示**: spec-08 の `🔥 N` をリスト行に小さく表示
- **YOU バッジ**: 自分の行に視覚的に分かりやすく表示
- **タブの永続化**: タブ選択を URL or 一時 state で保持（既存の挙動を維持）
- **全国タブのロード**: 既存の spec-11 のロジック（5分キャッシュ、30秒更新制限）を維持
- **シェアカードの呼び出し**: 既存のボタン処理を新デザインボタンに移植

---

## 6. 完了条件（テスト観点）

- [ ] PgRanking が新デザインで表示される
  - ヘッダー、4タブの白ピル切替
- [ ] 表彰台が2-1-3の配置で、1位が中央＆大きく
  - 金/銀/銅のリング、👑/🥈/🥉 の絵文字
- [ ] 4位以下リストで、自分の行が白カードに左赤線＋ YOU バッジ
- [ ] 連続的中の人は🔥+数字が小さく出る
- [ ] 「⚽ 試合予想」「🏆 大会予想」「🪙 コインリッチ」タブが切替できる
- [ ] 「🌐 全国」タブで自分の全国順位カード + TOP100 が表示
- [ ] 圏外なら「あなたの周辺5人ずつ」も表示
- [ ] シェアボタンが動く（既存の画像生成が走る）
- [ ] ホーム（D2）、予想（D3）、ランキング（D4）でデザインが揃って見える
- [ ] 他画面（チャット、コインショップ等）は旧デザインのまま動く
- [ ] 既存機能が壊れていない
- [ ] ビルドが通る

---

## 7. 実装後

動作確認できたら「**spec-D4 完了**」と報告してください。

次は **spec-D5（大会チャット画面の侍ブルー化）** に進みます。
LINE風バブル、リアクション、引用返信、予想カード投稿、長押しメニュー、
通知バッジを侍ブルーで仕上げます。
