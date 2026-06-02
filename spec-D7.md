# 実装仕様書 D7 ｜ コインショップ・バッジ画面の侍ブルー化

> このファイルは Claude Code に「読んで実装して」と渡すための仕様書です。
> 既存の `PgCoinShop`（コインショップ）と `PgBadges`（マイ・バッジ）を、
> `design-reference/` のデザインに沿って侍ブルー基調に置き換えます。
>
> どちらも「**自分のアプリ内資産を眺める場所**」なので、達成感と上品さを
> 両立させる設計にします。

---

## 0. このフェーズの位置づけ

ホーム（D2）、予想（D3）、ランキング（D4）、チャット（D5）、日本代表（D6）に続いて、
**個人ステータス系の2画面**を侍ブルー化。

D7 の対象:
- `PgCoinShop`（コインショップ：残高・毎日ログインボーナス・各種無料ミッション・**換金不可の明示**）
- `PgBadges`（マイ・バッジ：獲得済み・未獲得・進捗）

これでデザインフェーズの主要7画面が侍ブルーで揃う。

---

## 1. 大前提（守ること）

- **既存機能（spec-01〜11、spec-D1〜D6）を一切壊さない**
- spec-08 のバッジ機能維持:
  - `BADGES` 定数（16種類）
  - `participant.badges` の構造
  - `checkBadges()` 判定ロジック
- spec-10 のコイン機能維持:
  - `participant.coins.balance` / `totalEarned` / `totalLost`
  - 毎日ログインボーナス（+100コイン）
  - 各種無料ミッション
  - **「換金不可」の明示**（合法性確保のため絶対に維持）
  - 購入機能は実装しない（無料配布のみ）
- 既存の関数シグネチャ・props は維持
- モバイル幅 max 400px

---

## ⚖️ 2. 法律的な絶対遵守事項（spec-10 から継承）

コインショップ画面で**以下を絶対に守ること**:

- 「現実のお金や賞品とは一切交換できません」の表示を**目立つ位置に必ず置く**
- 「購入はできません（無料配布のみ）」の表示を維持
- 「他のプレイヤーへの譲渡はできません」の表示を維持
- 「換金」「ペイアウト」「現金化」「賞金」「景品」という表現は使わない
- 「お金を稼ぐ」「現金が当たる」みたいな誤解を生む表現は使わない
- デザインを侍ブルー化する過程で、この警告表示の視認性を下げないこと

---

## 3. 参照すべきファイル

| ファイル | 用途 |
|---------|------|
| `design-reference/README.md` の `### 8. コインショップ` セクション | コインショップ仕様 |
| `design-reference/README.md` の `### 7. バッジ` セクション | バッジ仕様 |
| `design-reference/japan_share.jsx` の `CoinShopScreen` 関数 | コインショップ参考実装 |
| `design-reference/chat_badges.jsx` の `BadgesScreen` 関数 | バッジ参考実装 |
| `design-reference/screens/` 内の該当 jpg | ピクセル基準 |

**重要**: 各 jsx ファイルを全文読まない。該当関数を Grep で絞る。

---

## 4. コインショップ画面（PgCoinShop）

### 4-1. レイアウト構造（上から順）

1. **ヘッダー**
   - 左に戻るボタン `←`
   - 中央: 「🪙 コインショップ」
   - 右: なし

2. **残高ヘッダーカード**（メインビジュアル）
   - 大きな金枠カード（背景は侍ブルー＋金グラデ）
   - `現在の残高`
   - 巨大なコイン残高（`text-display-lg font-black tabular-nums text-gold`）
   - サブ統計: `累計獲得 X 🪙 / 累計使用 X 🪙`

3. **🚨 換金不可の明示カード**（絶対に外さない）
   - 警告色（赤）でなく、上品な「お知らせ」風の控えめなカード
   - 背景: `bg-white/5 border border-white/15`
   - 内容:
     ```
     🪙 ゲーム内コインについて
     ・現実のお金や賞品とは一切交換できません
     ・購入はできません（無料配布のみ）
     ・他のプレイヤーへの譲渡はできません
     ```

4. **毎日ログインボーナス**（既存ロジック維持）
   - 上ラベル `デイリーボーナス`
   - 大きな金色カード `+100 🪙`
   - 状態:
     - 受取可能 → 「受け取る」赤CTA
     - 受取済み → 「明日また来てね」グレーアウト＋次のリセット時刻
   - 連続ログイン日数表示（あれば）

5. **無料ミッション一覧**
   - 各ミッションを白カード（侍ブルー上に浮かす）でリスト表示
   - 例:
     - `5試合予想する +200🪙`（進捗 3/5、達成で受取ボタン）
     - `10試合予想する +500🪙`
     - `友達を招待する +300🪙`
     - `広告視聴（準備中） +200🪙`（disabled、グレーアウト）
   - 達成状況をプログレスバーで表示

6. **取引履歴**（任意、既存があれば）
   - 直近10件の `transactions` を簡潔リスト

### 4-2. 主要 Tailwind クラスの目安

- 画面背景: `bg-navy-base text-text-on-navy`
- 残高カード: `bg-gradient-to-br from-gold/30 via-gold/15 to-transparent border-2 border-gold rounded-card-lg p-6 mx-5 mt-4 shadow-cta-gold text-center`
- 残高数字: `text-display-lg font-black tabular-nums text-gold`
- 換金不可カード: `bg-white/5 border border-white/15 rounded-card p-4 mx-5 mt-4 text-text-on-navy-dim text-sm`
- デイリーボーナス受取可: `bg-hinomaru text-white font-bold rounded-card py-3 shadow-cta-red`
- デイリーボーナス受取済: `bg-white/10 text-text-on-navy-weak rounded-card py-3 cursor-not-allowed`
- ミッションカード: `bg-white text-text-on-white rounded-card shadow-data-card p-4 mx-5 mt-3`
- プログレスバー: `bg-gray-200 rounded-full h-2` + `bg-hinomaru h-2 rounded-full`（進捗分）

### 4-3. 残高カードの実装例

```jsx
function CoinBalanceCard({ coins }) {
  const balance = coins?.balance || 0;
  const totalEarned = coins?.totalEarned || 0;
  const totalLost = coins?.totalLost || 0;
  return (
    <div className="bg-gradient-to-br from-gold/30 via-gold/15 to-transparent border-2 border-gold rounded-card-lg p-6 mx-5 mt-4 shadow-cta-gold text-center">
      <div className="text-xs text-gold font-bold tracking-widest">現在の残高</div>
      <div className="mt-3 flex items-baseline justify-center gap-1">
        <span className="text-display-lg font-black tabular-nums text-gold">
          {balance.toLocaleString()}
        </span>
        <span className="text-2xl">🪙</span>
      </div>
      <div className="border-t border-white/10 mt-4 pt-3 grid grid-cols-2 gap-2 text-xs text-text-on-navy-dim">
        <div>累計獲得 <span className="text-text-on-navy font-bold">{totalEarned.toLocaleString()}</span></div>
        <div>累計使用 <span className="text-text-on-navy font-bold">{totalLost.toLocaleString()}</span></div>
      </div>
    </div>
  );
}
```

### 4-4. ミッションカードの実装例

```jsx
function MissionCard({ mission }) {
  // mission = { id, title, reward, progress, target, claimed, disabled }
  const isReady = mission.progress >= mission.target && !mission.claimed;
  const isDone = mission.claimed;
  const percent = Math.min(100, Math.floor((mission.progress / mission.target) * 100));

  return (
    <div className={
      mission.disabled
        ? "bg-white/40 text-text-on-white-gray rounded-card shadow-data-card p-4 mx-5 mt-3 opacity-60"
        : "bg-white text-text-on-white rounded-card shadow-data-card p-4 mx-5 mt-3"
    }>
      <div className="flex items-baseline justify-between">
        <div className="font-bold">{mission.title}</div>
        <div className="text-gold font-black tabular-nums">+{mission.reward}🪙</div>
      </div>
      <div className="text-xs text-text-on-white-gray mt-1">
        進捗 {mission.progress}/{mission.target}
      </div>
      <div className="bg-gray-200 rounded-full h-2 mt-2 overflow-hidden">
        <div
          className={isDone ? "bg-success h-2 rounded-full" : "bg-hinomaru h-2 rounded-full"}
          style={{ width: `${percent}%` }}
        />
      </div>
      {isReady && (
        <button onClick={() => mission.onClaim?.()}
                className="w-full bg-hinomaru text-white font-bold rounded-card-lg py-2 mt-3 shadow-cta-red active:scale-[.98]">
          受け取る
        </button>
      )}
      {isDone && (
        <div className="w-full bg-success/10 text-success font-bold rounded-card-lg py-2 mt-3 text-center">
          ✓ 受取済み
        </div>
      )}
      {mission.disabled && (
        <div className="w-full bg-white/40 text-text-on-white-gray rounded-card-lg py-2 mt-3 text-center text-xs">
          準備中
        </div>
      )}
    </div>
  );
}
```

---

## 5. バッジ画面（PgBadges）

### 5-1. レイアウト構造（上から順）

1. **ヘッダー**
   - 左に戻るボタン `←`
   - 中央: 「🏅 マイ・バッジ」

2. **獲得サマリーカード**
   - 大きな数字: `獲得 7 / 16`
   - 進捗バー
   - サブテキスト: `バッジを集めて全国TOPプレイヤーへ`

3. **獲得済みバッジ**（上部に表示）
   - 「獲得済み (7)」セクションタイトル
   - 4列グリッドで小さなバッジ画像（絵文字＋名前）
   - 各バッジは金色のリングや背景で目立つ
   - タップで詳細モーダル（既存があれば活かす）

4. **未獲得バッジ**（下部に表示）
   - 「あと一歩 (3)」セクションタイトル（進捗中のバッジ）
     - 例: 「予想20試合 ⏳ 12/20」
   - 「未獲得 (6)」セクションタイトル
   - グレーアウト＋ロックアイコンで表示

### 5-2. 主要 Tailwind クラスの目安

- 画面背景: `bg-navy-base text-text-on-navy`
- サマリーカード: `bg-gradient-to-br from-gold/20 to-transparent border-2 border-gold rounded-card-lg p-5 mx-5 mt-4`
- 獲得済みバッジセル: `bg-gold/10 border-2 border-gold rounded-card p-3 text-center`
- 進捗中バッジセル: `bg-white/5 border border-white/15 rounded-card p-3 text-center`
- 未獲得バッジセル: `bg-white/5 border border-white/10 rounded-card p-3 text-center opacity-50`

### 5-3. バッジセルの実装例

```jsx
function BadgeCell({ badge, status, progress }) {
  // status: "earned" | "in_progress" | "locked"
  const baseClasses = "rounded-card p-3 text-center transition";
  const variantClasses = {
    earned: "bg-gold/10 border-2 border-gold active:scale-[.95]",
    in_progress: "bg-white/5 border border-white/15 active:scale-[.95]",
    locked: "bg-white/5 border border-white/10 opacity-50",
  }[status];

  return (
    <div className={`${baseClasses} ${variantClasses}`}>
      <div className="text-3xl">
        {status === "locked" ? "🔒" : badge.icon}
      </div>
      <div className={`mt-2 text-xs font-bold ${status === "locked" ? "text-text-on-navy-weak" : "text-text-on-navy"}`}>
        {badge.name}
      </div>
      {status === "in_progress" && progress && (
        <div className="text-[10px] text-text-on-navy-dim mt-1 tabular-nums">
          {progress.current}/{progress.target}
        </div>
      )}
      {status === "earned" && (
        <div className="text-[10px] text-gold mt-1">✓</div>
      )}
    </div>
  );
}
```

### 5-4. バッジ画面の構成例

```jsx
function PgBadges({ participant, ...rest }) {
  const earned = new Set((participant?.badges || []).map(b => b.id));
  const inProgress = []; // 既存の checkBadges 進捗ロジックから抽出
  const locked = []; // BADGES の中で earned でも in_progress でもないもの

  // それぞれを BADGES の中から分類
  const earnedBadges = BADGES.filter(b => earned.has(b.id));
  const lockedBadges = BADGES.filter(b => !earned.has(b.id));

  return (
    <div className="min-h-screen bg-navy-base text-text-on-navy pb-10">
      {/* ヘッダー */}
      <Header title="🏅 マイ・バッジ" onBack={...} />

      {/* サマリーカード */}
      <BadgeSummary earned={earnedBadges.length} total={BADGES.length} />

      {/* 獲得済み */}
      <section className="mt-6 mx-5">
        <h2 className="text-title-sm font-extrabold mb-3">獲得済み ({earnedBadges.length})</h2>
        <div className="grid grid-cols-4 gap-2">
          {earnedBadges.map(b => <BadgeCell key={b.id} badge={b} status="earned" />)}
        </div>
      </section>

      {/* 未獲得 */}
      <section className="mt-6 mx-5">
        <h2 className="text-title-sm font-extrabold mb-3">未獲得 ({lockedBadges.length})</h2>
        <div className="grid grid-cols-4 gap-2">
          {lockedBadges.map(b => <BadgeCell key={b.id} badge={b} status="locked" />)}
        </div>
      </section>
    </div>
  );
}
```

---

## 6. 実装ステップ（この順で進める）

- **Step 1**: `design-reference/README.md` の ### 7. バッジ、 ### 8. コインショップ
  セクションを Grep で読む
- **Step 2**: `design-reference/japan_share.jsx` の `CoinShopScreen` を Grep で読む
- **Step 3**: `design-reference/chat_badges.jsx` の `BadgesScreen` を Grep で読む
- **Step 4**: 既存の `PgCoinShop` を新デザインに書き換え
  - 残高カード（金枠）
  - **換金不可カード**（必ず維持）
  - 毎日ログインボーナス
  - ミッションカード一覧
- **Step 5**: 既存の `PgBadges` を新デザインに書き換え
  - サマリーカード
  - 獲得済みグリッド
  - 未獲得グリッド
- **Step 6**: ビルドが通ることを確認
- **Step 7**: **`npm run deploy` で本番に公開**
- **Step 8**: 「実装完了 + デプロイ完了」と報告

---

## 7. 細かい注意

- **既存ロジックの維持**: `claimDailyBonus`, `claimMissionReward` などの関数は触らない
- **`participant.coins` のフォールバック**: 無いときは `{balance:0, totalEarned:0, totalLost:0}`
- **`participant.badges` のフォールバック**: 無いときは `[]`
- **ミッション一覧の動的構築**: spec-10 で実装したロジックがあれば再利用
- **取引履歴**: あれば表示、無くてもOK
- **タップ遷移**: 残高カードや特定バッジをタップしたら、適切な詳細モーダル or ページへ。
  既存挙動を維持
- **進捗バーの色**: 完了時は緑、進行中は赤（既存予想時の赤と統一）

---

## 8. 完了条件（テスト観点）

- [ ] PgCoinShop が新デザインで表示される
  - 大きな金枠カードに残高
  - **「換金不可」の明示カードが見やすい位置にある**
  - 毎日ログインボーナスのカード
  - 各ミッションのカード（進捗バー付き）
- [ ] PgBadges が新デザインで表示される
  - 獲得サマリー（X/16）
  - 獲得済みバッジが金枠で並ぶ
  - 未獲得バッジがグレーアウトで並ぶ
- [ ] 毎日ログインボーナスの受取が動く
- [ ] 各ミッションの達成判定・受取が動く
- [ ] ホーム（D2）→ コインショップ（D7）→ バッジ（D7）で世界観が揃って見える
- [ ] **換金不可の明示が見やすい場所に必ずある**
- [ ] 既存の spec-01〜11、D1〜D6 機能が壊れていない
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

動作確認できたら「**spec-D7 完了**」と報告してください。

次は **spec-D8（シェアカード磨き込み）** に進みます。
spec-04, spec-11 で実装したシェアカード（試合予想 / 優勝予想 / 統計 / 全国順位）を
ピクセルパーフェクトに磨いて、SNSバイラル拡散の起爆剤にします。
