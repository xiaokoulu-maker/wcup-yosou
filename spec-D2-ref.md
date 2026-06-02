# 実装仕様書 D2-ref ｜ HomeA ヒーロー画面のピクセル精度再現

> このファイルは Claude Code に「読んで実装して」と渡すための仕様書です。
> 提供されたモック画像（HomeA / 未参加時のホーム画面）を**ピクセル精度で再現**します。
>
> spec-D2 は既に実装済みですが、モックとの差分を埋めるための追加仕様です。

---

## 0. このフェーズの目的

ユーザーから具体的なヒーロー画面モックが提示された。
これを既存の `PgHome`（HomeA モード = 未参加・大会未作成）で**完全再現**する。

**HomeB（参加済み）には触らない**。HomeA だけが対象。

---

## 1. 大前提（守ること）

- **既存機能（spec-01〜11、spec-D1〜D6、spec-12）を一切壊さない**
- 既存の `PgHome` の中の HomeA 分岐のみを書き換える
- HomeB（`myId && tourn?.participants?.find(p => p.id === myId)` 時）は**触らない**
- ナビゲーション（`nav("create")`、`nav("solo-start")` 等）は既存の関数を使う
- 既存の `HeroCountdown` 等のコンポーネントは、必要に応じて中身を書き換え
- モバイル幅 max 400px（iPhone 14 Pro 論理サイズ 390×844 基準）

---

## 2. 画面全体の構造（上から順）

```
┌─────────────────────────────┐
│ [iOS ステータスバー（触らない）]│
├─────────────────────────────┤
│ アプリヘッダー                │
│ 🔴⚽ wcup-yosou      |||||旗 │ ← 左にロゴ＋アプリ名、右に開催国旗チップ
├─────────────────────────────┤
│                              │
│   FIFA WORLD CUP 2026         │ ← 金色、小、letter-spacing 広め
│   北中米3カ国共催・史上初の48カ国│ ← 薄白、極小
│                              │
│   夏が、はじまる。              │ ← 白、超巨大、Black
│   予想で、もっとアツく。         │
│                              │
│   友達と勝敗を予想して競い合う、 │ ← 薄白、サブコピー
│   40日間だけの夏。              │
│                              │
│   ┌─ カウントダウンカード ────┐│
│   │ 開幕まで                 ││ ← 薄白、ラベル
│   │ 12 · 07 · 44 · 45         ││ ← 巨大数字、DAYSは金、他は白
│   │ DAYS HOURS MIN SEC       ││ ← 小ラベル
│   │ ──────────────           ││
│   │ 48カ国 | 16都市 | 104試合 ││ ← 縦線区切り
│   └─────────────────────────┘│
│                              │
│  (ピッチ装飾、緑グラデ、下にフェード)│
├─────────────────────────────┤
│  [ ＋ 友達と大会を作る ]       │ ← 赤、大、影付き
│  30秒で完成・LINEでそのまま招待   │ ← 薄白、小
│                              │
│  [ ひとりで予想を始める ]       │ ← 白枠、透明背景
│                              │
│  招待された? [コードで参加]      │ ← 薄白、コードで参加だけ赤
│                              │
│  もっと遊ぶ ∨                  │ ← 折りたたみトグル
└─────────────────────────────┘
```

---

## 3. 各要素の詳細仕様

### 3-1. アプリヘッダー（最上部、ロゴと国旗）

```jsx
<header className="flex items-center justify-between px-4 py-3">
  {/* 左: ロゴ + アプリ名 */}
  <div className="flex items-center gap-2">
    <div className="w-8 h-8 rounded-full bg-hinomaru flex items-center justify-center text-white text-base">
      ⚽
    </div>
    <span className="text-white font-bold text-base">wcup-yosou</span>
  </div>
  {/* 右: 開催国旗チップ（CAN/USA/MEX を簡略化、5本縦帯で表現） */}
  <div className="flex h-6 w-12 overflow-hidden rounded-sm">
    <div className="flex-1 bg-hinomaru"></div>
    <div className="flex-1 bg-white"></div>
    <div className="flex-1 bg-white"></div>
    <div className="flex-1 bg-white"></div>
    <div className="flex-1 bg-hinomaru"></div>
  </div>
</header>
```

### 3-2. コピー領域（ヒーロー上、テキスト群）

```jsx
<section className="relative z-10 px-5 pt-4">
  {/* 小金色ラベル */}
  <div className="text-gold text-xs font-bold tracking-[0.2em]">
    FIFA WORLD CUP 2026
  </div>
  {/* 薄白サブラベル */}
  <div className="text-text-on-navy-dim text-xs mt-1">
    北中米3カ国共催・史上初の48カ国
  </div>
  {/* 大見出し */}
  <h1 className="mt-5 text-[40px] leading-[1.1] font-black text-white">
    夏が、はじまる。<br />
    予想で、もっとアツく。
  </h1>
  {/* サブコピー */}
  <p className="mt-4 text-text-on-navy-dim text-sm leading-relaxed">
    友達と勝敗を予想して競い合う、<br />
    40日間だけの夏。
  </p>
</section>
```

### 3-3. カウントダウンカード

モック画像通り、半透明白カード + 細枠 + DAYS だけ金色:

```jsx
function HeroCountdown() {
  const target = new Date("2026-06-11T18:00:00+09:00").getTime();
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
    <div className="relative z-10 mx-5 mt-6 bg-white/10 backdrop-blur border border-white/15 rounded-2xl p-4">
      {/* ラベル */}
      <div className="text-text-on-navy-dim text-xs text-center font-bold">
        開幕まで
      </div>
      {/* 数字行 */}
      <div className="flex items-baseline justify-around mt-2 tabular-nums">
        <div className="flex flex-col items-center">
          <span className="text-[44px] leading-none font-black text-gold">
            {pad(d)}
          </span>
          <span className="text-[10px] text-text-on-navy-dim mt-1 tracking-widest">
            DAYS
          </span>
        </div>
        <div className="text-white/30 text-2xl">·</div>
        <div className="flex flex-col items-center">
          <span className="text-[44px] leading-none font-black text-white">
            {pad(h)}
          </span>
          <span className="text-[10px] text-text-on-navy-dim mt-1 tracking-widest">
            HOURS
          </span>
        </div>
        <div className="text-white/30 text-2xl">·</div>
        <div className="flex flex-col items-center">
          <span className="text-[44px] leading-none font-black text-white">
            {pad(m)}
          </span>
          <span className="text-[10px] text-text-on-navy-dim mt-1 tracking-widest">
            MIN
          </span>
        </div>
        <div className="text-white/30 text-2xl">·</div>
        <div className="flex flex-col items-center">
          <span className="text-[44px] leading-none font-black text-white">
            {pad(s)}
          </span>
          <span className="text-[10px] text-text-on-navy-dim mt-1 tracking-widest">
            SEC
          </span>
        </div>
      </div>
      {/* 区切り線 */}
      <div className="border-t border-white/10 mt-4 pt-3">
        {/* スタッツ */}
        <div className="grid grid-cols-3 divide-x divide-white/10 text-center">
          <div>
            <div className="text-white font-bold">48 <span className="text-text-on-navy-dim text-xs">カ国</span></div>
          </div>
          <div>
            <div className="text-white font-bold">16 <span className="text-text-on-navy-dim text-xs">都市</span></div>
          </div>
          <div>
            <div className="text-white font-bold">104 <span className="text-text-on-navy-dim text-xs">試合</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 3-4. ピッチ装飾（ヒーロー下部、緑のグラデ）

カウントダウンカードの後ろあたりに、緑のピッチが透視で広がる:

```jsx
{/* ピッチ装飾（カウントダウンの背後、画面下部、見出し領域より下に位置） */}
<div className="absolute left-0 right-0 bottom-0 h-[280px] overflow-hidden pointer-events-none z-0"
     style={{ perspective: "900px" }}>
  <div
    style={{
      width: "100%",
      height: "100%",
      transform: "rotateX(60deg) scale(1.6)",
      transformOrigin: "center bottom",
      background: "repeating-linear-gradient(90deg, #0e7c3f 0 40px, #0a6e3a 40px 80px)",
      maskImage: "linear-gradient(to top, black 30%, transparent 100%)",
      WebkitMaskImage: "linear-gradient(to top, black 30%, transparent 100%)",
    }}
  />
</div>
```

これはヒーローセクションのコンテナ内に `position: relative` を当てた上で配置する。

### 3-5. CTA 群（ヒーローの下、CTAエリア）

```jsx
<div className="relative z-10 mt-8 px-5 pb-5">
  {/* メイン CTA */}
  <button
    onClick={() => nav("create")}
    className="w-full bg-hinomaru hover:bg-hinomaru-hover active:bg-hinomaru-active
               text-white rounded-2xl shadow-cta-red py-4 font-bold text-base
               flex items-center justify-center gap-2 active:scale-[.98] transition"
  >
    <span className="text-xl leading-none">＋</span>
    友達と大会を作る
  </button>
  {/* メイン CTA のサブテキスト */}
  <div className="text-text-on-navy-dim text-xs text-center mt-2">
    30秒で完成・LINEでそのまま招待
  </div>

  {/* ゴースト CTA */}
  <button
    onClick={() => nav("solo-start")}
    className="w-full border border-white/30 text-white rounded-2xl py-3.5 font-bold text-base mt-4
               active:scale-[.98] transition"
  >
    ひとりで予想を始める
  </button>

  {/* 招待リンク */}
  <div className="text-center mt-5 text-text-on-navy-dim text-sm">
    招待された? <button onClick={() => nav("join-by-code")} className="text-hinomaru font-bold">コードで参加</button>
  </div>

  {/* 折りたたみ「もっと遊ぶ」 */}
  <button
    onClick={() => setShowMore(prev => !prev)}
    className="w-full text-text-on-navy-dim text-sm text-center mt-6 py-2 active:opacity-70"
  >
    もっと遊ぶ <span className="ml-1">{showMore ? "∧" : "∨"}</span>
  </button>

  {showMore && (
    <div className="mt-4 grid grid-cols-2 gap-3">
      {/* 既存の「もっと遊ぶ」グリッド（4枚）をここに展開 */}
    </div>
  )}
</div>
```

---

## 4. 全体コンテナと背景

```jsx
function HomeA({ nav }) {
  const [showMore, setShowMore] = useState(false);
  return (
    <div className="min-h-screen relative overflow-hidden
                    bg-gradient-to-b from-navy-hero via-navy-base to-navy-700">
      {/* 背景の星やフラッドライト（あれば spec-D2 で実装済み） */}
      <BackgroundDecoration />

      {/* ピッチ装飾（画面下部） */}
      <PitchDecoration />

      {/* コンテンツ */}
      <AppHeader />
      <HeroCopy />
      <HeroCountdown />
      <CTAGroup />
    </div>
  );
}
```

---

## 5. 実装ステップ（この順で進める）

- **Step 1**: 既存の `PgHome` の中の HomeA 分岐を特定（`myId` 無し or 参加者リストに自分がいない時）
- **Step 2**: HomeA の JSX を、この仕様書のレイアウトで完全に書き換え
  - アプリヘッダー（ロゴ + 国旗チップ）
  - コピー領域（金色ラベル + 大見出し + サブコピー）
  - HeroCountdown（既存があれば中身を書き換え）
  - ピッチ装飾
  - CTA 群（メイン赤 + ゴースト + 招待リンク + 折りたたみ）
- **Step 3**: 既存のナビ関数（`nav("create")` 等）に正しく繋がってるか確認
- **Step 4**: HomeB（参加済み）は触らないこと
- **Step 5**: ビルドが通ることを確認
- **Step 6**: **`npm run deploy` で本番に公開**
- **Step 7**: 「実装完了 + デプロイ完了」と報告

---

## 6. 細かい注意

- **モバイル幅優先**: 390px 幅の iPhone 14 Pro を基準。文字サイズや余白はそのまま
- **`text-[40px]` `text-[44px]` `text-[10px]` などの任意サイズ指定**は Tailwind の任意値構文で OK
- **国旗チップ**: シンプルに5本縦帯で簡略化（赤白白白赤）。完全な国旗を CSS で再現しない
- **DAYS は金色 `text-gold` (#F4B400)**、HOURS/MIN/SEC は白
- **カウントダウンの「・」セパレータ**: `text-white/30` の薄い「·」を使う
- **「友達と大会を作る」の「＋」**: 全角プラスでもアイコンでもOK、視覚的に同じ
- **「コードで参加」のリンク**: 赤強調（`text-hinomaru font-bold`）
- **既存の「もっと遊ぶ」グリッド**: 既に spec-D2 で実装してるならそのまま流用、無ければ空でも OK
- **ステータスバー**: iOS 標準のもの。アプリ側では触らない

---

## 7. 完了条件（テスト観点）

- [ ] HomeA を開くと、画面全体が侍ブルーグラデで埋まる
- [ ] 上部に赤丸ロゴ + `wcup-yosou` テキスト + 5本縦帯の旗チップ
- [ ] 「FIFA WORLD CUP 2026」（金色、letter-spacing広め）
- [ ] 「北中米3カ国共催・史上初の48カ国」（薄白小）
- [ ] 「夏が、はじまる。 / 予想で、もっとアツく。」（白、超巨大、太字）
- [ ] 「友達と勝敗を予想して競い合う、 / 40日間だけの夏。」（薄白サブコピー）
- [ ] カウントダウンカード（半透明白、細枠、開幕までラベル、DD/HH/MM/SS の巨大数字、DAYSだけ金色、48カ国/16都市/104試合の区切り）
- [ ] 緑のピッチ装飾が下部にフェードイン
- [ ] 赤い「＋ 友達と大会を作る」CTA（影付き）
- [ ] その下に「30秒で完成・LINEでそのまま招待」薄白小
- [ ] 白枠の「ひとりで予想を始める」ゴーストCTA
- [ ] 「招待された? コードで参加」（コードで参加だけ赤）
- [ ] 「もっと遊ぶ ∨」の折りたたみトグル
- [ ] HomeB（参加済み）は壊れていない
- [ ] 既存の spec-01〜11、D1〜D6、spec-12 機能が壊れていない
- [ ] **ビルドが通り、本番に自動デプロイされている**

---

## 8. 自動デプロイの指示

Claude Code への指示として、**実装完了後に以下を自動実行する**:

1. `npm run build` でビルド確認
2. ビルドが通ったら `npm run deploy` で本番公開
3. 「実装完了 + デプロイ完了」と報告

ビルドが失敗した場合は、そこで止まって原因を報告すること（デプロイには進まない）。

---

## 9. 実装後

動作確認できたら「**spec-D2-ref 完了**」と報告してください。

スマホで実機確認し、モック画像と見比べてズレがあれば追加の調整依頼を出します。
