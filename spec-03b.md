# 実装仕様書 03b ｜ ホーム画面のビジュアル強化

> このファイルは Claude Code に「読んで実装して」と渡すための仕様書です。
> spec-03 で実装したホーム画面（モードA）のビジュアルが弱いため、
> 構造はそのまま維持しつつ、ヒーロー領域を「サッカーフィールド + カウントダウン」
> の演出に強化します。

---

## 0. この機能の狙い

spec-03 でホーム画面を「30秒で1予想」の最短導線に整理した。
構造としては正解だが、装飾を削ったことで実機で見ると
「ボタンしかない」「ビジュアルが弱い」印象になっている。

このアプリの最大の強みは「日本のW杯ファンの心を動かす世界観」。
シンプルな構造は維持したまま、**ヒーロー領域に密度を取り戻す**。

---

## 1. 大前提（守ること）

- **spec-03 で作った構造（モードA/B、主役CTA、サブCTA、折りたたみ）は崩さない。**
- 「30秒で1予想」の動線・タップ数は維持。装飾の追加だけ。
- 既存のデザイントーン（青 `#005BAC` 基調、`stadiumLight` `floatBall` `goldGlow`
  などのアニメCSS）を**もっと攻めて活用する**。
- モバイル幅 max 480px で破綻しないこと。
- `vite.config.js` の `base: '/wcup-yosou/'` は変更しない。
- モードB（参加済みユーザーのホーム）は触らない。今回は**モードA限定**。

---

## 2. 修正の核心：ヒーロー領域の再設計

現在のヒーロー（青グラデ + 「FIFA WORLD CUP 2026」テキスト + ボール絵文字）を、
**「夜のサッカースタジアムを見上げた」演出**に作り直す。

### レイヤー構造（下から上に積む）

```
[最背面] 夜空グラデ（既存の青グラデ #1a3a6e → #0d1f3f）
   ↓
[L2] スタジアム照明（既存 stadiumLight アニメで2〜3点光が瞬く）
   ↓
[L3] サッカーフィールド SVG（斜め俯瞰の透視で、画面下半分に配置）
   ↓
[L4] サッカーボール（フィールド中央、既存 floatBall アニメで浮遊）
   ↓
[L5] テキスト「FIFA WORLD CUP 2026」「W杯を友達と予想して、いちばん当てた人が優勝」
   ↓
[L6・最前面] カウントダウンバッジ（フィールドの上に光るカードでオーバーレイ）
```

### 2-1. サッカーフィールド SVG

斜め俯瞰（地平線から見たような透視）で描く。
画面下半分（ヒーロー領域の下 60%）に配置。

#### 色

- フィールド緑：`#0a6e3a` → `#0d8f4a`（手前ほど明るい縦グラデ）
- 芝の縞模様：明暗の縞を `linear-gradient` の repeating で重ねる
- ラインの白：`#ffffff`、太さ 2px、不透明度 0.85
- 周囲のフェード：フィールドの端は青夜空にスムーズに溶け込ませる（mask or radial-gradient）

#### 描画する線（最低限）

- センターライン（横一本）
- センターサークル（楕円形、透視で潰れた円に）
- ペナルティエリア（手前と奥に1個ずつ、手前は大きく・奥は小さく）
- ゴール枠（手前と奥、台形）
- サイドライン（左右にハの字状に消失点へ収束）

SVG の `viewBox` は `0 0 800 400` ぐらいを目安に、`preserveAspectRatio="xMidYMid slice"`
でアスペクトに応じてトリミング。CSS で `transform: perspective(900px) rotateX(55deg)`
を使うと簡単に「上から見下ろした奥行き」が作れる（SVG で透視を描かなくても CSS 変形でOK）。

#### 実装の最小例

```jsx
<div className="hero-field-wrapper">
  <svg className="hero-field" viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg">
    {/* フィールド本体 */}
    <rect x="0" y="0" width="800" height="400" fill="url(#fieldGrad)" />
    {/* ライン群 */}
    <line x1="0" y1="200" x2="800" y2="200" stroke="white" strokeWidth="2" opacity="0.85" />
    <ellipse cx="400" cy="200" rx="80" ry="40" fill="none" stroke="white" strokeWidth="2" opacity="0.85" />
    {/* ペナルティエリア・ゴールなど */}
    <defs>
      <linearGradient id="fieldGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#0a6e3a" />
        <stop offset="1" stopColor="#0d8f4a" />
      </linearGradient>
    </defs>
  </svg>
</div>
```

CSS:
```css
.hero-field-wrapper {
  position: absolute;
  inset: auto 0 0 0;
  height: 60%;
  perspective: 900px;
  overflow: hidden;
  pointer-events: none;
}
.hero-field {
  width: 100%;
  height: 100%;
  transform: rotateX(55deg) scale(1.4);
  transform-origin: center bottom;
  mask-image: linear-gradient(to top, black 60%, transparent 100%);
}
```

これで「画面下半分が広がっていくサッカーフィールド」になる。

### 2-2. カウントダウンバッジ

ヒーロー領域内、テキストとフィールドの境目あたりに配置。
小さめのカード（横幅 80%, 高さ 60px）で、`goldGlow` アニメをまとう。

#### 表示内容

```
┌──────────────────────────────┐
│  ⏱ W杯開幕まで                │
│    あと 12日 4時間 33分        │
└──────────────────────────────┘
```

#### 実装

```jsx
function HeroCountdown() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60000); // 1分ごとに更新
    return () => clearInterval(t);
  }, []);
  const kickoff = useMemo(() => {
    const first = MATCHES
      .filter(m => m.kickoff)
      .sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff))[0];
    return first ? new Date(first.kickoff).getTime() : null;
  }, []);
  if (!kickoff) return null;
  const diff = kickoff - now;
  if (diff <= 0) return <div className="hero-countdown">⚽ 開幕中！</div>;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  return (
    <div className="hero-countdown">
      <div className="hero-countdown-label">⏱ W杯開幕まで</div>
      <div className="hero-countdown-value">
        あと <strong>{days}</strong>日 <strong>{hours}</strong>時間 <strong>{mins}</strong>分
      </div>
    </div>
  );
}
```

スタイル（既存 `goldGlow` アニメを当てる）:
```css
.hero-countdown {
  background: rgba(255,255,255,0.92);
  color: #0B1F3A;
  border-radius: 14px;
  padding: 10px 16px;
  text-align: center;
  font-weight: 600;
  animation: goldGlow 2.4s ease-in-out infinite;
  margin: 12px auto;
  max-width: 80%;
}
.hero-countdown-value strong {
  font-size: 1.4em;
  color: #E60033;  /* 日の丸赤でアクセント */
}
```

### 2-3. サッカーボール

既存の `floatBall` アニメをサッカーボールアイコンに当てる。
位置はフィールド SVG の中央（センターサークルの真上）。
サイズ大きめ（80〜100px）、影を濃く落として「ピッチに置かれてる感」を出す。

```jsx
<div className="hero-ball">⚽</div>
```
```css
.hero-ball {
  position: absolute;
  left: 50%;
  top: 55%;
  transform: translate(-50%, -50%);
  font-size: 80px;
  animation: floatBall 3s ease-in-out infinite;
  filter: drop-shadow(0 8px 12px rgba(0,0,0,0.4));
}
```

### 2-4. スタジアム照明

ヒーロー領域の上部左右に、薄く光るスポットを2〜3個。既存 `stadiumLight` アニメ流用。

```jsx
<div className="hero-light hero-light-left" />
<div className="hero-light hero-light-right" />
```
```css
.hero-light {
  position: absolute;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,255,200,0.3), transparent 70%);
  animation: stadiumLight 3s ease-in-out infinite;
  pointer-events: none;
}
.hero-light-left { top: -50px; left: -50px; }
.hero-light-right { top: -30px; right: -50px; animation-delay: 1.5s; }
```

---

## 3. その他の調整（spec-03 で残された宿題）

### 3-1. 「もっと遊ぶ」のデフォルトを開に

`defaultOpen={true}` にする。閉じてると存在に気づかれない。

### 3-2. 主役CTAの下にマイクロコピー

`🏆 友達と大会を作る` ボタンの直下に、1行で:

```
LINE / X でシェアして、友達5人で30秒で始められる
```

文字サイズ 12〜13px、色 `#6B7280` の薄め。

---

## 4. 実装ステップ（この順で進める）

- **Step 1**: ヒーロー領域用の React コンポーネント `HeroVisual` を新設
  （フィールド SVG + ボール + 照明 + カウントダウンをまとめる）
- **Step 2**: 既存 `PgHome` のモードA ヒーロー部分を `HeroVisual` に差し替え
- **Step 3**: `HeroCountdown` コンポーネントを実装（`MATCHES` から最早 kickoff を計算）
- **Step 4**: CSS を `styles.css` に追加（既存 `stadiumLight` `floatBall` `goldGlow` を活用）
- **Step 5**: 「もっと遊ぶ」の `defaultOpen` を `true` に
- **Step 6**: 主役CTA下にマイクロコピーを追加
- **Step 7**: ビルドが通ることを確認

---

## 5. デザイン原則

- **シンプルな構造は崩さない**。spec-03 の30秒フローは触らない
- 既存の濃いめのデザイン（青基調・日の丸赤・スタジアム演出）に**寄せていく**
- アニメは控えめに。常時激しく動くのは目障り → ゆっくり脈打つ程度
- モバイルで縦長スクロールしたとき、ヒーローが画面の縦 50〜60% を占めるくらい
- フィールドの緑は彩度を抑える（蛍光緑にしない）

---

## 6. 完了条件（テスト観点）

- [ ] ホーム（モードA）を開くと、ヒーロー領域が「サッカーフィールドを見下ろす」演出になっている
- [ ] フィールド上にサッカーボールが浮遊している
- [ ] カウントダウン（W杯開幕まで あと◯日◯時間◯分）が表示され、1分ごとに更新される
- [ ] 「もっと遊ぶ」がデフォルトで開いた状態
- [ ] 主役CTAの下に「LINE / X でシェアして、友達5人で30秒で始められる」が見える
- [ ] スタジアム照明・floatBall・goldGlow が動いている（過剰ではない範囲で）
- [ ] モバイル幅（375 / 390 / 412 px）でレイアウトが破綻していない
- [ ] 既存機能（30秒フロー・モードB・採点・予想・チャット等）が壊れていない

---

## 7. 実装後

動作確認できたら「優先順位 3b 完了」と報告してください。
これで spec-03（トップ導線整理）が**ビジュアルも含めて本当の完成形**になります。
次は優先順位 4 位（予想カードの画像シェア）に進みます。
