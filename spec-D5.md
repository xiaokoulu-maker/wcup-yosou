# 実装仕様書 D5 ｜ 大会チャット画面の侍ブルー化

> このファイルは Claude Code に「読んで実装して」と渡すための仕様書です。
> 既存の `PgChat`（大会内チャット、リアクション、引用返信、予想カード投稿、
> 応援クイック投稿）を `design-reference/` のデザインに沿って侍ブルー基調に
> 置き換えます。

---

## 0. このフェーズの位置づけ

ホーム（D2）、予想（D3）、ランキング（D4）に続いて、**大会チャット**を
新デザインに。チャットはユーザーが何度も戻ってくる場所なので、
ここの世界観統一は体験全体の印象を大きく左右する。

D5 の対象:
- `PgChat`（大会内チャット）
- メッセージバブル、リアクションチップ、長押しメニュー、
  引用返信、予想カード投稿、応援クイック投稿、未読バッジ

「みんなのチャット」（全体チャット）は別画面の場合、同じスタイルを当てる。

---

## 1. 大前提（守ること）

- **既存機能（spec-01〜11、spec-D1〜D4）を一切壊さない**
- 既存の Supabase 購読・送信処理（メッセージ送信、UPDATE 購読、
  リアクション保存）は触らない
- spec-06（リアクション、引用返信、予想カード投稿、未読バッジ）の機能維持
- spec-06b（LINE風長押しメニュー）の動作維持
- spec-09（応援クイック投稿：日本戦時間帯のみ）の機能維持
- メッセージタイプ（通常 / システム / 予想カード / 応援）の区別は維持
- モバイル幅 max 400px

---

## 2. 参照すべきファイル

| ファイル | 用途 |
|---------|------|
| `design-reference/README.md` の `### 6. 大会チャット` セクション | 仕様 |
| `design-reference/chat_badges.jsx` の `ChatScreen` 関数 | 参考実装 |
| `design-reference/screens/05-chat.jpg` | ピクセル基準 |

**重要**: `chat_badges.jsx` を全文読まない。`ChatScreen` を Grep で絞る。

---

## 3. チャット画面の仕様

### 3-1. レイアウト構造（上から順）

1. **ヘッダー**
   - 左に戻るボタン `←`
   - 中央に: 大会名（大）＋ サブ `● 8人オンライン`
   - 右に: 重ねアバター（参加者上位3〜4人を重ねて表示）

2. **応援クイック投稿バー**（spec-09、日本戦時間帯のみ表示）
   - 上ラベル `🇯🇵 応援メッセージを送ろう！`
   - 2×2 グリッドのクイックボタン
   - 既存実装の機能はそのまま、見た目を侍ブルー化

3. **メッセージリスト**（縦スクロール）
   - 種別ごとに見た目を変える:
     - **相手のメッセージ**: 左寄せ、白バブル `bg-white text-text-on-white`
     - **自分のメッセージ**: 右寄せ、**赤バブル** `bg-hinomaru text-white shadow-cta-red`
     - **システム投稿**（spec-06 の試合結果・spec-08 のバッジ獲得）:
       中央寄せ、横長カード、装飾色（金 or 緑）
     - **予想カード投稿**（spec-06 の type: "prediction_card"）:
       金枠カード、対戦＋予想内容を簡潔表示

4. **リアクションチップ**（spec-06b、メッセージバブル直下）
   - 既存リアクションのみ表示（ゼロなら何も出さない）
   - 小さなピル、絵文字＋件数
   - 自分が押したものは強調

5. **長押しメニュー**（spec-06b）
   - 半透明黒オーバーレイ
   - メッセージの上に絵文字バー（4種：👍 😂 🤔 🔥）+ 「返信/コピー」等

6. **入力バー**（画面下に固定）
   - 左に予想カード投稿ボタン（既存の「みんなに見せる」起動）
   - 中央にテキスト入力
   - 右に送信ボタン

### 3-2. 主要 Tailwind クラスの目安

- 画面背景: `bg-navy-base`
- ヘッダー: `bg-navy-700 px-5 py-3 flex items-center gap-3`
- 相手バブル: `bg-white text-text-on-white rounded-2xl rounded-tl-sm px-4 py-2 max-w-[75%]`
- 自分バブル: `bg-hinomaru text-white rounded-2xl rounded-tr-sm px-4 py-2 max-w-[75%] shadow-cta-red`
- システム投稿: `bg-white/5 border border-white/15 rounded-card text-text-on-navy-dim text-center text-sm px-4 py-2 mx-auto`
- 予想カード投稿: `bg-gradient-to-br from-gold/20 to-gold/5 border-2 border-gold rounded-card p-3`
- リアクションチップ（未自分）: `bg-white/10 text-text-on-navy-dim text-xs rounded-full px-2 py-0.5`
- リアクションチップ（自分が押した）: `bg-hinomaru/20 text-hinomaru border border-hinomaru/40 text-xs rounded-full px-2 py-0.5 font-bold`
- 入力バー: `bg-navy-700 border-t border-white/10 px-3 py-2 flex gap-2 items-end`
- 入力欄: `bg-white/10 text-white placeholder-text-on-navy-weak rounded-full px-4 py-2 flex-1`
- 送信ボタン: `bg-hinomaru text-white rounded-full px-4 py-2 font-bold shadow-cta-red`

### 3-3. メッセージバブルの実装

```jsx
function ChatMessage({ message, myId, ...handlers }) {
  const isMine = message.senderId === myId;
  const isSystem = message.type === "system";
  const isPredictionCard = message.type === "prediction_card";

  if (isSystem) {
    return (
      <div className="my-2 mx-5">
        <div className="bg-white/5 border border-white/15 rounded-card text-text-on-navy-dim text-center text-sm px-4 py-2 mx-auto max-w-[90%]">
          {message.text}
        </div>
      </div>
    );
  }

  if (isPredictionCard) {
    return (
      <div className={`my-2 mx-5 flex ${isMine ? "justify-end" : "justify-start"}`}>
        <div className="bg-gradient-to-br from-gold/20 to-gold/5 border-2 border-gold rounded-card p-3 max-w-[80%]">
          <div className="text-xs text-gold font-bold mb-1">📣 {message.senderName} の予想</div>
          {/* 予想内容（既存データ構造から） */}
          <div className="text-text-on-navy">
            {message.matchInfo && (
              <>
                <div className="font-bold">{message.matchInfo.home} vs {message.matchInfo.away}</div>
                <div className="text-sm text-text-on-navy-dim mt-1">→ {formatPick(message.pick)} (+3pt 予定)</div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`my-2 mx-5 flex ${isMine ? "justify-end" : "justify-start"} group`}>
      {/* 相手のアバター（左に小さく） */}
      {!isMine && (
        <div className="w-8 h-8 rounded-full bg-white/10 mr-2 flex items-center justify-center text-sm">
          {message.senderIcon || message.senderName?.[0]}
        </div>
      )}
      <div className="flex flex-col" style={{ maxWidth: "75%" }}>
        {/* 引用返信（spec-06） */}
        {message.replyTo && (
          <div className="border-l-4 border-hinomaru bg-white/5 rounded px-2 py-1 mb-1 text-xs text-text-on-navy-dim">
            <div className="font-bold">{message.replyTo.senderName}</div>
            <div className="truncate">{message.replyTo.preview}</div>
          </div>
        )}
        {/* バブル本体 */}
        <div
          {...longPressHandlers(message.id)}
          className={
            isMine
              ? "bg-hinomaru text-white rounded-2xl rounded-tr-sm px-4 py-2 shadow-cta-red"
              : "bg-white text-text-on-white rounded-2xl rounded-tl-sm px-4 py-2"
          }
        >
          {!isMine && (
            <div className="text-xs text-text-on-white-gray font-bold mb-0.5">{message.senderName}</div>
          )}
          <div className="text-sm whitespace-pre-wrap break-words">{message.text}</div>
        </div>
        {/* 時刻 */}
        <div className={`text-[10px] text-text-on-navy-weak mt-0.5 ${isMine ? "text-right" : "text-left"}`}>
          {formatTime(message.createdAt)}
        </div>
        {/* リアクションチップ（spec-06b、既存リアクションのみ） */}
        <ReactionChips message={message} myId={myId} onToggle={handlers.toggleReaction} />
      </div>
    </div>
  );
}
```

### 3-4. リアクションチップ（spec-06b）

```jsx
function ReactionChips({ message, myId, onToggle }) {
  const reactions = message.reactions || {};
  const entries = Object.entries(reactions).filter(([, ids]) => ids.length > 0);
  if (entries.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {entries.map(([emoji, ids]) => {
        const isMine = ids.includes(myId);
        return (
          <button
            key={emoji}
            onClick={() => onToggle(message.id, emoji)}
            className={
              isMine
                ? "bg-hinomaru/20 text-hinomaru border border-hinomaru/40 text-xs rounded-full px-2 py-0.5 font-bold"
                : "bg-white/10 text-text-on-navy-dim border border-white/10 text-xs rounded-full px-2 py-0.5"
            }
          >
            {emoji} {ids.length}
          </button>
        );
      })}
    </div>
  );
}
```

### 3-5. 長押しメニュー（spec-06b の機能維持）

```jsx
{openReactionMenuFor && (
  <>
    {/* 全画面オーバーレイ */}
    <div
      className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
      onClick={() => setOpenReactionMenuFor(null)}
    />
    {/* 絵文字メニュー */}
    <div className="fixed z-50 bg-white rounded-full shadow-hero px-3 py-2 flex gap-3 animate-wc-pop"
         style={{ /* 位置はメッセージ近くに固定 */ }}>
      {["👍", "😂", "🤔", "🔥"].map(emoji => (
        <button
          key={emoji}
          onClick={() => {
            handlers.toggleReaction(openReactionMenuFor, emoji);
            setOpenReactionMenuFor(null);
          }}
          className="text-2xl active:scale-90 transition"
        >
          {emoji}
        </button>
      ))}
    </div>
  </>
)}
```

### 3-6. 入力バー

```jsx
<div className="sticky bottom-0 bg-navy-700 border-t border-white/10 px-3 py-2 flex gap-2 items-end">
  {/* 予想カード投稿ボタン（spec-06） */}
  <button onClick={openPredictionCardModal}
          className="bg-gold/20 text-gold border border-gold/40 rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
    📣
  </button>
  {/* テキスト入力 */}
  <textarea
    value={input}
    onChange={e => setInput(e.target.value)}
    placeholder="メッセージを入力"
    className="bg-white/10 text-white placeholder-text-on-navy-weak rounded-2xl px-4 py-2 flex-1 resize-none focus:outline-none focus:ring-2 focus:ring-hinomaru/50"
    rows={1}
  />
  {/* 送信 */}
  <button onClick={send} disabled={!input.trim()}
          className="bg-hinomaru text-white rounded-full px-4 py-2 font-bold shadow-cta-red disabled:opacity-50 disabled:shadow-none flex-shrink-0">
    送信
  </button>
</div>
```

---

## 4. 実装ステップ（この順で進める）

- **Step 1**: `design-reference/README.md` の ### 6. 大会チャット セクションと
  `design-reference/chat_badges.jsx` の `ChatScreen` を Grep で読む
- **Step 2**: 既存の `PgChat` を見つけて JSX を新デザインに書き換える
- **Step 3**: ヘッダー（大会名 + オンライン人数 + 重ねアバター）を実装
- **Step 4**: メッセージバブル（自分=赤・右、相手=白・左、system, prediction_card）を実装
- **Step 5**: リアクションチップ（spec-06b、既存リアクションのみ表示）を新デザインに
- **Step 6**: 長押しメニュー（spec-06b）の見た目を侍ブルーに合わせる
- **Step 7**: 引用返信（spec-06）の表示を新デザインに（左赤線のブロック）
- **Step 8**: 応援クイック投稿バー（spec-09）を侍ブルー化
- **Step 9**: 入力バー（予想カード投稿ボタン＋テキスト＋送信）を新デザインに
- **Step 10**: ビルドが通ることを確認
- **Step 11**: **`npm run deploy` で本番に公開**
- **Step 12**: 「実装完了 + デプロイ完了」と報告

---

## 5. 細かい注意

- **既存ロジックの維持**: `sendMessage`, `toggleReaction`, `setReplyTo`,
  `postMatchResultSystemMessage` などは触らない
- **メッセージタイプ判定**: `message.type` で system / prediction_card / cheer / 通常 を判定。
  既存の形式を維持
- **未読バッジ**: ホーム画面（D2）への赤バッジ表示は spec-06 のロジックそのまま
- **Supabase 購読**: INSERT, UPDATE 両方の購読を維持（リアクション更新のため）
- **応援クイック投稿の表示判定**: 日本戦の時間帯（キックオフ1h前〜終了2h後）の
  既存ロジックを維持
- **入力欄の改行**: textarea で複数行入力可、Enter で送信、Shift+Enter で改行（既存挙動を維持）
- **タップフィードバック**: ボタンに `active:scale-[.98]` を当てる

---

## 6. 完了条件（テスト観点）

- [ ] PgChat が新デザインで表示される
  - ヘッダーに大会名、オンライン人数、重ねアバター
- [ ] 自分のメッセージは赤バブル右寄せ、相手は白バブル左寄せ
- [ ] システム投稿（試合結果通知等）が中央寄せで控えめに表示
- [ ] 予想カード投稿が金枠カードで表示
- [ ] リアクションチップが既存リアクションだけ小さく表示される
- [ ] メッセージ長押しで絵文字メニュー（4種）が出る
- [ ] 絵文字をタップするとリアクションがトグル + メニュー閉じる
- [ ] 引用返信が左赤線のブロックで表示
- [ ] 入力バーで予想カード投稿・テキスト送信ができる
- [ ] 日本戦時間帯に応援クイック投稿バーが出る
- [ ] ホーム（D2）、予想（D3）、ランキング（D4）、チャット（D5）が同じ世界観
- [ ] 他画面（日本代表、コインショップ等）は旧デザインのまま動く
- [ ] 既存の spec-01〜11、D1〜D4 機能が壊れていない
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

動作確認できたら「**spec-D5 完了**」と報告してください。

次は **spec-D6（日本代表モード画面の侍ブルー化）** に進みます。
次の日本戦カウントダウン、速報バナー、応援、得点者予想を侍ブルーで仕上げます。
