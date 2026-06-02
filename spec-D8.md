# 実装仕様書 D8 ｜ シェアカード磨き込み

> このファイルは Claude Code に「読んで実装して」と渡すための仕様書です。
> spec-04 で実装した予想カード・優勝予想・統計カード、spec-11 で実装した
> 全国順位カードを `design-reference/` の世界観に沿って磨き上げます。
>
> **このアプリのバイラル拡散の起爆剤**となる画面なので、ピクセル単位で
> 「友達に見せたくなる絵面」を作ります。

---

## 0. このフェーズの位置づけ

ホーム、予想、ランキング、チャット、日本代表、コインショップ、バッジ画面まで
侍ブルー化完了。残る磨き込みポイントの中で最も重要なのが**シェアカード**。

シェアカードはユーザーが LINE・X・Instagram に画像で投稿する SNS バイラルの起爆剤。
1枚の画像で「**W杯 2026 予想メーカー**」のブランディングが伝わり、
かつ「これ俺たちのアプリだ！」と日本ファンに刺さる絵面にする。

D8 の対象（spec-04, spec-11 で実装済みのシェアカード群）:
- `ShareCardMatchPrediction`（試合予想カード）
- `ShareCardChampion`（優勝予想カード）
- `ShareCardStats`（自分の統計カード）
- `ShareCardGlobalRank`（全国順位カード、spec-11）
- 任意で追加: `ShareCardBadgeEarned`（バッジ獲得カード）、
  `ShareCardJapanWin`（日本戦勝利カード）

---

## 1. 大前提（守ること）

- **既存機能（spec-01〜11、spec-D1〜D7）を一切壊さない**
- spec-04 の機能維持:
  - `html2canvas` での画像化
  - Web Share API（LINE/X/Instagram 投稿）
  - off-screen 配置（`visibility:hidden` でなく画面外配置）
  - useCORS, setTimeout 等のレンダリング対策
- spec-11 の `ShareCardGlobalRank` の機能維持
- カードのアスペクト比は **縦長 1080×1920**（9:16、SNSストーリー向け）
- DOM 上の **off-screen 配置**（画面外、`position: absolute; top: -9999px; left: -9999px;` 等）
- レンダー時に CSS 変数や Tailwind が解釈されること（既に動いてるので問題なし）
- モバイル幅 max 400px（実画面で見るプレビューはこのサイズ）

---

## 2. 参照すべきファイル

| ファイル | 用途 |
|---------|------|
| `design-reference/README.md` の `### 10. シェアカード` セクション | 仕様 |
| `design-reference/japan_share.jsx` の `ShareCard*` 関数 | 参考実装 |
| `design-reference/screens/` 内の該当 jpg | ピクセル基準 |

**重要**: `japan_share.jsx` を全文読まない。各 `ShareCard` 関数を Grep で絞る。

---

## 3. 全シェアカード共通の世界観

### 3-1. 統一フォーマット

```
┌────────────────────────────────┐
│ [侍ブルーグラデの上半分]        │
│   FIFA WORLD CUP 2026 (小)      │
│   北中米3カ国共催 (極小)         │
│                                │
│   [カードごとのメイン演出]       │
│                                │
│   [メインの主役情報]            │
│   （対戦カード / 順位 / バッジ等） │
│                                │
│   [カードごとのサブ情報]         │
│                                │
├────────────────────────────────┤
│ [白〜薄ネイビーの下半分]         │
│                                │
│   [統計や数字の領域]            │
│   （得点 / 連勝 / 的中率 等）    │
│                                │
│   ─────────                    │
│   W杯 2026 予想メーカー          │
│   xiaokoulu-maker.github.io/    │
│   wcup-yosou                    │
└────────────────────────────────┘
```

### 3-2. 共通カラー

- 上部背景: `linear-gradient(180deg, #061533, #0a1f4c, #0d2a5e)`
- 下部背景: 薄ネイビー `#f0f4fa` or 白
- 主役カラー（カード別）:
  - 試合予想 → 赤 `#E60033`（CTAと同じ熱量）
  - 優勝予想 → 金 `#F4B400`（栄冠感）
  - 統計 → 青系（クール感）
  - 全国順位 → 金または赤（順位による）
- アクセント: 金 `#F4B400`、白
- フォント: Noto Sans JP（既に設定済み）

### 3-3. 共通フッター

すべてのカード下部に以下を表示:
```
─────────────────────
W杯 2026 予想メーカー
xiaokoulu-maker.github.io/wcup-yosou
```

絵文字や小さなロゴ的なアクセント可。ブランディング統一が目的。

---

## 4. 各カードの仕様

### 4-1. `ShareCardMatchPrediction`（試合予想カード）

```
┌────────────────────────────────┐
│ FIFA WORLD CUP 2026             │
│ 北中米3カ国共催                  │
│                                │
│   グループC 第1節                │
│                                │
│   🇯🇵 日本    VS    🇩🇪 ドイツ  │
│                                │
│   俺の予想 → ✅ 日本勝ち         │
│   (+3pt 予定)                   │
│                                │
│   6/16 (火) 22:00 KO             │
├────────────────────────────────┤
│   俺の現在の戦績                 │
│   累計 24 pt / 順位 3位          │
│                                │
│   ─────────                    │
│   W杯 2026 予想メーカー          │
│   xiaokoulu-maker.github.io/    │
│   wcup-yosou                    │
└────────────────────────────────┘
```

### 4-2. `ShareCardChampion`（優勝予想カード）

```
┌────────────────────────────────┐
│ FIFA WORLD CUP 2026             │
│                                │
│   俺の優勝予想は…               │
│                                │
│   🏆 (金色のトロフィー演出)      │
│                                │
│   🇧🇷 ブラジル                  │
│                                │
│   準V: 🇫🇷 フランス              │
│   3位: 🇪🇸 スペイン              │
├────────────────────────────────┤
│   ─────────                    │
│   W杯 2026 予想メーカー          │
│   xiaokoulu-maker.github.io/    │
│   wcup-yosou                    │
└────────────────────────────────┘
```

### 4-3. `ShareCardStats`（自分の統計カード）

```
┌────────────────────────────────┐
│ FIFA WORLD CUP 2026             │
│                                │
│   [陸] さんの戦績                │
│                                │
│   累計                           │
│   24 pt                         │
│                                │
│   8試合中 6試合的中              │
│   的中率 75%                     │
├────────────────────────────────┤
│   🔥 連続的中 3                  │
│   🏅 獲得バッジ 7                │
│   🪙 コイン 1,240                │
│                                │
│   ─────────                    │
│   W杯 2026 予想メーカー          │
│   xiaokoulu-maker.github.io/    │
│   wcup-yosou                    │
└────────────────────────────────┘
```

### 4-4. `ShareCardGlobalRank`（全国順位カード、spec-11）

```
┌────────────────────────────────┐
│ FIFA WORLD CUP 2026             │
│                                │
│   俺の全国順位                   │
│                                │
│   #312 位                        │
│   / 4,521 人中                   │
│                                │
│   (順位を大きく金色で)            │
├────────────────────────────────┤
│   累計 24 pt                    │
│   8試合中 6試合的中              │
│                                │
│   友達と全国上位を目指そう       │
│                                │
│   ─────────                    │
│   W杯 2026 予想メーカー          │
│   xiaokoulu-maker.github.io/    │
│   wcup-yosou                    │
└────────────────────────────────┘
```

### 4-5. 任意で追加: `ShareCardBadgeEarned`（バッジ獲得カード）

新規バッジ獲得時に発火できるカード:

```
┌────────────────────────────────┐
│ FIFA WORLD CUP 2026             │
│                                │
│   🎉 NEW BADGE 🎉                │
│                                │
│   (大きなバッジアイコン)          │
│   🔥                            │
│                                │
│   3連的中                        │
│   連続で3試合当てた               │
├────────────────────────────────┤
│   [陸] さんの戦績                │
│   獲得バッジ 7/16                │
│                                │
│   ─────────                    │
│   W杯 2026 予想メーカー          │
│   xiaokoulu-maker.github.io/    │
│   wcup-yosou                    │
└────────────────────────────────┘
```

### 4-6. 任意で追加: `ShareCardJapanWin`（日本戦勝利カード）

日本戦勝利時の特別な祝福カード:

```
┌────────────────────────────────┐
│ FIFA WORLD CUP 2026             │
│                                │
│   🇯🇵 日本勝利！！                │
│                                │
│   (紙吹雪・国旗演出)              │
│                                │
│   🇯🇵 日本 2-1 🇩🇪 ドイツ        │
│                                │
│   俺の予想:                     │
│   ✅ 勝敗的中 +3pt              │
│   ✅ 得点者的中 +5pt            │
│   合計 +8pt                     │
├────────────────────────────────┤
│   日本ファンとして…             │
│   この瞬間を忘れない             │
│                                │
│   ─────────                    │
│   W杯 2026 予想メーカー          │
│   xiaokoulu-maker.github.io/    │
│   wcup-yosou                    │
└────────────────────────────────┘
```

---

## 5. 各カードの実装ガイドライン

### 5-1. 全カード共通の構造

```jsx
function ShareCardBase({ children }) {
  return (
    <div
      style={{
        width: "1080px",
        height: "1920px",
        position: "absolute",
        top: "-9999px",
        left: "-9999px",
        // ↑ off-screen 配置（visibility:hidden だと真っ白になる既知の問題）
        fontFamily: '"Noto Sans JP", system-ui, sans-serif',
      }}
      id="share-card-root"
    >
      {/* 上半分: 侍ブルーグラデ */}
      <div
        style={{
          height: "1280px",
          background: "linear-gradient(180deg, #061533 0%, #0a1f4c 50%, #0d2a5e 100%)",
          color: "white",
          padding: "80px 80px 0",
          position: "relative",
        }}
      >
        {/* 共通ヘッダー */}
        <div style={{ fontSize: "32px", letterSpacing: "8px", fontWeight: 700, opacity: 0.8 }}>
          FIFA WORLD CUP 2026
        </div>
        <div style={{ fontSize: "20px", color: "#C9D6EC", marginTop: "8px" }}>
          北中米3カ国共催・史上初の48カ国
        </div>
        {children.top}
      </div>
      {/* 下半分: 白系背景 */}
      <div
        style={{
          height: "640px",
          background: "#f0f4fa",
          color: "#0a1f4c",
          padding: "80px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        {children.bottom}
        {/* 共通フッター */}
        <div style={{ textAlign: "center", paddingTop: "40px", borderTop: "2px solid #C9D6EC" }}>
          <div style={{ fontSize: "32px", fontWeight: 900, color: "#0a1f4c" }}>
            W杯 2026 予想メーカー
          </div>
          <div style={{ fontSize: "20px", color: "#5B6B85", marginTop: "8px" }}>
            xiaokoulu-maker.github.io/wcup-yosou
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 5-2. 既存ロジックとの統合

```jsx
// 既存の onClick から呼び出される関数（spec-04 の仕組み）
async function generateShareImage(cardRefId) {
  const node = document.getElementById(cardRefId);
  if (!node) return;
  const canvas = await html2canvas(node, {
    useCORS: true,
    backgroundColor: "#061533",
    width: 1080,
    height: 1920,
    scale: 1,
  });
  // 既存の処理: Web Share API or download
  // ...
}
```

既存の `html2canvas` 呼び出しはそのまま、レンダリング先の DOM だけ新デザインに置き換える。

---

## 6. 実装ステップ（この順で進める）

- **Step 1**: `design-reference/README.md` の ### 10. シェアカード セクションを Grep で読む
- **Step 2**: `design-reference/japan_share.jsx` の `ShareCard*` 関数を Grep で絞って読む
- **Step 3**: 既存の `ShareCardMatchPrediction` を新デザインに書き換え
- **Step 4**: 既存の `ShareCardChampion` を新デザインに書き換え
- **Step 5**: 既存の `ShareCardStats` を新デザインに書き換え
- **Step 6**: 既存の `ShareCardGlobalRank`（spec-11）を新デザインに書き換え
- **Step 7**: ローカルで実際にシェアボタンを押して、画像が生成されることを確認
- **Step 8**: 生成された画像が侍ブルー基調で、フッター統一されていることを確認
- **Step 9**: ビルドが通ることを確認
- **Step 10**: **`npm run deploy` で本番に公開**
- **Step 11**: 「実装完了 + デプロイ完了」と報告

任意（時間があれば）:
- **Step A**: `ShareCardBadgeEarned`（バッジ獲得カード）を新規追加
- **Step B**: `ShareCardJapanWin`（日本戦勝利カード）を新規追加

---

## 7. 細かい注意

- **html2canvas の制約**:
  - 一部の Tailwind クラス（特に CSS 変数の解決が遅いもの）は効かない場合がある
  - 確実に効かせたい色・サイズは inline style で指定する方が安全
  - グラデーション、box-shadow、border-radius は基本的に効く
- **絵文字の表示**: `🇯🇵 🇩🇪 🏆` 等は html2canvas で問題なくレンダーされる
- **CORS**: 外部画像（FlagImg 等）を使う場合は `useCORS: true` を継続
- **アスペクト比**: 1080×1920 を固定。スマホでプレビューする時は CSS で `transform: scale(0.35)` 等で縮小表示
- **既存のシェアボタンの位置・挙動は維持**: ボタンを押したら生成・共有のフローはそのまま
- **off-screen 配置**: 必ず `position: absolute; top: -9999px; left: -9999px;` を維持。
  `visibility: hidden` は **html2canvas が真っ白を返す既知のバグ** あり、絶対に使わない
- **スマホでの表示テスト**: デプロイ後、実機で実際にシェアして画像が綺麗に保存されるか確認

---

## 8. 完了条件（テスト観点）

- [ ] `ShareCardMatchPrediction` が新デザイン（上半分侍ブルー、下半分白、共通フッター）
- [ ] `ShareCardChampion` が新デザイン
- [ ] `ShareCardStats` が新デザイン
- [ ] `ShareCardGlobalRank` が新デザイン（spec-11）
- [ ] 各カードのシェアボタンが動き、画像が綺麗に生成される
- [ ] 生成された画像に「W杯 2026 予想メーカー」と URL が必ず入っている
- [ ] LINE/X で実際にシェアしたとき、画像が崩れない
- [ ] アスペクト比 1080×1920（縦長）が維持されている
- [ ] 既存の html2canvas 周りのロジック（off-screen 配置、useCORS、setTimeout）が壊れていない
- [ ] 既存の spec-01〜11、D1〜D7 機能が壊れていない
- [ ] **ビルドが通り、本番に自動デプロイされている**

---

## 9. 自動デプロイの指示

Claude Code への指示として、**実装完了後に以下を自動実行する**:

1. `npm run build` でビルド確認
2. ビルドが通ったら `npm run deploy` で本番公開
3. 「実装完了 + デプロイ完了」と報告

ビルドが失敗した場合は、そこで止まって原因を報告すること（デプロイには進まない）。

---

## 10. 実装後

動作確認できたら「**spec-D8 完了**」と報告してください。

次は **spec-D9（結果演出・オンボーディング・細部の磨き込み）** に進みます。
日本戦勝利演出、紙吹雪アニメ、初回起動オンボーディング、空状態の絵柄など、
細かい磨き込みを総仕上げします。
