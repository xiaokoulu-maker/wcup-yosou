# 実装仕様書 04 ｜ 予想カードの画像シェア

> このファイルは Claude Code に「読んで実装して」と渡すための仕様書です。
> 既存の `wcup-vite` プロジェクトに、予想結果を画像カードとして
> 生成・シェアする機能を追加します。

---

## 0. この機能の狙い

今のアプリは「URLをシェアして友達を誘う」の導線しかない。
テキストURLは SNS で流れていきにくく、拡散されにくい。

予想ゲームのバイラル要因は、ほぼ例外なく
**「自分の予想・結果を画像で投稿できる」**こと。
Spotify Wrapped、Strava の運動記録、Duolingo の連続記録、
すべて画像カード生成からの SNS シェアでユーザーを大量に獲得している。

この機能で:

- 予想を入れたとき、その予想を**1枚の画像カード**として生成
- LINE / X / Instagram のストーリーに**画像として共有**できる
- カードを見た人が「自分もやってみたい」となり、URLからアプリに来る
- これがバイラルループの土台になる

---

## 1. 大前提（守ること）

- **既存機能を一切壊さない**。spec-01〜03b（試合予想、採点、ライブ順位、
  トップ導線、ヒーロー演出）すべて維持。
- 既存の `html2canvas`（package.json で既に依存に入っている前提。
  入っていなければ追加）を使う。
- モバイル幅 max 480px で破綻しないこと。
- `vite.config.js` の `base: '/wcup-yosou/'` は変更しない。

---

## 2. 生成する画像カードの種類（最低3種）

### 2-1. 「優勝予想カード」（既存の優勝予想画面用）

```
┌─────────────────────────────┐
│   FIFA WORLD CUP 2026        │
│   ━━━━━━━━━━━━━━━━━━         │
│                              │
│   私の優勝予想                │
│                              │
│   🇪🇸 スペイン                │
│   （大きく中央に）            │
│                              │
│   得点王予想:                 │
│   ⚽ ハーランド (NOR)         │
│                              │
│   ━━━━━━━━━━━━━━━━━━         │
│   wcup-yosou.com で予想       │
└─────────────────────────────┘
```

### 2-2. 「試合予想カード」（PgMatches の予想完了モーダル用）

```
┌─────────────────────────────┐
│   今日の試合予想               │
│   ━━━━━━━━━━━━━━━━━━         │
│                              │
│   🇯🇵 日本 🆚 🇩🇪 ドイツ      │
│   kickoff: 6/15 23:00         │
│                              │
│   私の予想:                   │
│   ┌─────────────────┐        │
│   │ 日本勝ち！🎌      │        │
│   │ 当たれば +3pt    │        │
│   └─────────────────┘        │
│                              │
│   ━━━━━━━━━━━━━━━━━━         │
│   #W杯予想メーカー            │
└─────────────────────────────┘
```

### 2-3. 「成績シェアカード」（PgRanking の自分の成績用）

```
┌─────────────────────────────┐
│   私の予想成績                 │
│   ━━━━━━━━━━━━━━━━━━         │
│                              │
│       3 位                    │
│      / 8 人中                 │
│                              │
│   ━━━━━━━━━━━━━━━━━━         │
│   累計 24 pt                  │
│   的中率 72%                  │
│   8試合中 6試合的中            │
│                              │
│   ━━━━━━━━━━━━━━━━━━         │
│   一緒に予想しよう →          │
│   wcup-yosou.com              │
└─────────────────────────────┘
```

---

## 3. デザイン指針（共通）

- **縦長 1080 × 1920 px** の解像度で生成（Instagram ストーリー対応）
- 既存ホーム画面の世界観（青基調 `#005BAC` / 日の丸赤 `#E60033` /
  サッカーフィールドの緑 `#0a6e3a`）で統一
- フォントは既存スタイルと同じ（system-ui 系）
- 上部にロゴ・タイトル、中央にメイン情報、下部にCTA（URL or QRコード）
- 背景はヒーローと同じ夜空グラデ＋スタジアム照明アニメ（の静止版）
- すべての要素は **html2canvas で 1 枚の PNG** として書き出せること
- フィールドSVGはオフスクリーンでレンダリングして、画像化のときは小さめに表示

### 3-1. カード共通レイアウト

```jsx
function ShareCard({ title, children, footer }) {
  return (
    <div className="share-card-canvas">
      <div className="share-card-bg">
        {/* 夜空グラデ + 照明 + フィールド */}
      </div>
      <div className="share-card-content">
        <div className="share-card-header">
          <div className="share-card-logo">⚽ W杯予想メーカー</div>
          <div className="share-card-title">{title}</div>
        </div>
        <div className="share-card-main">{children}</div>
        <div className="share-card-footer">
          {footer || (
            <>
              <div className="share-card-url">xiaokoulu-maker.github.io/wcup-yosou</div>
              <div className="share-card-hash">#W杯予想メーカー</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## 4. 実装の流れ

### 4-1. html2canvas のセットアップ

既存の `package.json` に `html2canvas` が無ければ追加:

```bash
npm install --save html2canvas
```

App.jsx の上部で import:
```js
import html2canvas from "html2canvas";
```

### 4-2. オフスクリーンレンダリング用のコンテナ

シェアカードはユーザーの画面には**普段は表示しない**。
画像化のときだけ DOM にレンダリングして、html2canvas で撮影し、
撮影後は DOM から削除する。

```jsx
function generateShareImage(cardJsx) {
  return new Promise((resolve, reject) => {
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "-9999px";  // 画面外
    container.style.top = "0";
    container.style.width = "1080px";
    container.style.height = "1920px";
    document.body.appendChild(container);

    // React 18: createRoot で render
    const root = ReactDOM.createRoot(container);
    root.render(cardJsx);

    // レンダリング完了を待ってから撮影
    setTimeout(async () => {
      try {
        const canvas = await html2canvas(container, {
          width: 1080,
          height: 1920,
          scale: 1,
          backgroundColor: null,
        });
        canvas.toBlob((blob) => {
          root.unmount();
          document.body.removeChild(container);
          resolve(blob);
        }, "image/png");
      } catch (err) {
        root.unmount();
        document.body.removeChild(container);
        reject(err);
      }
    }, 300);
  });
}
```

### 4-3. シェア処理（Web Share API）

生成した画像をシェアする。モバイルブラウザの **Web Share API** を使うと
LINE / X / Instagram などの選択画面が出る。

```js
async function shareCard(cardJsx, fallbackText) {
  try {
    const blob = await generateShareImage(cardJsx);
    const file = new File([blob], "wcup-prediction.png", { type: "image/png" });
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        text: fallbackText,
        url: "https://xiaokoulu-maker.github.io/wcup-yosou/",
      });
    } else {
      // フォールバック: ダウンロードリンクで PNG を保存
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "wcup-prediction.png";
      a.click();
      URL.revokeObjectURL(url);
      alert("画像を保存しました。LINEやXに添付して共有してください。");
    }
  } catch (err) {
    console.error("Share failed:", err);
    alert("シェア機能が使えませんでした。スクリーンショットで共有してください。");
  }
}
```

### 4-4. UI の組み込み

#### A. PgMatches の予想完了モーダル

既存モーダル「もう1試合予想する / 友達を招待 / 閉じる」の「友達を招待」を:

```
[ 📷 予想を画像で投稿 ]   ← 新規（赤・大、優先）
[ 💬 テキストで招待 ]     ← 既存（青・小）
[ 閉じる ]
```

「画像で投稿」を押すと、その試合の `ShareCardMatchPrediction` を生成して
`shareCard()` を呼ぶ。

#### B. PgChampion（優勝予想ページ）

ページ下部に「**📷 優勝予想を画像でシェア**」ボタンを追加。
押すと `ShareCardChampion` を生成してシェア。

#### C. PgRanking（ランキング）

「自分の成績」サマリーの近くに「**📷 成績を画像でシェア**」ボタン。
押すと `ShareCardStats` を生成してシェア。

---

## 5. 実装ステップ（この順で進める）

- **Step 1**: `html2canvas` が package.json に無ければ `npm install --save html2canvas`
- **Step 2**: 共通コンポーネント `ShareCard` を作る（夜空グラデ＋照明＋
  フィールド静止版＋ヘッダー/フッター枠）
- **Step 3**: `generateShareImage()` と `shareCard()` のユーティリティ実装
- **Step 4**: `ShareCardMatchPrediction`（試合予想カード）を作って、
  PgMatches の完了モーダルに「📷 予想を画像で投稿」ボタンを追加
- **Step 5**: `ShareCardChampion`（優勝予想カード）を作って、PgChampion に追加
- **Step 6**: `ShareCardStats`（成績カード）を作って、PgRanking に追加
- **Step 7**: フォールバック動作（PC・古いブラウザで Web Share API が使えない時の
  ダウンロード保存）が動くか確認
- **Step 8**: ビルドが通ることを確認

---

## 6. 細かい注意

- **画像生成中はローディング表示**を出す（生成に1〜2秒かかる）
- **フォント読み込み**: html2canvas はネット越しのフォントをうまく拾えない
  ことがある。system-ui / -apple-system にフォールバックする
- **絵文字**: 🇯🇵 などの国旗絵文字は OS によって見え方が違う。
  問題が出るようなら SVG 国旗（既存の `FlagImg`）を使う
- **html2canvas のサイズ**: 1080×1920 は大きいので、生成に時間がかかる。
  もしモバイル端末で遅すぎる場合は 540×960 でもよい
- **既存ロジックへの干渉禁止**: ShareCard の中で Supabase に書き込んだり、
  state を変更したりしないこと。**読み取り専用の表示コンポーネント**

---

## 7. 完了条件（テスト観点）

- [ ] 試合に予想を入れた直後の完了モーダルに「📷 予想を画像で投稿」ボタンがある
- [ ] ボタンを押すと、画像生成のローディングが出て、数秒後に
      シェアシート（LINE/X 等の選択画面）が開く
- [ ] 生成された画像は縦長で、夜空グラデ＋日本代表カラーで世界観が統一されている
- [ ] 画像内に「予想内容」「ハッシュタグ」「アプリURL」が見える
- [ ] LINE / X に投稿すると、画像つきで投稿される
- [ ] PgChampion / PgRanking でも同様にシェアできる
- [ ] PC（Web Share API 非対応環境）では、画像が PNG としてダウンロードされる
- [ ] 既存の 30 秒フロー・採点・ランキング・チャット等が壊れていない

---

## 8. 実装後

動作確認できたら「優先順位 4 位 完了」と報告してください。
次は優先順位 5 位（試合前リマインド通知 — PWA Push）に進みます。
