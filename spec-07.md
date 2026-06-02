# 実装仕様書 07 ｜ ライブスコア連携で結果自動反映

> このファイルは Claude Code に「読んで実装して」と渡すための仕様書です。
> 既存の `wcup-vite` プロジェクトに、ESPN API から試合結果を自動取得して、
> 結果確定時に全員を自動採点する機能を追加します。

---

## 0. この機能の狙い

これまで「試合結果は管理者が手で入力 → 全員採点」のフローだった。
これだと管理者の負担が大きく、結果が反映されるまで時間がかかり、
「試合終了直後の盛り上がり」を逃しがち。

この機能で:

- W杯試合が終わると、**ESPN API から自動で結果を取得**
- 結果が確定した試合は、既存の `scoreMatch` で**全員を自動採点**
- ランキング更新・チャットへの自動システム投稿（spec-06）まで連鎖
- API が死んだ場合・データが取れない場合は**従来の手動入力にフォールバック**

これでアプリは「**結果待ちの楽しみ**」を最大化でき、
管理者の負担もほぼゼロに近づく。

---

## 1. 大前提（守ること）

- **既存の手動結果入力（`MatchResultAdmin`）は絶対に残す**。
  API が動かない時のフォールバックとして必須。
- **API取得が成功しても、上書きは慎重に**。既に手動入力された結果は触らない
  （`results.matchResults[matchId]` が既にあるならスキップ）。
- **既存機能（spec-01〜06b）を一切壊さない**。
- レート制限を意識（ESPN API への過剰アクセス防止）。
- `vite.config.js` の `base: '/wcup-yosou/'` は変更しない。
- CORS で失敗する可能性があるので、エラー時は静かにスキップ
  （ユーザーには「自動取得失敗」を出さず、手動入力を促す UI のまま）。

---

## 2. ESPN API について

ESPN は公式ドキュメント無しのまま公開している JSON API がある。
W杯（FIFA World Cup 2026）用のスコアボード:

```
https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard
```

レスポンス例（簡略）:
```json
{
  "events": [
    {
      "id": "12345",
      "date": "2026-06-15T22:00Z",
      "status": { "type": { "completed": true } },
      "competitions": [{
        "competitors": [
          { "homeAway": "home", "team": { "displayName": "Japan" }, "score": "1" },
          { "homeAway": "away", "team": { "displayName": "Germany" }, "score": "2" }
        ]
      }]
    }
  ]
}
```

- レスポンスは大会期間中なら直近の試合一覧
- 完了試合は `status.type.completed: true` で判別
- スコアは文字列で返るので Number 化が必要
- チーム名は英語表記（日本語の `MATCHES` データと照合する必要がある）

### 2-1. チーム名マッピング

`MATCHES` のチーム名（日本語）と ESPN のチーム名（英語）を対応させる:

```js
const TEAM_NAME_MAP = {
  "Japan": "日本",
  "Germany": "ドイツ",
  "Spain": "スペイン",
  "Brazil": "ブラジル",
  "Argentina": "アルゼンチン",
  "France": "フランス",
  "England": "イングランド",
  // ... 32〜48チーム分
};
```

ESPN のチーム名 → 日本語に変換 → MATCHES の `home`/`away` と照合。

不一致があってもログを出すだけにして、エラーで落とさない。

---

## 3. 取得タイミング

過剰アクセスを避けつつ、必要な時に取れるよう以下のタイミングで:

1. **アプリ起動時** に1回
2. **大会ページ・試合一覧ページを開いたとき** に1回（直近の試合に絞って）
3. **3分ごとの自動更新**（試合中のページにいるときだけ）

すべて localStorage で「最後に取得した時刻」を保存して、
1分以内に再取得しないよう抑制する。

```js
async function fetchAndApplyResults(tourn, opts = {}) {
  const lastFetch = parseInt(localStorage.getItem("wcup_lastApiFetch") || "0");
  const now = Date.now();
  if (!opts.force && now - lastFetch < 60_000) return; // 1分以内ならスキップ

  try {
    const res = await fetch("https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard");
    if (!res.ok) throw new Error("API error");
    const data = await res.json();
    localStorage.setItem("wcup_lastApiFetch", String(now));

    const updates = parseEspnResults(data); // [{matchId, homeScore, awayScore}, ...]
    if (updates.length === 0) return;

    await applyMatchResults(tourn, updates); // 既存のscoreMatchを呼び出す
  } catch (err) {
    console.warn("ESPN API fetch failed (will fall back to manual):", err);
  }
}
```

---

## 4. 結果反映の処理

ESPN から取れた結果を、既存の `MatchResultAdmin` の保存処理に流す。
**手動入力済みの試合はスキップ**:

```js
async function applyMatchResults(tourn, updates) {
  const currentResults = (tourn.results && tourn.results.matchResults) || {};
  const newResults = { ...currentResults };
  let appliedCount = 0;

  for (const u of updates) {
    if (newResults[u.matchId]) continue; // 既に結果あり → スキップ
    newResults[u.matchId] = {
      homeScore: u.homeScore,
      awayScore: u.awayScore,
      finishedAt: new Date().toISOString(),
      source: "espn-auto",
    };
    appliedCount++;
  }

  if (appliedCount === 0) return;

  // 全参加者の予想を再採点（既存 scoreMatch を活用）
  const updatedParticipants = tourn.participants.map(p => {
    const newPredictions = { ...(p.matchPredictions || {}) };
    let total = p.totalMatchPoints || 0;
    for (const u of updates) {
      const pred = newPredictions[u.matchId];
      if (!pred || pred.points != null) continue; // 未予想 or 採点済みはスキップ
      const match = MATCHES.find(m => m.id === u.matchId);
      if (!match) continue;
      const filledMatch = { ...match, homeScore: u.homeScore, awayScore: u.awayScore, status: "finished" };
      const pts = scoreMatch(pred, filledMatch);
      newPredictions[u.matchId] = { ...pred, points: pts };
      total += pts;
    }
    return { ...p, matchPredictions: newPredictions, totalMatchPoints: total };
  });

  await saveT({
    ...tourn,
    participants: updatedParticipants,
    results: { ...(tourn.results || {}), matchResults: newResults },
  });

  // spec-06 のシステム投稿も流す（既存ロジックを再利用）
  for (const u of updates) {
    await postMatchResultSystemMessage(tourn.id, u); // 既存関数を呼ぶ
  }
}
```

---

## 5. UI への追加

### 5-1. `MatchResultAdmin` の上部に「自動取得」ボタン

管理者画面（既存 spec-01 の「⚽ 試合結果」タブ）の最上部に:

```
┌───────────────────────────────┐
│ 🔄 結果を自動取得               │
│  ESPN から最新の試合結果を取得   │
│  最終取得: 2026/06/15 22:34     │
└───────────────────────────────┘
```

- ボタンを押すと、`fetchAndApplyResults(tourn, { force: true })` を呼ぶ
- ローディング中は「取得中...」表示
- 結果が取れたら「◯件の結果を反映しました」のトーストを出す
- 取れなかったら「自動取得できませんでした。下から手動で入力してください」

### 5-2. 試合カードに「自動取得済み」バッジ

結果のソースを表示:
- `source: "espn-auto"` → 「🔄 自動取得」薄い緑バッジ
- `source: "manual"` または無し → 「✏️ 手動入力」薄いグレーバッジ

これで「これは自動取得なんだな」が一目で分かる。

### 5-3. アプリ全体の自動取得

`App` コンポーネントの useEffect で、起動時に1回呼ぶ:

```js
useEffect(() => {
  if (!tourn) return;
  fetchAndApplyResults(tourn);
  const interval = setInterval(() => {
    if (document.visibilityState === "visible") {
      fetchAndApplyResults(tourn);
    }
  }, 3 * 60 * 1000); // 3分ごと
  return () => clearInterval(interval);
}, [tourn?.id]);
```

タブが非アクティブな時は呼ばない（バッテリー対策）。

---

## 6. 実装ステップ（この順で進める）

- **Step 1**: `TEAM_NAME_MAP` を定義（W杯出場予定32〜48チーム分）
- **Step 2**: `parseEspnResults(data)` を実装 — ESPN レスポンスを内部形式に変換
- **Step 3**: `fetchAndApplyResults(tourn, opts)` を実装 — 取得＋レート制限
- **Step 4**: `applyMatchResults(tourn, updates)` を実装 — 既存採点ロジックを再利用
- **Step 5**: `MatchResultAdmin` 上部に「自動取得」ボタンを追加
- **Step 6**: 試合カードに source バッジを追加
- **Step 7**: アプリ起動時の自動取得＋3分ごとのポーリングを実装
- **Step 8**: ビルドが通ることを確認

---

## 7. 細かい注意

- **CORS 問題**: ESPN API は CORS ヘッダーを返しているはず（通常はブラウザから
  直接 fetch できる）。もし CORS エラーが出た場合は、ユーザーに通知せず
  static fallback として手動入力を促す
- **API レスポンス変化への耐性**: ESPN は仕様変更があり得る。`parseEspnResults`
  内で想定外の構造は try/catch で吸収、空配列を返す
- **W杯本番期間外**: スコアボードが空の時もある。エラーにしない、空ならスキップ
- **過剰反映防止**: 同じ試合を何度も上書きしないよう、`matchResults[matchId]` が
  既にあれば触らない
- **採点の二重計上防止**: `pred.points != null` ならスキップ
- **手動と自動の混在**: 管理者は手動で結果を入れ続けられる。自動取得が動いてても、
  まだ取れてない試合は手で入れて構わない

---

## 8. 完了条件（テスト観点）

- [ ] `MatchResultAdmin` の上部に「🔄 結果を自動取得」ボタンが表示される
- [ ] ボタンを押すと ESPN API を叩いて、ローディング表示が出る
- [ ] API レスポンスがあれば、`MATCHES` と照合して該当試合の結果が反映される
- [ ] 自動取得された試合は「🔄 自動取得」バッジが付く
- [ ] 既に手動入力済みの試合は、自動取得で上書きされない
- [ ] 結果反映後、全参加者の予想が採点され、`totalMatchPoints` が更新される
- [ ] ランキング（spec-01）がリアルタイム更新される
- [ ] 結果確定のシステム投稿（spec-06）がチャットに流れる
- [ ] アプリ起動時に1回、アクティブタブで3分ごとに自動取得が走る
- [ ] API が失敗してもアプリは壊れず、手動入力ボタンは普通に使える
- [ ] 既存機能（spec-01〜06b）が壊れていない

---

## 9. 実装後

動作確認できたら「優先順位 7 位 完了」と報告してください。
次は優先順位 8 位（ゲーミフィケーション — 連続的中・バッジ）に進みます。
