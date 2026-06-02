# 実装仕様書 06b ｜ リアクションUIをLINE風に変更

> このファイルは Claude Code に「読んで実装して」と渡すための仕様書です。
> spec-06 で実装したチャットのリアクションボタンを、常時4個並び表示から
> LINE風の「長押しでメニュー、既存リアクションは小さく表示」に変更します。

---

## 0. この機能の狙い

spec-06 で実装したリアクションボタンが「常時4個並び」だと:

- チャット画面が情報過多で散らかる
- 長文メッセージのとき、ボタンとバブルが横並びになってレイアウトが崩れる
- 「押すぞ」と決めたとき以外は邪魔

これを LINE / iMessage / Discord で確立された UX に直して、
**普段はクリーン、押したい時だけ出現**にする。

---

## 1. 大前提（守ること）

- **既存のリアクション機能（spec-06）のロジック**（`toggleReaction`、Supabase 保存、
  リアルタイム購読、`reactions` フィールド構造）は維持する。
- **見た目だけ変える**。データ構造とイベントの流れは触らない。
- 既存機能（spec-01〜06）を壊さない。
- モバイル幅 max 480px で破綻しないこと。

---

## 2. 新しい UI 仕様

### 2-1. 普段の表示（リアクションが1つも無いメッセージ）

```
[メッセージバブル]  22:32  ⚽
```

メッセージ・時刻・アイコンの1行のみ。リアクションボタンは**何も表示しない**。

### 2-2. リアクションが既に押されているメッセージ

メッセージバブル直下に、**押された絵文字 + 件数の小さなチップ**だけを横並びで表示。

```
[メッセージバブル]  22:32  ⚽
👍 2   😂 1
```

- 押されていない絵文字（🤔, 🔥）は表示しない
- 自分が押した絵文字は**色付きで強調**（既存の active スタイル流用）
- このチップ自体もタップ可能。タップで自分の ON/OFF を切り替える
- 全員の合計件数を表示（誰が押したかの一覧は今回出さない）

### 2-3. 新しいリアクションを追加するとき（長押し）

メッセージバブル（または既存チップ群でも可）を**長押し**すると、
**フローティングのリアクションメニュー**がポップアップで出現:

```
┌──────────────────────────┐
│  👍   😂   🤔   🔥        │  ← 4種のリアクション、大きめタップ領域
└──────────────────────────┘
       ▲（バブルから生えてる感じ）
```

- メニューは画面のメッセージ近くに表示（自分メッセは右寄せ、他人メッセは左寄せ）
- 1個タップしたら、即座にトグル＆メニューを閉じる
- メニュー外をタップしても閉じる（ESC キーでも閉じる）
- 軽くフェードイン/アウトのアニメーションを付ける（既存 `fadeUp` を流用してよい）

---

## 3. 実装の詳細

### 3-1. 長押し検出

React で長押しを検出する標準的なパターン:

```jsx
function useLongPress(callback, ms = 500) {
  const timerRef = useRef(null);
  const isLongPressRef = useRef(false);

  const start = (e) => {
    isLongPressRef.current = false;
    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      callback(e);
    }, ms);
  };
  const cancel = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };
  return {
    onTouchStart: start,
    onTouchEnd: cancel,
    onTouchMove: cancel,
    onMouseDown: start,
    onMouseUp: cancel,
    onMouseLeave: cancel,
    onContextMenu: (e) => e.preventDefault(), // 右クリックメニュー抑止
  };
}
```

各メッセージバブルに `useLongPress` を仕込み、500ms押し続けると
そのメッセージIDをセット → メニュー表示。

### 3-2. メニュー表示の state

`ChatBox` コンポーネントで:

```jsx
const [openReactionMenuFor, setOpenReactionMenuFor] = useState(null);
// メッセージIDを入れる。null なら閉じてる。
```

長押し時に `setOpenReactionMenuFor(message.id)` で開く。
メニューの絵文字をタップしたら、`toggleReaction` を呼んで `setOpenReactionMenuFor(null)` で閉じる。
メニュー外タップで閉じるには、メニューの兄弟要素として透明オーバーレイ（fixed、z-index高め）を置く。

### 3-3. 既存リアクションのチップ表示

メッセージごとに、`reactions` の各エントリで件数 > 0 のものだけ表示:

```jsx
{Object.entries(message.reactions || {}).map(([emoji, userIds]) => {
  if (!userIds || userIds.length === 0) return null;
  const isMine = userIds.includes(myId);
  return (
    <button
      key={emoji}
      onClick={() => toggleReaction(message.id, emoji)}
      className={`reaction-chip ${isMine ? "active" : ""}`}
    >
      {emoji} {userIds.length}
    </button>
  );
})}
```

スタイル:
```css
.reaction-chip {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  background: rgba(0,91,172,0.07);
  border: 1px solid rgba(0,91,172,0.22);
  margin-right: 4px;
  margin-top: 4px;
  cursor: pointer;
}
.reaction-chip.active {
  background: #d6e4ff;
  border-color: #005BAC;
  color: #005BAC;
  font-weight: 600;
}
```

### 3-4. フローティングメニューのスタイル

```css
.reaction-menu {
  position: absolute;       /* メッセージに対して相対 */
  bottom: 100%;             /* バブルの上に出す */
  background: #fff;
  border-radius: 24px;
  padding: 8px 12px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  display: flex;
  gap: 12px;
  z-index: 100;
  animation: fadeUp 0.15s ease-out;
}
.reaction-menu button {
  font-size: 24px;          /* 絵文字大きめ */
  background: transparent;
  border: none;
  padding: 4px 8px;
  border-radius: 8px;
  cursor: pointer;
}
.reaction-menu button:active {
  background: rgba(0,91,172,0.08);
  transform: scale(0.92);
}
```

`position: relative` のメッセージバブルラッパー内に置けば、バブル直上に出る。

---

## 4. 実装ステップ（この順で進める）

- **Step 1**: 現状の常時表示リアクションボタンのコードを削除（または非表示化）
- **Step 2**: `useLongPress` フックを追加
- **Step 3**: `openReactionMenuFor` state と、メニュー外タップで閉じるオーバーレイを追加
- **Step 4**: 各メッセージのバブルに `useLongPress` を仕込み、長押しでメニューが
  そのメッセージの上に出るように
- **Step 5**: 既存リアクションのチップ表示（押されている絵文字 + 件数のみ）を
  メッセージバブル直下に出す
- **Step 6**: チップをタップしたら toggleReaction が呼ばれることを確認
- **Step 7**: ビルドが通ることを確認

---

## 5. 細かい注意

- **長押しの誤発火防止**: タッチ移動（onTouchMove）でキャンセル。スクロールと
  競合しないように
- **PC では右クリックで代替**を提供（任意）。`onContextMenu` でメニューを出す
  実装にすると、PC でも試せる
- **絵文字の見え方**: OS によって 🤔 や 🔥 の見た目が違うが、リアクションは
  これで成立する（標準絵文字）
- **アクセシビリティ**: 長押しは万能でないので、メッセージのオプションメニュー
  （…ボタン）でも同じメニューを開けるようにすると親切（任意）
- **既存メッセージとの互換性**: `reactions` フィールドが無いメッセージでも
  落ちないようフォールバックは維持

---

## 6. 完了条件（テスト観点）

- [ ] リアクションがゼロのメッセージは、メッセージ・時刻・アイコンだけ表示される
      （4個のボタンが消えている）
- [ ] リアクションが1個以上付いたメッセージは、バブル直下に小さなチップで
      `絵文字 件数` の形で表示される
- [ ] チップをタップすると、自分のリアクションが ON/OFF 切り替わる
- [ ] メッセージを長押し（500ms以上）すると、フローティングメニューが
      バブルの上に出現する
- [ ] メニューの4種絵文字どれかをタップすると、トグルされてメニューが閉じる
- [ ] メニュー外をタップしてもメニューが閉じる
- [ ] PCでも右クリックでメニューが出る（任意機能）
- [ ] 別端末で押されたリアクションも、自分の画面でリアルタイムにチップが更新される
- [ ] 既存の spec-01〜06 機能（予想・採点・シェア・通知・引用返信等）が壊れていない

---

## 7. 実装後

動作確認できたら「優先順位 6b 完了」と報告してください。
これで spec-06 が**真の完成形**になります。
次は優先順位 7 位（ライブスコア連携で結果自動反映）に進みます。
