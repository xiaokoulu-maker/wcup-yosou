# 実装仕様書 D2 ｜ ホーム画面（HomeA / HomeB）の侍ブルー化

> このファイルは Claude Code に「読んで実装して」と渡すための仕様書です。
> 既存の `PgHome` を、`design-reference/` のデザインに沿って侍ブルー基調に
> 置き換えます。**ホーム画面のみが対象**。他画面は次の spec で扱います。

---

## 0. このフェーズの位置づけ

spec-D1 で侍ブルーのデザイントークン（Tailwind）の土台を整えた。
ここから**画面1枚ずつ**、新デザインに置き換えていく。

D2 の対象は **ホーム画面のみ**:
- HomeA（未参加 = `myId` 無し or `tourn` 無し）
- HomeB（参加済み = `myId` あり）

他の画面（試合予想・ランキング・チャット等）は触らない。
ホームが切り替わった状態でも、各画面の機能は普通に動く。
このアプローチで、画面間の整合性を保ちながら段階的に侍ブルー化を進める。

---

## 1. 大前提（守ること）

- **既存機能（spec-01〜11）を一切壊さない**
- ホーム以外の画面（PgMatches, PgRanking, PgChat, PgChampion, PgJapan,
  PgBest11, PgGroups, PgBracket, PgAdmin, PgBadges, PgCoinShop, 等）は**触らない**
- 既存の状態管理（`tourn`, `myId`, `nav`, `myParticipant` 等）は維持
- 30秒フロー（HomeA → 大会作成 → 参加 → HomeB → 試合予想）は維持
- Tailwind と既存 styles.css の併用。Tailwind クラスを優先的に使う
- モバイル幅 max 400px（iPhone 14 Pro 論理サイズ 390×844 基準）

---

## 2. 参照すべきファイル

Claude Code への指示として、以下のファイルを **必要な箇所だけ Grep で絞って** 読むこと:

| ファイル | 用途 |
|---------|------|
| `design-reference/README.md` の `### 2. HomeA` と `### 3. HomeB` セクション | 仕様 |
| `design-reference/home.jsx` | HomeA / HomeB の参考実装（コピペでなく要素を抽出） |
| `design-reference/shared.jsx` | `useCountdown`, `Avatar`, `Flag`, `MiniFlag` 等のヘルパー |
| `design-reference/screens/01-home-a.jpg` | HomeA のピクセル基準 |
| `design-reference/screens/02-home-b.jpg` | HomeB のピクセル基準 |

**重要**: `design-reference/home.jsx` を**全文読まない**。`HomeA` 関数と `HomeB` 関数の
中身を中心に、必要な class 名・構造・コピー（テキスト）を抽出して、既存の App.jsx に統合する。

---

## 3. HomeA（未参加）の仕様

### 3-1. レイアウト構造（上から順）

1. **ヒーロー領域**（高さ約 60vh）
   - 背景: `linear-gradient(180deg, #061533, #0a1f4c, #0d2a5e)`
   - 上部にフラッドライトの放射グロー（CSS の `radial-gradient` を2〜3個重ねる）
   - 中央〜上部に薄く星を配置（小さな白いドット数個）
   - 下半分にピッチ（サッカーフィールド）を `rotateX(64deg)` で透視
     - 緑のグラデ `#0e7c3f` → `#0a6e3a` の縞模様
     - センターサークル（楕円、薄白の線）
   - 右上に開催3カ国旗チップ（CAN / USA / MEX、各国旗を縦3分割の CSS で表現）

2. **コピー領域**（ヒーローの上にオーバーレイ）
   - 上ラベル（小・トラッキング広め）: `FIFA WORLD CUP 2026`
   - サブラベル: `北中米3カ国共催・史上初の48カ国`
   - 大見出し（display-lg、`font-black`、白）:
     `夏が、はじまる。\n予想で、もっとアツく。`

3. **カウントダウンカード**（半透明ネイビーカード）
   - 「開幕まで」のラベル
   - `DD : HH : MM : SS` 形式の大きな数字（tabular-nums、白）
   - **DAYS だけ金色** `#F4B400`
   - 下に区切り線、その下に事実スタッツ「**48カ国 / 16都市 / 104試合**」

4. **CTA 群**（カードの下、ヒーローの底に近い位置）
   - メイン: `🏆 友達と大会を作る`（赤背景 `bg-hinomaru`、`shadow-cta-red`、`rounded-card-lg`、大）
   - ゴースト: `👤 ひとりで予想を始める`（白枠線、透明背景、白文字）
   - テキスト: `招待された？ コードで参加 →`（控えめ、白の薄い色）

5. **折りたたみ「もっと遊ぶ」**（ヒーローの下、ネイビー背景の通常領域）
   - デフォルトで開いた状態
   - 2×2 のグリッドで遊びカード:
     - 🤖 AI 優勝予想
     - 📋 グループ表
     - 🏆 決勝T
     - ⭐ ベスト11
   - その下に: 💬 みんなのチャット / 📅 試合日程（2列目）

### 3-2. 主要 Tailwind クラスの目安

- 背景: `bg-navy-base`
- ヒーローカード（カウントダウン）: `bg-white/5 backdrop-blur rounded-card border border-white/10 p-4`
- メイン CTA: `bg-hinomaru hover:bg-hinomaru-hover active:bg-hinomaru-active text-white rounded-card-lg shadow-cta-red active:scale-[.98] transition`
- ゴースト CTA: `border border-white/30 text-white rounded-card-lg`
- テキスト: `text-text-on-navy` / `text-text-on-navy-dim`

### 3-3. ヒーロー演出のCSS（重要）

```jsx
function HomeHero() {
  return (
    <div className="relative h-[60vh] overflow-hidden bg-gradient-to-b from-navy-hero via-navy-base to-navy-700">
      {/* フラッドライト */}
      <div className="absolute top-0 left-1/4 w-72 h-72 rounded-full bg-white/10 blur-3xl"></div>
      <div className="absolute top-10 right-1/4 w-64 h-64 rounded-full bg-blue-200/10 blur-3xl"></div>

      {/* 星 */}
      <div className="absolute top-12 left-10 w-1 h-1 bg-white rounded-full opacity-60"></div>
      <div className="absolute top-20 right-20 w-0.5 h-0.5 bg-white rounded-full opacity-80"></div>
      <div className="absolute top-32 left-1/2 w-1 h-1 bg-white rounded-full opacity-50"></div>

      {/* ピッチ（透視） */}
      <div className="absolute bottom-0 left-0 right-0 h-[50%]"
           style={{ perspective: "900px" }}>
        <div className="w-full h-full"
             style={{
               transform: "rotateX(64deg) scale(1.4)",
               transformOrigin: "center bottom",
               background: "repeating-linear-gradient(90deg, #0e7c3f 0 40px, #0a6e3a 40px 80px)",
               maskImage: "linear-gradient(to top, black 70%, transparent 100%)",
             }}>
          {/* センターサークル */}
          <div className="absolute top-1/2 left-1/2 w-32 h-16 -translate-x-1/2 -translate-y-1/2
                          border-2 border-white/40 rounded-full"></div>
        </div>
      </div>

      {/* コピー（ヒーロー上にオーバーレイ） */}
      <div className="relative z-10 px-5 pt-10 text-text-on-navy">
        <div className="text-xs tracking-[0.2em] font-bold text-text-on-navy-dim">
          FIFA WORLD CUP 2026
        </div>
        <div className="text-xs text-text-on-navy-weak mt-1">
          北中米3カ国共催・史上初の48カ国
        </div>
        <h1 className="mt-3 text-display-lg font-black leading-tight">
          夏が、はじまる。<br />予想で、もっとアツく。
        </h1>
      </div>
    </div>
  );
}
```

### 3-4. カウントダウン（HeroCountdown の置き換え）

既存の `HeroCountdown`（spec-03b）を、新デザインに合わせて作り直す:

```jsx
function HeroCountdown() {
  const target = new Date("2026-06-11T18:00:00+09:00").getTime(); // 開幕日時
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(0, target - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff / 3600000) % 24);
  const m = Math.floor((diff / 60000) % 60);
  const s = Math.floor((diff / 1000) % 60);
  const pad = (n) => String(n).padStart(2, "0");

  return (
    <div className="mx-5 mt-4 bg-white/5 backdrop-blur border border-white/10 rounded-card p-4 text-text-on-navy">
      <div className="text-xs text-text-on-navy-dim mb-2">開幕まで</div>
      <div className="flex items-baseline gap-3 font-black tabular-nums">
        <div><span className="text-4xl text-gold">{pad(d)}</span><span className="text-xs ml-1">DAYS</span></div>
        <div><span className="text-4xl">{pad(h)}</span><span className="text-xs ml-1">HRS</span></div>
        <div><span className="text-4xl">{pad(m)}</span><span className="text-xs ml-1">MIN</span></div>
        <div><span className="text-4xl">{pad(s)}</span><span className="text-xs ml-1">SEC</span></div>
      </div>
      <div className="border-t border-white/10 mt-3 pt-3 grid grid-cols-3 gap-2 text-center text-text-on-navy-dim text-xs">
        <div><div className="text-text-on-navy font-bold text-base">48</div>カ国</div>
        <div><div className="text-text-on-navy font-bold text-base">16</div>都市</div>
        <div><div className="text-text-on-navy font-bold text-base">104</div>試合</div>
      </div>
    </div>
  );
}
```

---

## 4. HomeB（参加済み）の仕様

### 4-1. レイアウト構造（上から順）

1. **ヘッダー**
   - 左: `大会 / [大会名]`（小ラベル＋大会名）
   - 右: 🔔 ベル（赤の未読ドット）/ 自分のアバター

2. **日本戦カウントダウンバナー**（金枠のグラデ、タップで japan）
   - ラベル `次の日本戦まで`
   - チーム表記 `🇯🇵 日本 vs 🇧🇷 ブラジル`
   - 大きな `17日 21:32`（金色強調）
   - 下に `6/16(火) 22:00 KO`

3. **今日の試合フィーチャーカード**（白カード、タップで predict）
   - 上にラベル「未予想 3」（赤バッジ）
   - 大きな対戦表記 `🇦🇷 アルゼンチン VS 🇫🇷 フランス`
   - 📍 開催地 `ダラス · AT&T Stadium`
   - 締切カウント「あと 4h 12m」
   - 「当たれば +3pt」のヒント

4. **2×2 ステータスカード**（白カード、各タップで遷移）
   - 順位 `3位 / 12人`（▲2上昇）→ rank
   - 連続的中 `5🔥` → badge
   - コイン残高 `1,240 🪙` → shop
   - 獲得バッジ `7/24` → badge

5. **主要 CTA**: `⚽ 試合を予想する`（赤、`shadow-cta-red`）→ predict

6. **ボトムタブバー**（後で D8 等で対応）: 今は無視してOK

### 4-2. 主要 Tailwind クラスの目安

- 背景: `bg-navy-base`
- 白カード: `bg-white text-text-on-white rounded-card shadow-data-card p-4`
- 金バナー: `bg-gradient-to-r from-gold to-gold-light text-navy-base rounded-card shadow-cta-gold`
- 赤バッジ: `bg-hinomaru text-white text-xs rounded-full px-2 py-0.5`

### 4-3. データ取得

既存の `participant`, `tourn`, `MATCHES` から取得:

```js
const myParticipant = tourn?.participants?.find(p => p.id === myId);
const todayMatch = MATCHES.find(m => isSameDay(new Date(m.kickoff), new Date()));
const nextJapanMatch = MATCHES
  .filter(m => (m.home === "日本" || m.away === "日本") && new Date(m.kickoff) > Date.now())
  .sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff))[0];
const myRank = computeRank(tourn.participants, myId); // 既存ロジック
const myStreak = myParticipant?.streak?.current || 0;
const myCoins = myParticipant?.coins?.balance || 0;
const myBadgesCount = myParticipant?.badges?.length || 0;
```

---

## 5. 実装ステップ（この順で進める）

- **Step 1**: `design-reference/README.md` の HomeA / HomeB セクション、
  および `design-reference/home.jsx` の `HomeA` と `HomeB` 関数を Grep で読む
  （ファイル全体は読まないこと）
- **Step 2**: 既存の `PgHome` を見つけて、その JSX を**完全に書き換える**
  （関数のシグネチャ・propsは維持。中身だけ新デザインに）
- **Step 3**: 既存の `HeroVisual`, `HeroCountdown`（spec-03b で作ったもの）を
  上記 3-3 / 3-4 のコードに置き換える
- **Step 4**: HomeA のレイアウト・CTA・「もっと遊ぶ」グリッドを実装
- **Step 5**: HomeB のヘッダー・日本戦バナー・今日の試合カード・2×2ステータス・主要CTAを実装
- **Step 6**: 各 CTA / カードのタップ遷移が既存と同じ画面に行くか確認
  - 「友達と大会を作る」→ create
  - 「ひとりで予想を始める」→ 既存の1人モード処理
  - 「試合を予想する」→ matches
  - 「順位カード」→ ranking
  - 「日本戦バナー」→ japan（既存の PgJapan）
- **Step 7**: ビルドが通ることを確認
- **Step 8**: 既存の他画面（試合予想・ランキング等）が壊れていないことを確認

---

## 6. 細かい注意

- **HomeHero の星やライトの位置**: design-reference/screens/01-home-a.jpg を見て、
  雰囲気を再現すれば良い。ピクセル完璧でなくてOK
- **ピッチの実装**: CSS の `linear-gradient` + `rotateX` で作る。SVG は使わない方が軽い
- **PgHomeLegacy は残す**: spec-03 で作った `PgHomeLegacy` はバックアップとして残す
  （何かあったときに切り戻せるように）
- **モード判定**: `myId && tourn?.participants?.find(p => p.id === myId)` で参加済み判定。
  spec-03 の判定ロジックを維持
- **絵文字の旗**: 🇯🇵 などはそのまま使う（CSS製の旗にすると複雑化）
- **既存スタイルとの衝突**: `bg-` や `text-` などの Tailwind クラスが、既存の
  inline style と衝突する場合は inline style を削除。`className` 優先
- **アニメーション**: `animate-wc-glow` `animate-wc-pop` などの新規アニメは
  必要な箇所に控えめに当てる。ヒーロー領域の照明には `animate-wc-glow` がハマる

---

## 7. 完了条件（テスト観点）

- [ ] HomeA（未参加）が新デザインで表示される
  - 夜空のヒーロー + ピッチ + フラッドライト
  - カウントダウン（開幕まで DD:HH:MM:SS、DAYS が金色）
  - 「夏が、はじまる。予想で、もっとアツく。」のコピー
  - 赤いメイン CTA 「友達と大会を作る」
  - ゴーストボタン 「ひとりで予想を始める」
  - 「もっと遊ぶ」の2×2 グリッド
- [ ] HomeB（参加済み）が新デザインで表示される
  - ヘッダーに大会名とアバター
  - 金枠の日本戦カウントダウンバナー
  - 白カードで「今日の試合」フィーチャーカード
  - 2×2 のステータスカード（順位 / ストリーク / コイン / バッジ）
  - 赤いメイン CTA 「試合を予想する」
- [ ] CTA タップで既存の画面に遷移する
- [ ] 既存のホーム以外の画面（予想・ランキング・チャット等）は今まで通り表示される
- [ ] 30秒フロー（作る → 参加 → ホーム → 予想）が通る
- [ ] 既存の spec-01〜11 機能が壊れていない
- [ ] ビルドが通る

---

## 8. 実装後

動作確認できたら「**spec-D2 完了**」と報告してください。

次は **spec-D3（試合予想画面の侍ブルー化）** に進みます。
ホームと予想画面が新デザインになれば、コア体験が侍ブルーで揃います。
