# 実装仕様書 13 ｜ 自分の大会ハブをトップページ（HomeA）に統合

> このファイルは Claude Code に「読んで実装して」と渡すための仕様書です。
> HomeA を「**自分の大会選択ハブ**」に進化させ、HomeB から自由に戻れるようにします。
>
> これにより、複数の大会に参加・主催している場合の切り替えが可能になり、
> 「トップページから自分の大会を確認・切り替えできる」体験が実現します。

---

## 0. この機能の狙い

現状の課題:
- **HomeB（参加済み画面）から HomeA（未参加時画面）に戻る方法がない**
- 自分がどの大会に参加してるか、過去に何の大会を作ったかを**一覧で見る場所がない**
- 「別の大会を作りたい」「招待されたから別の大会にも入りたい」となったとき詰まる

この機能で:
- HomeA を**自分の大会選択ハブ**にする
  - 参加中の大会一覧（自分が participant として入っている）
  - 主催した大会一覧（自分が作成した）
- HomeB のヘッダーから HomeA に戻れる導線を追加
- HomeA から各大会カードをタップで、その大会の HomeB に遷移
- 既存の「友達と大会を作る」「招待コードで参加」「ひとりで予想を始める」CTAは維持

---

## 1. 大前提（守ること）

- **既存機能（spec-01〜12、spec-D1〜D6、spec-D2-ref）を一切壊さない**
- 既存の `myId`（localStorage）ベースのまま運用、ログイン機能は導入しない
- 既存の `tourn` ステート、HomeA/HomeB 分岐ロジックは保持
- 大会データは Supabase の `tournaments` / `participants` テーブルにある前提
- 既存の HomeA のヒーロー演出（spec-D2-ref で実装済み）は維持
- モバイル幅 max 400px

---

## 2. データ取得

### 2-1. 自分の参加大会を取得

Supabase で、自分の `myId` を持つ participant が含まれる全ての tournament を取得:

```js
async function fetchMyTournaments(myId) {
  // 自分が参加してる participants を全取得
  const { data: myParticipants } = await supabase
    .from("participants")
    .select("id, tournamentId, nickname, icon, totalMatchPoints, role")
    .eq("id", myId);

  if (!myParticipants || myParticipants.length === 0) return [];

  const tournamentIds = [...new Set(myParticipants.map(p => p.tournamentId))];

  // それらの tournament データを取得
  const { data: tournaments } = await supabase
    .from("tournaments")
    .select("id, name, createdAt, creatorId, participantCount, ...")
    .in("id", tournamentIds);

  // 参加情報を merge
  return tournaments.map(t => {
    const myPart = myParticipants.find(p => p.tournamentId === t.id);
    return {
      ...t,
      myPoints: myPart?.totalMatchPoints || 0,
      myRole: myPart?.role || "member", // "host" or "member"
      isHost: t.creatorId === myId || myPart?.role === "host",
    };
  });
}
```

**注意**: 実際のテーブル構造は App.jsx を Grep で確認すること。
`creatorId` / `hostId` / `createdBy` などのフィールド名は実装に合わせる。
無ければ「参加大会」のみ表示し、「主催」フラグは付けないでもOK。

### 2-2. キャッシュ

API への過剰アクセスを避けるため、`localStorage` に5分キャッシュ:

```js
const CACHE_KEY = "wcup_myTournaments";
const CACHE_TTL = 5 * 60 * 1000; // 5分

async function loadMyTournaments(myId, force = false) {
  if (!force) {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.cachedAt < CACHE_TTL) {
        return parsed.data;
      }
    }
  }
  const fresh = await fetchMyTournaments(myId);
  localStorage.setItem(CACHE_KEY, JSON.stringify({ data: fresh, cachedAt: Date.now() }));
  return fresh;
}
```

---

## 3. HomeA の新レイアウト

### 3-1. 構造（上から順）

```
┌─────────────────────────────┐
│ アプリヘッダー（既存）         │
├─────────────────────────────┤
│ ヒーロー領域（既存）           │
│ FIFA WORLD CUP 2026          │
│ 夏が、はじまる。              │
│ カウントダウン                 │
├─────────────────────────────┤
│ 🔵 NEW セクション             │
│  「あなたの大会」              │
│                              │
│  ┌──────────────────────────┐│
│  │ 👑 主催                  ││
│  │ 茨城予想会 2026          ││  ← 大会カード（主催）
│  │ 順位 1位 / 5人 ・ 24 pt  ││
│  │ [ 開く → ]               ││
│  └──────────────────────────┘│
│                              │
│  ┌──────────────────────────┐│
│  │ 大阪予想会               ││  ← 大会カード（参加）
│  │ 順位 3位 / 12人 ・ 18 pt ││
│  │ [ 開く → ]               ││
│  └──────────────────────────┘│
│                              │
│  + 新しい大会を作る           │  ← 既存CTA（赤）に統合
│  + 招待コードで参加           │  ← 既存リンク
├─────────────────────────────┤
│ ピッチ装飾 + 既存 CTA（残す） │
│  「ひとりで予想を始める」      │
│  「もっと遊ぶ」                │
└─────────────────────────────┘
```

### 3-2. 「あなたの大会」セクションの実装

```jsx
function MyTournamentsSection({ myTournaments, onSelect, onCreate, onJoinByCode }) {
  if (myTournaments.length === 0) {
    return null; // 大会ゼロなら表示しない（既存の CTA がそのまま見える）
  }
  return (
    <section className="relative z-10 px-5 mt-6">
      <h2 className="text-text-on-navy font-bold text-base mb-3">
        あなたの大会 ({myTournaments.length})
      </h2>
      <div className="space-y-3">
        {myTournaments.map(t => (
          <TournamentCard key={t.id} tournament={t} onClick={() => onSelect(t.id)} />
        ))}
      </div>
      <div className="mt-4 space-y-2">
        <button
          onClick={onCreate}
          className="w-full bg-hinomaru text-white rounded-2xl shadow-cta-red py-3 font-bold text-base
                     flex items-center justify-center gap-2 active:scale-[.98] transition"
        >
          <span className="text-xl leading-none">＋</span>
          新しい大会を作る
        </button>
        <button
          onClick={onJoinByCode}
          className="w-full border border-white/30 text-white rounded-2xl py-2.5 font-bold text-sm active:scale-[.98]"
        >
          招待コードで参加
        </button>
      </div>
    </section>
  );
}

function TournamentCard({ tournament, onClick }) {
  const t = tournament;
  return (
    <button
      onClick={onClick}
      className="w-full bg-white text-text-on-white rounded-card shadow-data-card p-4 text-left
                 active:scale-[.99] transition"
    >
      {t.isHost && (
        <div className="text-xs text-gold font-bold mb-1 flex items-center gap-1">
          <span>👑</span> 主催
        </div>
      )}
      <div className="font-extrabold text-base">{t.name}</div>
      <div className="text-xs text-text-on-white-gray mt-1">
        {t.myRank ? `順位 ${t.myRank}位 / ${t.participantCount}人 ・ ${t.myPoints} pt` : `参加中 ・ ${t.myPoints} pt`}
      </div>
      <div className="text-right text-hinomaru text-sm font-bold mt-2">開く →</div>
    </button>
  );
}
```

### 3-3. 既存 CTA との関係

HomeA に「あなたの大会」セクションがある場合:
- メインCTA（赤の「友達と大会を作る」）は **そのセクション内**に統合
- 「招待コードで参加」もセクション内に
- 「ひとりで予想を始める」「もっと遊ぶ」「招待された?コードで参加」は**ヒーロー下部のCTA群**にそのまま残す

HomeA に大会ゼロの場合:
- 「あなたの大会」セクションは非表示
- 既存の CTA 群（赤の「友達と大会を作る」「ひとりで予想を始める」等）がそのまま見える
- 完全に従来通りの HomeA

---

## 4. HomeB → HomeA への戻る導線

### 4-1. ヘッダーに「☰」or「←」ボタンを追加

HomeB のヘッダー左側に、メニュー/戻るボタンを設置:

```jsx
<header className="flex items-center gap-3 px-5 py-3">
  {/* 戻る・メニューボタン */}
  <button
    onClick={() => setShowLandingOverride(true)}
    className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white"
    aria-label="トップに戻る"
  >
    ☰
  </button>
  {/* 大会名 */}
  <div className="flex-1 min-w-0">
    <div className="text-xs text-text-on-navy-dim">大会</div>
    <div className="text-white font-bold text-base truncate">{tournName}</div>
  </div>
  {/* 既存のアバター（マイページ遷移） */}
  <button onClick={() => nav("mypage")} className="w-8 h-8 rounded-full overflow-hidden">
    <Avatar icon={myParticipant.icon} nickname={myParticipant.nickname} />
  </button>
</header>
```

### 4-2. ナビゲーション・ステートの拡張

`App` コンポーネント（または HomeA/B 分岐をしている場所）に
新しいステート `showLandingOverride` を追加:

```jsx
const [showLandingOverride, setShowLandingOverride] = useState(false);

// 表示分岐
const isParticipant = myId && tourn?.participants?.find(p => p.id === myId);
const showHomeB = isParticipant && !showLandingOverride;

return showHomeB
  ? <PgHomeB ... onMenuClick={() => setShowLandingOverride(true)} />
  : <PgHomeA
      ...
      isOverriding={isParticipant && showLandingOverride}
      onReturnToCurrentTourn={() => setShowLandingOverride(false)}
      myTournaments={myTournaments}
      onSelectTournament={(tId) => {
        // tourn を切り替えて showLandingOverride を false に
        loadTournament(tId);
        setShowLandingOverride(false);
      }}
    />;
```

### 4-3. HomeA 上部の「戻る」リンク（現在大会がある時）

`isOverriding` のときだけ、HomeA の上部に「現在の大会に戻る」リンク:

```jsx
{isOverriding && (
  <div className="bg-gold/10 border-b border-gold/30 px-5 py-2 flex items-center justify-between">
    <span className="text-text-on-navy text-sm">
      現在: <span className="font-bold">{currentTournName}</span>
    </span>
    <button onClick={onReturnToCurrentTourn} className="text-gold font-bold text-sm">
      ↩️ 戻る
    </button>
  </div>
)}
```

---

## 5. 大会カードをタップしたときの挙動

ユーザーが HomeA の大会カードをタップしたら:

```js
async function onSelectTournament(tournamentId) {
  // その tournament を Supabase からロード
  const t = await loadTournament(tournamentId);
  setTourn(t);
  // myId はそのまま使う（複数大会で同じ myId）
  setShowLandingOverride(false);
  // → HomeB が表示される
}
```

---

## 6. 実装ステップ（この順で進める）

- **Step 1**: App.jsx を Grep で確認:
  - tournament テーブルのフィールド名（`creatorId`, `hostId`, `createdBy` 等）
  - 既存の `loadTournament` 関数の名前と引数
  - HomeA/B 分岐ロジックがどこにあるか
- **Step 2**: `fetchMyTournaments(myId)` 関数を実装
  - 主催判定: `creatorId === myId` または participant の `role === "host"` などで判定
  - 該当フィールドが無ければ「主催」表示は省略
- **Step 3**: localStorage 5分キャッシュ
- **Step 4**: HomeA に「あなたの大会」セクションを追加（大会ゼロなら非表示）
- **Step 5**: HomeB のヘッダー左に「☰」ボタンを追加、`showLandingOverride` ステートを設置
- **Step 6**: HomeA 上部に「現在の大会に戻る ↩️」リンク（`isOverriding` 時のみ）
- **Step 7**: 大会カードのタップで `loadTournament` → HomeB へ遷移
- **Step 8**: ビルドが通ることを確認
- **Step 9**: **`npm run deploy` で本番に公開**
- **Step 10**: 「実装完了 + デプロイ完了」と報告

---

## 7. 細かい注意

- **「主催」判定**: 実際のテーブルに `creatorId` フィールドがあれば、それと myId を比較。
  無ければ「主催」マークは省略してOK（参加大会一覧だけ表示）
- **大会ゼロのケース**: `myTournaments.length === 0` のときは「あなたの大会」セクションを完全に
  非表示にして、既存の HomeA をそのまま表示
- **キャッシュの破棄**: 新しい大会を作ったとき、招待コードで参加したときは、
  `localStorage.removeItem("wcup_myTournaments")` してキャッシュをクリア
- **データ取得の失敗**: API が失敗したらセクションを非表示にして既存の HomeA を表示
  （アプリを止めない）
- **遷移のスムーズさ**: 大会切り替え中はローディング状態を表示（短時間でもUX上重要）
- **既存の HomeA ヒーロー演出**（spec-D2-ref）は完全に維持。新しいセクションを「ヒーローの下」に
  挿入する形

---

## 8. 完了条件（テスト観点）

### 大会未参加のとき（HomeA）
- [ ] 「あなたの大会」セクションは表示されない
- [ ] 既存のヒーロー演出 + 「友達と大会を作る」「ひとりで予想を始める」「もっと遊ぶ」が
  従来通り表示される

### 大会1個に参加中のとき
- [ ] HomeB のヘッダー左に「☰」ボタンが表示される
- [ ] 「☰」をタップすると HomeA が表示される
- [ ] HomeA 上部に「現在: ◯◯ ↩️戻る」リンクが出る
- [ ] HomeA の「あなたの大会」セクションに、その大会のカードが1枚表示される
- [ ] 主催した大会なら「👑 主催」マークが付く
- [ ] カードをタップすると、その大会の HomeB に戻る
- [ ] 「↩️戻る」リンクをタップしても HomeB に戻る
- [ ] 「+ 新しい大会を作る」で大会作成画面へ
- [ ] 「招待コードで参加」で参加画面へ

### 大会複数（2個以上）に参加中のとき
- [ ] 「あなたの大会」セクションに大会が複数並ぶ
- [ ] 各大会をタップで切り替えできる
- [ ] 「現在: ◯◯」表示は今開いている大会を反映

### 全体
- [ ] チャット、ランキング、予想、マイページ等が壊れていない
- [ ] **ビルドが通り、本番に自動デプロイされている**

---

## 9. 自動デプロイの指示

実装完了後に以下を自動実行する:

1. `npm run build` でビルド確認
2. ビルドが通ったら `npm run deploy` で本番公開
3. 「実装完了 + デプロイ完了」と報告
4. どこに「☰」ボタンを設置したか、「あなたの大会」セクションの構造を簡潔に報告

ビルドが失敗した場合は、そこで止まって原因を報告すること（デプロイには進まない）。

---

## 10. 実装後

動作確認できたら「**spec-13 完了**」と報告してください。

これで HomeA は単なる「未参加時の画面」から「**自分の大会選択ハブ**」に進化し、
ユーザーは複数の大会を自由に切り替えられるようになります。
