# 実装仕様書 14 ｜ 全国 Crowd Pick（優勝予想・日本代表注目選手の集計）

> このファイルは Claude Code に「読んで実装して」と渡すための仕様書です。
> 全国の全ユーザー横断で、優勝予想と日本代表注目選手の集計（%と票数）を
> 表示する機能を追加します。**AI優勝予想ページは削除**します。

---

## 0. この機能の狙い

ユーザーが「**みんな何を予想してるんだろ？**」と気になる気持ちは強い。
FIFA 公式アプリでも「**Crowd Pick**」として人気機能。

この機能で:
- トップページ（HomeA）で**全国の優勝予想集計**が見える（◯%、◯票）
- 日本代表モードで**日本代表注目選手の集計**が見える（次の日本戦で誰が決めるか）
- 既存の「AI優勝予想」ページは削除（使ってる人いない & 集計の方がリアル）

これで「**みんなの本音**」が一目で見え、議論やシェアも生まれる。

---

## 1. 大前提（守ること）

- **既存機能（spec-01〜13、spec-D1〜D6、D2-ref）を一切壊さない**
- 既存の `myId`、Supabase の `participants` テーブル構造は維持
- 全国横断の集計は spec-11 と同じ仕組み（5分キャッシュ、200件取得制限）
- 集計データが取得失敗してもアプリを止めない（セクション非表示で対応）
- モバイル幅 max 400px

---

## 2. 機能1: 優勝予想の全国集計

### 2-1. データ取得

Supabase で、全 participants の `tournPrediction.champion`（または同等のフィールド）を集計:

```js
async function fetchGlobalChampionVotes() {
  // 全 participants の優勝予想を取得（200件まで）
  const { data, error } = await supabase
    .from("participants")
    .select("tournPrediction")
    .not("tournPrediction", "is", null)
    .limit(5000); // 制限の中で多めに

  if (error || !data) return null;

  // 集計
  const counts = {};
  let total = 0;
  data.forEach(p => {
    const champion = p.tournPrediction?.champion;
    if (champion) {
      counts[champion] = (counts[champion] || 0) + 1;
      total++;
    }
  });

  // ソート（票数降順）
  return {
    total,
    rankings: Object.entries(counts)
      .map(([country, count]) => ({
        country,
        count,
        percent: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.count - a.count),
  };
}
```

**注意**:
- 実際のフィールド名は App.jsx を Grep で確認（`tournPrediction.champion` / `championPick` / `championGuess` 等）
- 該当フィールドが無ければ「優勝予想集計」は実装せず、Issue としてその旨を報告

### 2-2. キャッシュ（5分）

```js
const CACHE_KEY = "wcup_globalChampionVotes";
const CACHE_TTL = 5 * 60 * 1000;

async function loadGlobalChampionVotes(force = false) {
  if (!force) {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.cachedAt < CACHE_TTL) {
        return parsed.data;
      }
    }
  }
  const fresh = await fetchGlobalChampionVotes();
  if (fresh) {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data: fresh, cachedAt: Date.now() }));
  }
  return fresh;
}
```

### 2-3. 表示位置（HomeA & HomeB 共通）

HomeA の「あなたの大会」セクション（spec-13）の下、または「もっと遊ぶ」グリッドの中、
あるいはヒーロー演出の下の独立セクションに配置:

```
┌─────────────────────────────┐
│ ヒーロー演出（既存）           │
├─────────────────────────────┤
│ あなたの大会（spec-13）        │
├─────────────────────────────┤
│ 🌐 みんなの優勝予想（new）     │
│  全国 4,521 票                 │
│                              │
│  🇧🇷 ブラジル        32.4%    │
│  ████████████░░░░  1,464票    │
│                              │
│  🇫🇷 フランス        21.8%    │
│  ███████░░░░░░░░░    985票    │
│                              │
│  🇪🇸 スペイン        15.1%    │
│  █████░░░░░░░░░░░    683票    │
│                              │
│  🇦🇷 アルゼンチン    10.2%    │
│  ███░░░░░░░░░░░░░    461票    │
│                              │
│  🇯🇵 日本             6.8%    │
│  ██░░░░░░░░░░░░░░    307票    │
│                              │
│  [ もっと見る ▼ ]              │
└─────────────────────────────┘
```

### 2-4. UI 実装例

```jsx
function GlobalChampionPicks({ data }) {
  const [showAll, setShowAll] = useState(false);
  if (!data || data.rankings.length === 0) return null;

  const visibleRankings = showAll ? data.rankings : data.rankings.slice(0, 5);

  return (
    <section className="relative z-10 px-5 mt-6">
      <h2 className="text-text-on-navy font-bold text-base mb-1 flex items-center gap-2">
        🌐 みんなの優勝予想
      </h2>
      <p className="text-text-on-navy-dim text-xs mb-3">
        全国 {data.total.toLocaleString()} 票
      </p>
      <div className="bg-white text-text-on-white rounded-card shadow-data-card p-4 space-y-3">
        {visibleRankings.map((row, i) => (
          <div key={row.country}>
            <div className="flex items-baseline justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xl">{getCountryFlag(row.country)}</span>
                <span className="font-bold">{row.country}</span>
                {i === 0 && (
                  <span className="text-xs bg-gold text-navy-base px-2 py-0.5 rounded-full font-bold">
                    1位
                  </span>
                )}
              </div>
              <div className="text-text-on-white-gray text-sm tabular-nums">
                <span className="font-black text-text-on-white">{row.percent}%</span>
                <span className="ml-1 text-xs">({row.count.toLocaleString()}票)</span>
              </div>
            </div>
            <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={i === 0 ? "bg-gold h-2 rounded-full" : "bg-hinomaru h-2 rounded-full"}
                style={{ width: `${row.percent}%` }}
              />
            </div>
          </div>
        ))}
        {data.rankings.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full text-hinomaru text-sm font-bold pt-2 text-center"
          >
            {showAll ? "閉じる ▲" : `もっと見る ▼ (残り ${data.rankings.length - 5} カ国)`}
          </button>
        )}
      </div>
    </section>
  );
}
```

---

## 3. 機能2: 日本代表注目選手の全国集計

### 3-1. データ取得

全 participants の `matchPredictions[<次の日本戦のmatchId>].japanScorer` を集計:

```js
async function fetchGlobalJapanScorerVotes(nextJapanMatchId) {
  if (!nextJapanMatchId) return null;

  const { data, error } = await supabase
    .from("participants")
    .select("matchPredictions")
    .not("matchPredictions", "is", null)
    .limit(5000);

  if (error || !data) return null;

  // 集計
  const counts = {};
  let total = 0;
  data.forEach(p => {
    const scorerId = p.matchPredictions?.[nextJapanMatchId]?.japanScorer;
    if (scorerId) {
      counts[scorerId] = (counts[scorerId] || 0) + 1;
      total++;
    }
  });

  return {
    total,
    matchId: nextJapanMatchId,
    rankings: Object.entries(counts)
      .map(([playerId, count]) => {
        const player = JAPAN_SQUAD.find(p => p.id === playerId);
        return {
          playerId,
          playerName: player?.name || "不明",
          playerNumber: player?.number,
          playerPosition: player?.position,
          count,
          percent: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
        };
      })
      .sort((a, b) => b.count - a.count),
  };
}
```

**注意**:
- `JAPAN_SQUAD` は spec-09 で定義済み（id, name, number, position を持つ）
- 該当 matchId が無い・該当 japanScorer フィールドが無い場合は null を返す

### 3-2. キャッシュ（5分）

```js
const SCORER_CACHE_KEY = "wcup_globalJapanScorerVotes";
const SCORER_CACHE_TTL = 5 * 60 * 1000;

async function loadGlobalJapanScorerVotes(matchId, force = false) {
  if (!matchId) return null;
  if (!force) {
    const cached = localStorage.getItem(SCORER_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.matchId === matchId && Date.now() - parsed.cachedAt < SCORER_CACHE_TTL) {
        return parsed.data;
      }
    }
  }
  const fresh = await fetchGlobalJapanScorerVotes(matchId);
  if (fresh) {
    localStorage.setItem(SCORER_CACHE_KEY, JSON.stringify({
      data: fresh, matchId, cachedAt: Date.now(),
    }));
  }
  return fresh;
}
```

### 3-3. 表示位置

PgJapan（日本代表モード）の中、得点者予想ミニ（spec-09）の**下**に追加。
spec-09 で実装した「ユーザー個人の選択 UI」と並べることで、
「自分の予想 → みんなの予想」の流れが自然になる。

```
┌─────────────────────────────┐
│ 🇯🇵 日本代表モード              │
├─────────────────────────────┤
│ 次の日本戦カウントダウン       │
│ (spec-D6)                    │
├─────────────────────────────┤
│ 日本の得点者を予想 (+5pt)     │ ← spec-09
│ [選手1] [選手2]               │
│ [選手3] [選手4]               │
├─────────────────────────────┤
│ 🌐 みんなの注目選手予想        │ ← new
│ 全国 1,283 票 / 次の日本戦    │
│                              │
│ 1位 🥇 久保建英  #20 MF      │
│ ████████████ 28.4% (364票)   │
│                              │
│ 2位    三笘薫    #9 MF       │
│ ████████ 21.2% (272票)       │
│                              │
│ 3位    上田綺世  #11 FW      │
│ ██████ 16.8% (215票)         │
│                              │
│ ... (続き)                    │
└─────────────────────────────┘
```

### 3-4. UI 実装例

```jsx
function GlobalJapanScorerPicks({ data }) {
  if (!data || data.rankings.length === 0) return null;

  return (
    <section className="mx-5 mt-6">
      <h2 className="text-text-on-navy font-bold text-base mb-1 flex items-center gap-2">
        🌐 みんなの注目選手予想
      </h2>
      <p className="text-text-on-navy-dim text-xs mb-3">
        全国 {data.total.toLocaleString()} 票 / 次の日本戦
      </p>
      <div className="bg-white text-text-on-white rounded-card shadow-data-card p-4 space-y-3">
        {data.rankings.slice(0, 6).map((row, i) => (
          <div key={row.playerId}>
            <div className="flex items-baseline justify-between mb-1">
              <div className="flex items-center gap-2">
                {i === 0 && <span>🥇</span>}
                {i === 1 && <span>🥈</span>}
                {i === 2 && <span>🥉</span>}
                <span className="font-bold">{row.playerName}</span>
                {row.playerNumber && (
                  <span className="text-xs text-text-on-white-gray">
                    #{row.playerNumber} {row.playerPosition}
                  </span>
                )}
              </div>
              <div className="text-text-on-white-gray text-sm tabular-nums">
                <span className="font-black text-text-on-white">{row.percent}%</span>
                <span className="ml-1 text-xs">({row.count}票)</span>
              </div>
            </div>
            <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={i === 0 ? "bg-gold h-2 rounded-full" : "bg-hinomaru h-2 rounded-full"}
                style={{ width: `${row.percent}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

---

## 4. 機能3: AI 優勝予想ページの削除

### 4-1. 削除対象

App.jsx を Grep で以下を検索して削除:

- `PgAIChampion` または同等のコンポーネント名（`PgAI`, `AIChampion`, `aiChampion` など）
- 「もっと遊ぶ」グリッド内の「🤖 AI 優勝予想」ボタン
- ナビゲーション分岐（`nav === "ai-champion"` 等）
- 関連する関数（`generateAIPrediction` 等）

### 4-2. 注意

- AI機能の関数を呼び出してる箇所が他に無いか確認
- 削除でビルドが壊れないように、import 文も併せて削除
- 削除した行数を報告

---

## 5. 実装ステップ（この順で進める）

### Phase A: AI 優勝予想ページの削除
- **Step A1**: App.jsx を Grep で `AI` `aiChampion` 等を検索
- **Step A2**: 該当コンポーネント、ナビ分岐、グリッドのボタン、関連関数を削除
- **Step A3**: ビルドが通ることを確認

### Phase B: 全国優勝予想集計
- **Step B1**: App.jsx を Grep で `tournPrediction` / `champion` フィールド名を確認
- **Step B2**: `fetchGlobalChampionVotes()` 関数を実装
- **Step B3**: 5分キャッシュ
- **Step B4**: `GlobalChampionPicks` コンポーネントを実装
- **Step B5**: HomeA に表示（spec-13 の「あなたの大会」セクションの下）

### Phase C: 全国日本代表注目選手集計
- **Step C1**: 次の日本戦の matchId 取得ロジック
- **Step C2**: `fetchGlobalJapanScorerVotes(matchId)` を実装
- **Step C3**: 5分キャッシュ
- **Step C4**: `GlobalJapanScorerPicks` コンポーネントを実装
- **Step C5**: PgJapan の得点者予想ミニの下に表示

### 最終
- **Step Final**: ビルドが通ることを確認
- **Step Final**: **`npm run deploy` で本番に公開**
- **Step Final**: 「実装完了 + デプロイ完了」と報告

---

## 6. 細かい注意

- **データ取得失敗時**: 各セクションは null を返して非表示。アプリは止めない
- **データゼロのとき**: 「まだ予想が集まっていません」を出す or 完全に非表示
- **チームの絵文字旗**: `getCountryFlag(name)` 関数で対応。既存のマッピングを使う、
  無ければ MATCHES 内のチーム名から推測してデフォルトに
- **キャッシュ**: 5分 TTL。ユーザーが新しく予想を入れたら即時更新しない（次回キャッシュ更新時に反映）
  - 必要なら手動更新ボタンを「もっと見る」と並べる
- **AI 削除の影響範囲**: import / 関数定義 / 呼び出し全てを削除。残骸が無いように
- **「もっと遊ぶ」グリッドの整理**: AI削除後、グリッドのレイアウトが崩れないか確認
  （例: 2×2 → 3個になる場合は 1×3 にする等）
- **HomeAとHomeB両方で見せるか**: 仕様書ではHomeAのみだが、HomeBにも出すかは要相談
  → デフォルトは HomeA のみ（HomeB は「☰」で HomeA に戻れる、spec-13 で実装済み）

---

## 7. 完了条件（テスト観点）

### 全国優勝予想集計
- [ ] HomeA に「🌐 みんなの優勝予想」セクションが表示される
- [ ] 全国票数（例: 全国 4,521 票）が見える
- [ ] 各国に %、票数、プログレスバーが表示される
- [ ] 1位は金色強調、それ以下は赤系
- [ ] 「もっと見る」で6位以降も見られる

### 全国日本代表注目選手集計
- [ ] PgJapan に「🌐 みんなの注目選手予想」セクションが表示される
- [ ] 次の日本戦のmatchIdが正しく取れる
- [ ] 各選手に名前、背番号、ポジション、%、票数、プログレスバー
- [ ] 1位は🥇、2位🥈、3位🥉
- [ ] 上位6名まで表示

### AI 優勝予想削除
- [ ] 「もっと遊ぶ」グリッドから「AI 優勝予想」ボタンが消えてる
- [ ] AI ページに遷移しようとしても 404 / リダイレクト等にならない（リンクが完全削除）
- [ ] ビルドが通る（残骸のimportやundefinedで壊れない）

### 全体
- [ ] HomeA、HomeB、PgJapan、その他の画面が壊れていない
- [ ] **ビルドが通り、本番に自動デプロイされている**

---

## 8. 自動デプロイの指示

実装完了後に以下を自動実行する:

1. `npm run build` でビルド確認
2. ビルドが通ったら `npm run deploy` で本番公開
3. 「実装完了 + デプロイ完了」と報告
4. 削除した AI 関連の行数、優勝予想と選手予想のフィールド名を簡潔に報告

ビルドが失敗した場合は、そこで止まって原因を報告すること（デプロイには進まない）。

---

## 9. 実装後

動作確認できたら「**spec-14 完了**」と報告してください。

これでアプリに「**全国の本音が見える**」体験が加わり、
ユーザーが何度も戻ってきて「みんなの予想を見たい」気持ちを満たせます。
