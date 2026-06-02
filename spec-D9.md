# 実装仕様書 D9 ｜ 結果演出・オンボーディング・空状態の磨き込み

> このファイルは Claude Code に「読んで実装して」と渡すための仕様書です。
> デザインフェーズの**最終総仕上げ**として、以下を実装します：
>
> 1. 日本戦結果の特別演出（spec-09 を侍ブルーで強化、紙吹雪アニメ）
> 2. 初回オンボーディング（新規ユーザーが迷わない30秒導線）
> 3. 空状態の絵柄（データ無いときの「最初の予想を入れよう」誘導）

---

## 0. このフェーズの位置づけ

D2〜D8 で主要画面とシェアカードまで侍ブルー化完了。残るは**ユーザー体験の完成度**。

「アプリ初めて開いた人が迷わず最初の予想を入れる」「日本が勝った瞬間の感情が爆発する」
「データが無いときも次のアクションが分かる」— この3つを仕上げる。

D9 を経たら、デザインフェーズは完了。あとはユーザー実機テストと最終調整のみ。

---

## 1. 大前提（守ること）

- **既存機能（spec-01〜11、spec-D1〜D8）を一切壊さない**
- spec-09 の「日本戦結果演出」のロジック（localStorage 表示済み判定、24時間以内のみ表示）を維持
- 既存のホーム・予想・ランキングなど各画面の機能・遷移を維持
- モバイル幅 max 400px

---

## 2. 参照すべきファイル

| ファイル | 用途 |
|---------|------|
| `design-reference/README.md` の関連セクション | 仕様 |
| `design-reference/shared.jsx` の `keyframes` 周り（`wc-fall`, `wc-pop-big`等） | アニメ |
| `design-reference/japan_share.jsx` の `JapanWinModal` 関数（あれば） | 勝利演出参考 |

**重要**: 各ファイルを全文読まない。該当箇所を Grep で絞る。

---

## 3. 機能1：日本戦結果の特別演出（spec-09 強化）

### 3-1. 勝利時のフルスクリーンモーダル

日本が勝った瞬間（試合結果反映時）に発火:

```
┌────────────────────────────────┐
│  (紙吹雪アニメ、全画面に降る)    │
│                                │
│        🇯🇵                      │
│                                │
│   日本勝利！！                  │
│                                │
│   🇯🇵 日本 2-1 🇩🇪 ドイツ        │
│                                │
│   ⚽ あなたの予想:               │
│     ✅ 勝敗的中 +3pt            │
│     ✅ 得点者的中 +5pt          │
│   合計 +8pt 獲得                │
│                                │
│   [ 📷 結果をシェア → ]          │
│   [ 閉じる ]                    │
└────────────────────────────────┘
```

### 3-2. 紙吹雪 CSS アニメーション

`tailwind.config.js` に既に `wc-fall` を定義済み（D1で導入）。これを使う:

```jsx
function ConfettiOverlay() {
  // 30〜50個の紙吹雪を生成
  const pieces = Array.from({ length: 40 }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 3 + Math.random() * 2,
    color: ["#E60033", "#F4B400", "#FFFFFF", "#0a1f4c"][Math.floor(Math.random() * 4)],
    size: 8 + Math.random() * 8,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden">
      {pieces.map((p, i) => (
        <div
          key={i}
          className="absolute animate-wc-fall"
          style={{
            left: `${p.left}%`,
            top: "-20px",
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
```

### 3-3. 勝利モーダルの実装

```jsx
function JapanWinModal({ match, myPrediction, scoring, onShare, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-navy-hero/95 backdrop-blur flex items-center justify-center px-5">
      <ConfettiOverlay />
      <div className="relative w-full max-w-sm bg-gradient-to-b from-navy-hero to-navy-base
                      border-2 border-gold rounded-card-lg p-8 text-center text-text-on-navy
                      shadow-hero animate-wc-pop-big">
        <div className="text-6xl mb-4 animate-wc-glow">🇯🇵</div>
        <div className="text-display font-black text-gold mb-3">日本勝利！！</div>
        <div className="text-xl mb-6">
          🇯🇵 日本 <span className="text-3xl font-black">{match.homeScore}-{match.awayScore}</span> {match.opponent}
        </div>
        {/* 自分の予想結果 */}
        {myPrediction && (
          <div className="bg-white/5 border border-white/10 rounded-card p-4 mb-6">
            <div className="text-sm text-text-on-navy-dim mb-2">⚽ あなたの予想</div>
            {scoring.outcomeHit && (
              <div className="text-green-300 text-sm">✅ 勝敗的中 +3pt</div>
            )}
            {scoring.scorerHit && (
              <div className="text-green-300 text-sm">✅ 得点者的中 +5pt</div>
            )}
            <div className="border-t border-white/10 mt-2 pt-2 text-gold font-black text-xl">
              合計 +{scoring.totalPoints}pt 獲得
            </div>
          </div>
        )}
        <button
          onClick={onShare}
          className="w-full bg-hinomaru rounded-card-lg shadow-cta-red py-3 font-bold mb-2 active:scale-[.98]"
        >
          📷 結果をシェア →
        </button>
        <button onClick={onClose} className="text-text-on-navy-dim text-sm py-2">
          閉じる
        </button>
      </div>
    </div>
  );
}
```

### 3-4. 敗北時のモーダル（控えめ）

```jsx
function JapanLossModal({ match, myPrediction, scoring, nextMatch, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-navy-hero/95 backdrop-blur flex items-center justify-center px-5">
      <div className="w-full max-w-sm bg-navy-base border border-white/15 rounded-card-lg p-8 text-center text-text-on-navy shadow-hero animate-wc-rise">
        <div className="text-5xl mb-3">🇯🇵</div>
        <div className="text-title font-extrabold mb-3">惜しかった…</div>
        <div className="text-lg mb-5">
          🇯🇵 日本 <span className="text-2xl font-black">{match.homeScore}-{match.awayScore}</span> {match.opponent}
        </div>
        <div className="text-text-on-navy-dim text-sm mb-6">
          次の試合に期待！
        </div>
        {nextMatch && (
          <div className="bg-white/5 border border-white/10 rounded-card p-3 mb-5 text-sm">
            <div className="text-text-on-navy-dim">次の日本戦</div>
            <div className="font-bold mt-1">
              {formatDateJP(nextMatch.kickoff)} vs {opponentName(nextMatch)}
            </div>
          </div>
        )}
        <button onClick={onClose} className="bg-white/10 border border-white/20 rounded-card-lg py-3 px-6 font-bold">
          閉じる
        </button>
      </div>
    </div>
  );
}
```

### 3-5. 表示制御（spec-09 のロジック維持）

- `localStorage` で `wcup_japanResultShown_<matchId>` を見て、表示済みなら出さない
- 試合終了から24時間以内のみ表示
- 一度閉じたら再表示しない

---

## 4. 機能2：初回オンボーディング

### 4-1. 表示判定

`localStorage` に `wcup_onboardingDone` が無ければ初回起動と判断、表示する。
スキップボタンで「もう表示しない」フラグを立てる。

### 4-2. 構成（3ステップ）

```
ステップ1: ようこそ
┌────────────────────────────────┐
│ (夜のスタジアム背景)             │
│                                │
│      🌟                         │
│                                │
│   W杯 2026                      │
│   予想メーカー                   │
│                                │
│   北中米3カ国共催・48ヶ国         │
│                                │
│   友達と予想して、                │
│   一緒に W杯を楽しもう！         │
│                                │
│   ● ○ ○ (インジケーター)         │
│                                │
│   [ 次へ → ]                    │
│   スキップ                       │
└────────────────────────────────┘

ステップ2: 予想方法
┌────────────────────────────────┐
│                                │
│   ⚽                            │
│                                │
│   勝敗を予想するだけ              │
│                                │
│   各試合の勝敗を選ぶだけ。        │
│   当たれば +3pt、                │
│   日本戦の得点者まで当たれば +5pt │
│                                │
│   ○ ● ○                         │
│                                │
│   [ 次へ → ]                    │
│   スキップ                       │
└────────────────────────────────┘

ステップ3: 始めよう
┌────────────────────────────────┐
│                                │
│   🏆                            │
│                                │
│   友達と大会を作って、           │
│   ランキングで競おう！           │
│                                │
│   一人でも遊べるよ。              │
│                                │
│   ○ ○ ●                         │
│                                │
│   [ 🏆 友達と大会を作る ]       │ ← 赤CTA
│   [ 👤 ひとりで予想を始める ]   │ ← ゴーストCTA
└────────────────────────────────┘
```

### 4-3. 実装ガイドライン

```jsx
function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const steps = [
    {
      icon: "🌟",
      title: "W杯 2026 予想メーカー",
      desc: "北中米3カ国共催・48ヶ国\n\n友達と予想して、\n一緒に W杯を楽しもう！",
    },
    {
      icon: "⚽",
      title: "勝敗を予想するだけ",
      desc: "各試合の勝敗を選ぶだけ。\n当たれば +3pt、\n日本戦の得点者まで当たれば +5pt",
    },
    {
      icon: "🏆",
      title: "友達と大会を作って、\nランキングで競おう！",
      desc: "一人でも遊べるよ。",
    },
  ];
  const isLast = step === steps.length - 1;
  const current = steps[step];

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-b from-navy-hero via-navy-base to-navy-700 flex flex-col text-text-on-navy">
      {/* ヘロ装飾（背景に星やライト） */}
      <HeroDecoration />
      <div className="flex-1 flex flex-col justify-center items-center px-8 text-center">
        <div className="text-7xl mb-6">{current.icon}</div>
        <h1 className="text-display-sm font-black mb-4 whitespace-pre-wrap">{current.title}</h1>
        <p className="text-text-on-navy-dim whitespace-pre-wrap">{current.desc}</p>
      </div>
      {/* ステップインジケーター */}
      <div className="flex justify-center gap-2 pb-4">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition ${
              i === step ? "w-6 bg-hinomaru" : "w-2 bg-white/30"
            }`}
          />
        ))}
      </div>
      {/* CTAs */}
      <div className="px-5 pb-8">
        {isLast ? (
          <>
            <button
              onClick={() => onComplete("create")}
              className="w-full bg-hinomaru text-white rounded-card-lg shadow-cta-red py-3 font-bold mb-2 active:scale-[.98]"
            >
              🏆 友達と大会を作る
            </button>
            <button
              onClick={() => onComplete("solo")}
              className="w-full border border-white/30 text-white rounded-card-lg py-3 font-bold"
            >
              👤 ひとりで予想を始める
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setStep(step + 1)}
              className="w-full bg-hinomaru text-white rounded-card-lg shadow-cta-red py-3 font-bold mb-2 active:scale-[.98]"
            >
              次へ →
            </button>
            <button
              onClick={() => onComplete("skip")}
              className="w-full text-text-on-navy-dim py-2 text-sm"
            >
              スキップ
            </button>
          </>
        )}
      </div>
    </div>
  );
}
```

### 4-4. アプリへの統合

```jsx
function App() {
  const [onboardingDone, setOnboardingDone] = useState(
    () => !!localStorage.getItem("wcup_onboardingDone")
  );

  const handleOnboardingComplete = (action) => {
    localStorage.setItem("wcup_onboardingDone", "true");
    setOnboardingDone(true);
    if (action === "create") nav("create");
    else if (action === "solo") nav("matches"); // 1人モード起動
    // skip は何もしない（ホームに戻る）
  };

  if (!onboardingDone) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }
  // 通常のアプリ
  return <MainApp />;
}
```

---

## 5. 機能3：空状態の絵柄

### 5-1. 各画面の空状態を整える

下記の画面で「データが無いとき」に専用 UI を出す:

#### 試合予想画面（予想ゼロ件）

```
┌────────────────────────────────┐
│                                │
│         ⚽                      │
│                                │
│   まだ予想を入れていません       │
│                                │
│   次の試合から予想を始めよう！   │
│                                │
│   [ ⚽ 次の試合を予想する → ]   │
└────────────────────────────────┘
```

#### ランキング（参加者0〜1人）

```
┌────────────────────────────────┐
│                                │
│         👥                      │
│                                │
│   まだランキングに参加者が       │
│   いません                      │
│                                │
│   友達を招待してランキングを     │
│   盛り上げよう！                │
│                                │
│   [ 📲 友達を招待する ]         │
└────────────────────────────────┘
```

#### 全国ランキング（自分が圏外、0pt）

```
┌────────────────────────────────┐
│                                │
│         🌐                      │
│                                │
│   あなたは全国ランキングに       │
│   まだ入っていません            │
│                                │
│   最初の予想を入れて、          │
│   全国ランキングに登場！         │
│                                │
│   [ ⚽ 予想する → ]             │
└────────────────────────────────┘
```

#### バッジ（獲得0個）

```
┌────────────────────────────────┐
│                                │
│         🏅                      │
│                                │
│   まだバッジを獲得していません   │
│                                │
│   最初の予想を入れて            │
│   「🎯 予想デビュー」を獲得しよう！│
│                                │
│   [ ⚽ 予想する → ]             │
└────────────────────────────────┘
```

#### チャット（メッセージ0件）

```
┌────────────────────────────────┐
│                                │
│         💬                      │
│                                │
│   まだメッセージはありません     │
│                                │
│   最初のメッセージを送って       │
│   みんなと盛り上がろう！         │
└────────────────────────────────┘
```

### 5-2. 実装ガイドライン

共通の `EmptyState` コンポーネントを作る:

```jsx
function EmptyState({ icon, title, description, cta, onCtaClick }) {
  return (
    <div className="flex flex-col items-center justify-center px-8 py-16 text-center text-text-on-navy">
      <div className="text-6xl mb-4 opacity-50">{icon}</div>
      <div className="text-title font-extrabold mb-3">{title}</div>
      <p className="text-text-on-navy-dim mb-6">{description}</p>
      {cta && (
        <button
          onClick={onCtaClick}
          className="bg-hinomaru text-white rounded-card-lg shadow-cta-red py-3 px-6 font-bold active:scale-[.98]"
        >
          {cta}
        </button>
      )}
    </div>
  );
}
```

各画面で「データ無し判定」をして、無ければ `EmptyState` を表示する形に差し替える。

---

## 6. 実装ステップ（この順で進める）

### Phase A: 日本戦結果演出
- **Step A1**: `ConfettiOverlay`（紙吹雪）コンポーネントを実装
- **Step A2**: `JapanWinModal`（勝利）と `JapanLossModal`（敗北）を実装
- **Step A3**: spec-09 の表示制御ロジック（localStorage 判定）と統合
- **Step A4**: 動作確認（実際の試合結果は無くても、デバッグ用にダミーで発火確認）

### Phase B: 初回オンボーディング
- **Step B1**: `Onboarding` コンポーネントを実装（3ステップ）
- **Step B2**: `App` コンポーネントで `wcup_onboardingDone` フラグを判定して表示制御
- **Step B3**: 「友達と大会を作る」「ひとりで予想を始める」「スキップ」の各動作確認
- **Step B4**: 一度完了したら再表示されないこと、`localStorage` 削除で再表示されることを確認

### Phase C: 空状態
- **Step C1**: 共通 `EmptyState` コンポーネントを実装
- **Step C2**: 試合予想・ランキング・全国ランキング・バッジ・チャット の各空状態を実装
- **Step C3**: それぞれの「データ無し」判定を入れて、空状態 UI を出す

### 最終
- **Step Final**: ビルドが通ることを確認
- **Step Final**: **`npm run deploy` で本番に公開**
- **Step Final**: 「実装完了 + デプロイ完了」と報告

---

## 7. 細かい注意

- **オンボーディングは必ず最初に出る**: ルートで `wcup_onboardingDone` を見て、無ければ
  Onboarding コンポーネントを返す。これより手前で他の画面が出ないこと
- **既存ユーザーへの影響**: `wcup_onboardingDone` が無い状態だと既存ユーザーにも
  オンボが出てしまう。これを避けるなら、`localStorage.getItem("myId")` が既にあれば
  既存ユーザーとみなして自動でスキップする条件を追加
- **紙吹雪の負荷**: 40個程度に抑える。100個以上は端末によって重くなる
- **モーダルの z-index**: 紙吹雪は `z-[60]`、モーダル本体は `z-50`、その他 UI より上
- **空状態の判定**: `participants.length === 0` でなく、「自分以外がゼロ」で判定する
  ケースもある（自分1人だけのとき）。各画面で適切な判定を
- **オンボのスキップ動作**: 「スキップ」「ひとりで予想を始める」「友達と大会を作る」のいずれも
  `wcup_onboardingDone` を立てて、二度と表示されないこと

---

## 8. 完了条件（テスト観点）

### 日本戦結果演出
- [ ] `JapanWinModal` が紙吹雪付きで美しく表示される（デバッグ用に呼び出して確認）
- [ ] `JapanLossModal` が控えめなトーンで表示される
- [ ] 一度閉じたら再表示されない（localStorage 制御）

### オンボーディング
- [ ] 初回起動でオンボーディングが表示される
- [ ] 3ステップを進める/戻れる
- [ ] 「スキップ」「友達と大会を作る」「ひとりで予想を始める」が動く
- [ ] 完了後、次回起動時には表示されない
- [ ] 既存ユーザー（myId あり）には自動でスキップされる

### 空状態
- [ ] 試合予想画面で予想ゼロのとき空状態が出る
- [ ] ランキング画面で参加者1人のとき空状態が出る
- [ ] 全国ランキングで圏外のとき空状態が出る
- [ ] バッジ画面でゼロ獲得のとき空状態が出る
- [ ] チャットでメッセージゼロのとき空状態が出る

### 全体
- [ ] 既存機能（spec-01〜11、D1〜D8）が壊れていない
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

動作確認できたら「**spec-D9 完了 / デザインフェーズ完了**」と報告してください。

これで:
- **機能フェーズ**（spec-01〜11）: 完了
- **デザインフェーズ**（spec-D1〜D9）: 完了

アプリは **W杯本番（2026年6月11日）に間に合う完成形** になります。
あとは実機テスト、家族・友達へのβテスト、本番直前の細かい調整のみ。
