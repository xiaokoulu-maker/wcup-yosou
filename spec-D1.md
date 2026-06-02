# 実装仕様書 D1 ｜ デザインシステム導入（土台作り）

> このファイルは Claude Code に「読んで実装して」と渡すための仕様書です。
> `design-reference/` フォルダにあるデザインリファレンス（侍ブルー基調）を
> 既存の `wcup-vite` プロジェクトに導入するための**土台作り**を行います。
>
> **重要**: このフェーズでは既存の画面の見た目は一切変えません。
> Tailwind 導入・カラートークン定義・フォント読み込みだけを行い、
> D2 以降で各画面を段階的に新デザインへ移行する準備をします。

---

## 0. このフェーズの位置づけ

`design-reference/README.md` に書かれた全画面のデザインを実装に落とすには、
**まず土台（Tailwind 設定、デザイントークン、フォント）を整える**必要がある。

このD1では:

- Tailwind CSS を wcup-vite に導入
- design-reference の Design Tokens（カラー、影、角丸、余白）を Tailwind 設定に反映
- Noto Sans JP を読み込む
- カウントダウン等で使う便利な共通ヘルパーを `src/lib/` 配下に新設（任意）

**既存の App.jsx の画面・スタイル・機能には一切触らない**。
D2 以降で画面を1つずつ置き換える際に、ここで整えた基盤を使う。

---

## 1. 大前提（守ること）

- **既存機能（spec-01〜11）を一切壊さない**
- 既存の見た目（青ベース、ヒーロー演出、各画面）は **このフェーズでは変えない**
- 既存の `styles.css` も維持。新規CSSは別ファイルで追加
- `vite.config.js` の `base: '/wcup-yosou/'` は変更しない
- `design-reference/` フォルダの中身は読み取り専用として扱う（編集しない）

---

## 2. やること

### 2-1. Tailwind CSS の導入

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

`tailwind.config.js` を作成し、design-reference の Design Tokens を反映:

```js
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // --- Navy (侍ブルー基調) ---
        "navy-hero": "#061533",        // 夜のスタジアム最暗部
        "navy-base": "#0a1f4c",        // アプリ背景・既定
        "navy-700": "#0d2a5e",         // 面の差・グラデ
        "navy-elevated": "#11337a",    // バナー/カード上部グラデ
        "navy-elevated-2": "#11367a",

        // --- Cards ---
        "card-mist": "#F0F4FA",        // 白上のサブ面

        // --- Accent: 日の丸赤 ---
        "hinomaru": {
          DEFAULT: "#E60033",
          hover: "#cc002e",
          active: "#b30028",
          light: "#ff5a7a",
          light2: "#ff6a86",
        },

        // --- Accent: Gold (celebration) ---
        "gold": {
          DEFAULT: "#F4B400",
          light: "#ffce4a",
        },

        // --- Text on Navy ---
        "text-on-navy": {
          DEFAULT: "#FFFFFF",
          dim: "#C9D6EC",
          weak: "#8fa3c9",
          weakest: "#5e74a0",
        },

        // --- Text on White Card ---
        "text-on-white": {
          DEFAULT: "#0a1f4c",
          gray: "#5B6B85",
        },

        // --- Success ---
        "success": {
          DEFAULT: "#0e8a46",
          light: "#34d27e",
        },

        // --- Position colors ---
        "pos-fw": "#E60033",
        "pos-mf": "#F4B400",
        "pos-df": "#2a5bd0",

        // --- Social ---
        "line-green": "#06C755",
        "x-black": "#111111",
      },
      fontFamily: {
        sans: ['"Noto Sans JP"', "system-ui", "-apple-system", "sans-serif"],
      },
      fontWeight: {
        // Noto Sans JP の階層
        // 400 normal / 500 medium / 700 bold / 800 extrabold / 900 black
      },
      borderRadius: {
        "card": "1rem",       // 16px = rounded-2xl 同等
        "card-lg": "1.5rem",  // 24px = rounded-3xl 同等
        "sheet": "1.75rem",   // 28px (rounded-[28px])
      },
      boxShadow: {
        "data-card": "0 10px 26px rgba(4,12,33,.30)",
        "cta-red": "0 10px 26px rgba(230,0,51,.42)",
        "cta-gold": "0 10px 26px rgba(244,180,0,.40)",
        "hero": "0 18px 50px rgba(0,0,0,.45)",
      },
      fontSize: {
        // Display 30-46px / Title 19-24px / Body 13-15px / Caption 10-12px
        "display-sm": ["30px", { lineHeight: "1.1", fontWeight: "900" }],
        "display": ["38px", { lineHeight: "1.1", fontWeight: "900" }],
        "display-lg": ["46px", { lineHeight: "1.1", fontWeight: "900" }],
        "title-sm": ["19px", { lineHeight: "1.3", fontWeight: "800" }],
        "title": ["22px", { lineHeight: "1.3", fontWeight: "800" }],
        "title-lg": ["24px", { lineHeight: "1.3", fontWeight: "800" }],
      },
      keyframes: {
        "wc-sheet": {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "wc-pop": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "wc-pop-big": {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "60%": { transform: "scale(1.05)", opacity: "1" },
          "100%": { transform: "scale(1)" },
        },
        "wc-rise": {
          "0%": { transform: "translateY(12px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "wc-fall": {
          "0%": { transform: "translateY(-20px) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(900px) rotate(720deg)", opacity: "0" },
        },
        "wc-glow": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        "wc-spin": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "wc-sheet": "wc-sheet 0.34s ease-out",
        "wc-pop": "wc-pop 0.2s ease-out",
        "wc-pop-big": "wc-pop-big 0.4s ease-out",
        "wc-rise": "wc-rise 0.5s ease-out",
        "wc-fall": "wc-fall 3.5s linear infinite",
        "wc-glow": "wc-glow 2s ease-in-out infinite",
        "wc-spin": "wc-spin 1s linear infinite",
      },
    },
  },
  plugins: [],
}
```

`postcss.config.js` も Tailwind プロジェクト標準のものを設置。

### 2-2. Tailwind ベーススタイルの導入

`src/tailwind.css` を新規作成:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

`src/main.jsx`（または既存のエントリーポイント）で、**既存の styles.css の手前で** import:

```js
import "./tailwind.css";
import "./styles.css";  // 既存（後で読み込んで優先度を保つ）
```

これで既存の見た目は変わらず、Tailwind クラスが使えるようになる。

### 2-3. Noto Sans JP の読み込み

`index.html` の `<head>` に追加:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;800;900&display=swap" rel="stylesheet">
```

ただし、**既存の body のフォント指定は変えない**。D2 以降で個別画面で `font-sans` クラスを当てて移行する形にする。

### 2-4. 共通ユーティリティの導入（任意）

`design-reference/shared.jsx` には以下のヘルパーがある:
- `useCountdown(targetDate)` — カウントダウン
- `Icon` — 単色塗りアイコン集
- `Flag` / `MiniFlag` — CSS製の国旗
- `Avatar` — アバター
- `ScreenHeader` — 画面ヘッダー
- `Tabs` / `TabBar` — タブ

これらは D2 以降で必要になるが、**D1 ではまだ何もしない**。
各画面を実装する spec で必要なものだけ移植する。

### 2-5. デザイントークンの参照しやすさ

開発時に「色や影のクラス名」をすぐ見つけられるよう、`tailwind.config.js` の冒頭に
コメントで使い方の早見表を入れておく:

```js
// === Color cheatsheet ===
// 背景: bg-navy-base (基本) / bg-navy-hero (ヒーロー)
// CTA: bg-hinomaru text-white shadow-cta-red
// バッジ祝福: bg-gold shadow-cta-gold
// データカード: bg-white shadow-data-card rounded-card
// 文字: text-text-on-navy (ネイビー上) / text-text-on-white (白上)
```

---

## 3. 実装ステップ（この順で進める）

- **Step 1**: `npm install -D tailwindcss postcss autoprefixer` を実行
- **Step 2**: `npx tailwindcss init -p` で設定ファイルを生成
- **Step 3**: 上記の `tailwind.config.js` を全文置き換え
- **Step 4**: `src/tailwind.css` を新規作成して `@tailwind` ディレクティブを書く
- **Step 5**: `src/main.jsx`（エントリーポイント）で `tailwind.css` を既存 CSS の前に import
- **Step 6**: `index.html` に Noto Sans JP の link を追加
- **Step 7**: ビルドが通ることを確認
- **Step 8**: 既存画面が今まで通り見えることを確認（見た目変化ゼロが目標）
- **Step 9**: 試しに何か小さなテスト要素（コンソール用の `<div className="bg-hinomaru text-white p-2 rounded-card">test</div>` 等）を一時的に挿入して、Tailwind クラスが効くか確認 → 確認後すぐ削除
- **Step 10**: 完了報告

---

## 4. 細かい注意

- **既存スタイルの優先**: Tailwind のリセット（`@tailwind base`）が既存のスタイルを
  上書きしすぎる場合は、`base` を抜いて `components` と `utilities` だけにする選択肢もある
- **Noto Sans JP の読み込み速度**: 全ウェイトを読むと重い。今回は 400/500/700/800/900 を
  指定。実機で重さが気になれば D2 以降で 400/700/900 に絞ってもよい
- **既存の React コンポーネントには Tailwind クラスを追加しない**。
  「使える状態にする」だけが目的。各画面の置き換えは D2 以降の仕事

---

## 5. 完了条件（テスト観点）

- [ ] `npm install` が成功し、`tailwindcss` が dependencies に追加されている
- [ ] `tailwind.config.js` が作成され、design-reference のトークンが反映されている
- [ ] `src/tailwind.css` が作成され、main.jsx で import されている
- [ ] Noto Sans JP が index.html で読み込まれている
- [ ] `npm run build` がエラー無く通る
- [ ] ローカルプレビューで既存の画面（ホーム・予想・ランキング等）が**従来通り**表示される
- [ ] テスト要素を挿入したとき、Tailwind クラス（例: `bg-hinomaru`）が効くことが確認できる
- [ ] テスト要素を削除した後、ビルドが通る
- [ ] spec-01〜11 の機能が壊れていない

---

## 6. 実装後

動作確認できたら「**spec-D1 完了**」と報告してください。

次は **spec-D2（ホーム画面 HomeA / HomeB の侍ブルー化）** に進みます。
ここで初めて画面の見た目が変わります。
D2 では `design-reference/screens/01-home-a.jpg` と `02-home-b.jpg` を
ピクセル基準として、既存の `PgHome` を新デザインに置き換えます。
