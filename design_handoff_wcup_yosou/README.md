# Handoff: wcup-yosou — W杯2026 予想アプリ（侍ブルー基調）

## Overview
**wcup-yosou** は、FIFA World Cup 2026（北中米3カ国共催・48カ国）の40日間限定で熱狂してもらう、日本ファン特化のサッカー勝敗予想アプリです。友達と大会を作り、試合の勝敗・得点者を予想して自動採点・ライブ順位で競い、結果をSNSにシェアして遊びます。このバンドルは全画面 + 触れるプロトタイプの **デザインリファレンス** です。

世界観の核：**侍ブルー（深いネイビー）のダーク基調に、白いデータカードを深い影で浮かせる**。アクセントは2色だけ — **日の丸赤 `#E60033`（CTA・勝敗・締切）** と **ゴールド `#F4B400`（祝福・バッジ・カウントダウン）**。Apple Music / Spotify / DAZN のダークモードが下敷き。

## About the Design Files
このフォルダの `.jsx` / `.html` は **HTMLで作成したデザインリファレンス**（意図した見た目と挙動を示すプロトタイプ）であり、そのまま本番に貼るコードではありません。タスクは、これらのデザインを **対象コードベースの既存環境（React + Tailwind を想定）で、その規約・コンポーネント・ライブラリに沿って再現すること**です。環境が未整備なら、React + Tailwind での実装を推奨します（本リファレンスがまさにその構成）。

参考実装の構成メモ：
- React 18（UMD） + Babel standalone + Tailwind（Play CDN）で動く単一HTML。本番では Tailwind をビルド設定に組み込み、各 `.jsx` を通常のコンポーネントに分割してください。
- 画面間の遷移は軽量な `NavCtx`（React context）で実装。本番では React Router 等に置き換え可。
- フォントは **Noto Sans JP**（400/500/700/800/900）。
- `design-canvas.jsx` は**レビュー用のキャンバス枠**で、本番実装には不要です（無視可）。

## Fidelity
**High-fidelity（hifi）**。配色・タイポ・余白・角丸・影・コピー・主要インタラクションまで作り込み済み。下記トークンと各画面の指定どおりにピクセル単位で再現してください。スマホ縦持ち **390 × 844px（iPhone 14 Pro 論理サイズ）基準**、モバイルファースト。

---

## Design Tokens

### Colors
| 役割 | 値 |
|---|---|
| Hero Navy（夜のスタジアム最暗部） | `#061533` |
| Base Navy（アプリ背景・既定） | `#0a1f4c` |
| Navy 700（面の差・グラデ） | `#0d2a5e` |
| Navy elevated（バナー/カード上部グラデ） | `#11337a` / `#11367a` |
| Card White | `#FFFFFF` |
| Card Mist（白上のサブ面） | `#F0F4FA` |
| **日の丸 Red（primary）** | `#E60033`（hover `#cc002e` / active `#b30028`） |
| Red 明（グラデ相方・反応） | `#ff5a7a` / `#ff6a86` |
| **Gold（celebration）** | `#F4B400`（明 `#ffce4a`） |
| 文字（ネイビー上）：主/薄/弱/最弱 | `#FFFFFF` / `#C9D6EC` / `#8fa3c9` / `#5e74a0` |
| 文字（白カード上）：濃/グレー | `#0a1f4c` / `#5B6B85` |
| Success（W/上昇/的中） | `#0e8a46` / `#34d27e` |
| ポジション色（FW/MF/DF） | `#E60033` / `#F4B400` / `#2a5bd0` |
| LINE 緑 / X 黒 | `#06C755` / `#111` |

**運用ルール**：赤は「ここぞ」（CTA・勝敗・締切・YOU）、金は「祝福」（バッジ・カウントダウン・勝利）。多色使い禁止。ネイビー上の半透明面は `rgba(255,255,255,.05〜.08)`、境界は `rgba(255,255,255,.10〜.16)`。

### Typography（Noto Sans JP）
- Display（見出し）：900 black, 30–46px, line-height ~1.1
- Title：800 extrabold, 19–24px
- Numerals（強調数字）：900 black, **tabular-nums**, 26–92px（スコア・カウントダウン・統計）
- Body strong：700, 15px / Body：400–500, 13px
- Caption/label：700, 10–12px（薄白・トラッキング広め `0.2em` を見出しラベルに）

### Radius
icon chip 10–14px / カード `rounded-2xl`=16px / 大カード `rounded-3xl`=24px / シート `rounded-[28px]` / ピル・アバターは full。

### Shadow
- データカード：`0 10px 26px rgba(4,12,33,.30)`
- 主要CTA（赤）：`0 10px 26px rgba(230,0,51,.42)`
- ゴールドCTA：`0 10px 26px rgba(244,180,0,.40)`
- ヒーロー/モーダル：`0 18px 50px rgba(0,0,0,.45)`

### Spacing & Frame
- 4 / 8 / 12 / 16 / 24 スケール。画面横パディング `px-5`(20px)。セクション間 `mt-3〜mt-4`。
- 端末枠：上部ステータスバー（9:41＋電波/Wi-Fi/電池）、下部ホームインジケーター。アプリ内画面は下部に**ボトムタブバー（約62px）**。
- 余白は密度よりリズム優先（ブリーフ方針）。

---

## Navigation Map
```
welcome(HomeA/未参加)
 ├─「友達と大会を作る」→ create → invite →「大会ホームへ」→ home
 ├─「ひとりで予想を始める」→ onboarding(5ステップ) →「ホームへ」→ home
 └─「コードで参加」→ join →（コード入力でプレビュー）→ home

home(HomeB/参加済み) … ボトムタブ: home / predict / rank / chat / japan
 ├─ 🔔ベル → notif → ⚙️ → notifset
 ├─ 今日の試合カード → predict
 ├─ 順位カード → rank / バッジ・ストリーク → badge / コイン → shop
 └─ 日本戦バナー → japan

predict →「この予想で決定する」→ 完了モーダル →（シェア→share / 順位→rank）
predict / japan の得点者セクション →「全選手を見る/予想する」→ scorer → 確定 → predict
japan「速報」バナー → victory(win) ／ japan「演出プレビュー」チップ → victory(win|draw|lose)
victory →（シェア→share / 順位→rank / 閉じる）
```
`NavCtx = { go(screen), complete(pred), share(), victory(result), tab }`。`tab` が非nullのときボトムタブを表示（home/predict/rank/chat/japan）。それ以外（welcome/onboarding/notif/create/scorer等）はプッシュ遷移でヘッダーに戻るボタン。

---

## Screens / Views

> 共通：暗ネイビー背景 `#0a1f4c`、白カードは深い影で浮かせる。見出し白900、数字は太く大きく tabular-nums。

### 1. Design System（`ds.jsx`）
全トークンの一覧ボード（レビュー用）。本番では不要だが配色/タイポ/ボタン状態の基準として参照。

### 2. HomeA — 未参加（`home.jsx` / `HomeA`）
- **目的**：開いた瞬間に「W杯やってる！」を伝え、最短で参加へ。
- **ヒーロー**：CSS製の夜スタジアム（`linear-gradient(180deg,#061533,#0a1f4c,#0d2a5e)` + 上部フラッドライトの放射グロー + 星 + 遠近のピッチ `rotateX(64deg)` のストライプ芝＋センターサークル）。右上に開催3カ国旗チップ（CAN/USA/MEX）。
- **コピー**：ラベル「FIFA WORLD CUP 2026」/「北中米3カ国共催・史上初の48カ国」、見出し「夏が、はじまる。予想で、もっとアツく。」
- **カウントダウン**：半透明ネイビーカード、開幕まで DD:HH:MM:SS（DAYSは金）。下部に区切り線＋ **48カ国 / 16都市 / 104試合** の事実スタッツ。
- **CTA**：赤「友達と大会を作る」→ create／ゴースト「ひとりで予想を始める」→ onboarding／テキスト「招待された？コードで参加」→ join／折りたたみ「もっと遊ぶ」（2×2の遊びカード）。

### 3. HomeB — 参加済み（`home.jsx` / `HomeB`）
- **ヘッダー**：「大会 / 陸たちのW杯2026 🏆」＋ 🔔ベル（赤未読ドット）＋ 陸アバター。
- **日本戦カウントダウンバナー**（金枠グラデ、タップで japan）：「次の日本戦まで / 日本 vs ブラジル」＋ `17日 21:32` ＋「6/16(火) 22:00 KO」。
- **今日の試合フィーチャーカード**（白、タップで predict）：未予想3バッジ、アルゼンチン VS フランス、📍ダラス·AT&T Stadium、締切カウント、当たれば+3pt。
- **2×2ステータス**（白カード、各タップ遷移）：現在の順位3位/12人（▲2上昇）→rank、連続的中5🔥→badge、コイン残高1,240🪙→shop、獲得バッジ7/24→badge。
- **主要CTA**：赤「試合を予想する」→ predict。

### 4. 試合予想（`predict_rank.jsx` / `PredictScreen`）
- ヘッダー「試合を予想 / グループC第1節」＋ +3pt ピル。
- 試合カード（日本旗 vs ドイツ旗、📍シアトル·Lumen Field、締切 HH:MM）。
- **勝敗3択**（白ボタン、選択時=赤）：日本勝利2.4倍 / 引き分け3.1倍 / ドイツ勝利2.8倍。
- **コイン賭けスライダー**（`accent-[#E60033]`, 0–500）：賭け額・残高・的中で +N🪙。
- **得点者予想ミニ**（2×2、選択時=金枠）：本命%付き。ヘッダーに「全選手・本命を見る ›」→ scorer。
- 主要CTA「この予想で決定する」→ 完了モーダル。

### 5. ランキング（`predict_rank.jsx` / `RankingScreen`）
- 3タブ：試合予想 / 大会予想 / コインリッチ（白ピル=選択）。
- 表彰台（2-1-3、金/銀/銅リング、1位が大きい）＋リスト。自分（陸）の行は**白カードでハイライト＋YOUバッジ**。各タブでデータ差し替え。

### 6. 大会チャット（`chat_badges.jsx` / `ChatScreen`）
- ヘッダー「陸たちのW杯2026 / ●8人オンライン」＋重ねアバター。
- LINE風バブル（相手=白・左、自分=赤・右）、**リアクションピル**（絵文字＋数）、**引用返信**（左赤線の引用ブロック）、**予想カード投稿**（金枠ミニカード：日本2-1ドイツ）。
- **長押しメニュー**（1件に開いた状態）：絵文字リアクションバー＋「返信/引用して返信/コピー」。
- 入力バー（予想投稿ボタン＋テキスト＋送信）。

### 7. マイバッジ（`chat_badges.jsx` / `BadgeScreen`）
- 進捗リング（7/24, SVG circle dasharray, 金）＋「次は予言者まであと1的中」。
- 3列グリッド：獲得（色付き枠＋アイコン）／未獲得（lockアイコン・暗色）／進捗バー付き。

### 8. 日本代表モード（`japan_shop.jsx` / `JapanScreen`）
- ヒーロー（赤グロー）：次の日本戦カウントダウン DD:HH:MM:SS、日本 vs ブラジル、📍ロサンゼルス SoFi Stadium。
- **速報バナー**（赤、タップで victory(win)）：「日本 2-1 ドイツ 🎉 / あなたの予想 的中！」。
- **演出プレビュー（デモ）**：勝利/ドロー/敗戦チップ → victory(該当)。
- 応援クイック投稿（2×2、選択=赤）「ニッポン！/行け久保！/守れ！/🔥🔥🔥」＋「みんなの応援 24,812件」。
- 最近の戦績（W/W/D/L の丸バッジ＋スコア）。
- 得点者予想 みんなの本命（バー）＋「予想する ›」→ scorer。

### 9. コインショップ（`japan_shop.jsx` / `ShopScreen`）
- 残高カード（**金グラデ**）：1,240🪙。
- 毎日ログインボーナス（7日、済=緑チェック/本日=赤/未来=灰）＋「今日の+100🪙を受け取る」（押下で受取済み）。
- 無料ミッション一覧（予想3件/シェア/順位確認/友達招待 → +N🪙）。
- **換金不可の明示**（必須）：「コインはアプリ内専用。現金・景品への換金や出金不可。本サービスは賭博ではありません。」

### 10. シェアカード（`share.jsx` / `ShareCard`）— 9:16
- Spotify Wrapped 風の縦長ポスター（1080×1920相当、本リファレンスは可変）。夜空グロー＋3カ国旗、陸アバター、巨大「5」連続的中、会心の予想（日本2-1ドイツ・久保的中）、的中率72%/予想28/バッジ7、`#wcup予想`＋「大会に参加→」。
- `ShareOverlay`（`prototype.jsx`）：カードプレビュー＋LINE/X/画像を保存。

### 11. 結果演出 勝利/引き分け/敗戦（`victory.jsx` / `VictoryScreen result="win|draw|lose"`）
- フルスクリーン。**中央の日の丸ベタ円は無し**、上部ソフトグロー（win=金 / draw=青 / lose=弱）。
- **win**：金/赤/白の**紙吹雪**（CSS `wcFall`）＋「勝利！」＋2-1＋的中(緑✓)＋ +5pt/6連続🔥/+288🪙 ＋「予言者」獲得。
- **draw**：紙吹雪少なめ＋「ドロー」＋1-1＋引き分け予想的中 +3pt。
- **lose**：紙吹雪なし・沈静色＋「惜敗」＋1-2＋はずれ・連続リセット・前向きコピー＋「次の試合を予想する」。
- 各：score/recap はアニメ `wcRise`、見出しは `wcPopBig`。下部 CTA（シェア/順位/閉じる、loseは導線差し替え）。

### 12. オンボーディング（`onboarding.jsx` / `Onboarding`）— 30秒で初予想
- 5ステップ：(0)イントロ「30秒で、予想デビュー。」＋価値3点＋はじめる →(1)ニックネーム（候補チップ）→(2)どう遊ぶ？（作る/参加）→(3)最初の予想ワンタップ（日本/引分/ドイツ）→(4)完了「たった◯秒で参戦！」＋紙吹雪＋recap。
- ステップ1〜3に**進捗ドット＋経過秒数チップ**（リアルタイム計測、完了で確定表示）。

### 13. 通知（`notifications.jsx`）
- **LockScreen**：iOS風ロック画面（大時計9:41・6月15日(日)・赤「日本 vs ドイツ まで30分」ピル）＋すりガラス風プッシュ3枚（締切/キックオフ/友達が予想変更）＋「上にスワイプ」。
- **NotifCenter**：お知らせ一覧（今日/昨日、色付きアイコン、未読赤ドット、結果速報は金ハイライト、⚙️→notifset、「すべて既読」）。
- **NotifSettings**：トグル群（試合・予想 / ソーシャル / その他）、iOS風スイッチ（`Switch`、実動）。

### 14. 大会作成・招待（`tournament.jsx`）
- **CreateTournament**：大会名（候補チップ）＋絵文字アイコン、対象期間セグメント（全期間/グループS/決勝T）、採点ルール（勝敗+3pt=必須、得点者+2pt/スコア完全+5pt/番狂わせ+3pt=トグル）→「この設定で大会を作る」→ invite。
- **InviteScreen**：作成完了→招待コード「WC26-RIKU」＋**QRプレースホルダ**（モジュール格子＋3隅ファインダー）＋コピー、**LINEで招待**（緑）/X/リンクコピー、メンバー一覧（陸=HOST）→「大会ホームへ」。
- **JoinTournament**：WC26-＋4桁ボックス、コード入力で**大会プレビュー**（主催・11人参加・アバタースタック）→「この大会に参加する」。

### 15. インタラクティブ・プロトタイプ（`prototype.jsx` / `PrototypeApp`）
上記を `NavCtx` で接続した通し動作版。`CompletionModal`（予想完了の勝利演出風シート）と `ShareOverlay` を内包。

---

## Interactions & Behavior
- **遷移**：`NavCtx.go(screen)`。完了モーダル/シェア/勝敗演出はオーバーレイ（`absolute inset-0 z-40/50`）。
- **カウントダウン**：`useCountdown(targetDate)` が1秒間隔で DD/HH/MM/SS を返す（開幕=2026-06-11、日本戦=2026-06-16 はモック）。
- **押下フィードバック**：主要ボタンに `active:scale-[.98]`／小要素 `active:scale-90`、transition 150ms。
- **アニメ**（控えめ・上品）：`wcSheet`(シート上昇.34s) / `wcPop`・`wcPopBig`(出現) / `wcRise`(下から.5s段差ディレイ) / `wcFall`(紙吹雪 2.6–4.4s linear infinite, top:-20→translateY 900px+回転) / `wcGlow` / `wcSpin`。keyframes は `wcup-yosou デザインモック.html` の `<style>` 参照。
- **選択トグル**：勝敗3択・得点者複数選択・最初の得点者⭐・通知スイッチ・採点ルール・期間セグメント等は `useState` で即時反映。得点者は「選択数×2 + 最初の得点者で+1」をライブ計算。
- **スライダー**：コイン賭けは `<input type=range>` + `accent-[#E60033]`、payout = bet × odds。

## State Management
- 画面ローカル：`useState`（pick, bet, scorer選択集合, firstScorer, name, mode, period, rules, トグル群, onboarding step, copied 等）。
- グローバル：`NavCtx { go, complete(pred), share, victory(result), tab }`。本番は Router + 軽い store（Zustand/Context）で十分。
- データ取得（本番要件）：試合一覧・結果は **ESPN API**（自動取得・自動採点）。順位/コイン/バッジ/ストリークはサーバ計算。チャットはリアルタイム（WebSocket等）。

## Assets
- 画像アセットは未使用。国旗は**CSS製**（日の丸=白丸地に赤円、独=黒/赤/金の縦3分割、開催国=縦3分割の様式化チップ）。本番は適切な旗アセット/絵文字に差し替え可。
- アイコンは `shared.jsx` の `Icon`（単色パスの塗りアイコン集：trophy/flame/coin/chart/clock/calendar/ball/bolt/lock/check/pin/home/chat/bell/cog 等）。本番は既存アイコンライブラリ（filled系）にマッピング。
- QR・選手写真はプレースホルダ。本番は実QR生成・選手画像に差し替え。
- フォント：Google Fonts「Noto Sans JP」400/500/700/800/900。

## Files（このバンドル内）
| ファイル | 内容 |
|---|---|
| `wcup-yosou デザインモック.html` | エントリ（Tailwind設定・keyframes・スクリプト読込順） |
| `shared.jsx` | トークン的ユーティリティ：`useCountdown` / `Icon` / `Flag` / `MiniFlag` / `HostStrip` / `PhoneChrome` / `Avatar` / `ScreenHeader` / `Tabs` / `TabBar` / `NavCtx` |
| `ds.jsx` | デザインシステム一覧ボード |
| `home.jsx` | `HomeA`(未参加) / `HomeB`(参加済み) |
| `predict_rank.jsx` | `PredictScreen` / `RankingScreen` |
| `chat_badges.jsx` | `ChatScreen` / `BadgeScreen` |
| `japan_shop.jsx` | `JapanScreen` / `ShopScreen` |
| `share.jsx` | `ShareCard`（9:16） |
| `victory.jsx` | `VictoryScreen`(win/draw/lose) / `Confetti` |
| `onboarding.jsx` | `Onboarding`（5ステップ） |
| `notifications.jsx` | `LockScreen` / `NotifCenter` / `NotifSettings` / `Switch` |
| `tournament.jsx` | `CreateTournament` / `InviteScreen` / `JoinTournament` / `FauxQR` |
| `scorer.jsx` | `ScorerScreen`（得点者予想 深掘り） |
| `prototype.jsx` | `PrototypeApp` / `CompletionModal` / `ShareOverlay`（通し動作） |
| `app.jsx` | レビュー用キャンバス配置（本番不要） |
| `design-canvas.jsx` | レビュー用キャンバス枠（本番不要） |

> ローカルで開く場合は `wcup-yosou デザインモック.html` をブラウザで開けば全画面＋プロトタイプが動作します（要ネット：CDN/フォント）。

---

## Screenshots（`screens/`）
各画面の参照スクリーンショット（実レンダリングを 1.4倍で書き出し、390×844 / 9:16基準）。実装時のピクセル基準として使用してください。

| ファイル | 画面 |
|---|---|
| `screens/01-home-a.jpg` | ホーム（未参加）ヒーロー＋カウントダウン |
| `screens/02-home-b.jpg` | ホーム（参加済み）ステータス＋日本戦バナー |
| `screens/03-predict.jpg` | 試合予想（3択＋コイン＋得点者） |
| `screens/04-ranking.jpg` | ランキング（表彰台＋3タブ） |
| `screens/05-chat.jpg` | 大会チャット（長押しメニュー＋予想カード） |
| `screens/06-scorer.jpg` | 得点者予想（深掘り） |
| `screens/07-badges.jpg` | マイバッジ |
| `screens/08-japan.jpg` | 日本代表モード |
| `screens/09-shop.jpg` | コインショップ（換金不可明示） |
| `screens/10-share.jpg` | シェアカード（9:16） |
| `screens/11-result-win.jpg` | 結果演出（勝利） |
| `screens/12-result-draw.jpg` | 結果演出（引き分け） |
| `screens/13-result-lose.jpg` | 結果演出（敗戦） |
| `screens/14-onboarding.jpg` | オンボーディング（イントロ） |
| `screens/15-lockscreen.jpg` | ロック画面プッシュ通知 |
| `screens/16-notif-center.jpg` | お知らせセンター |
| `screens/17-notif-settings.jpg` | 通知設定 |
| `screens/18-create.jpg` | 大会を作る |
| `screens/19-invite.jpg` | 招待・シェア（QR＋コード） |
| `screens/20-join.jpg` | コードで参加 |

> 注：書き出し時に紙吹雪などの連続アニメは静止（ほぼ非表示）にしています。動きの仕様は本READMEの「Interactions & Behavior」を参照。フォントはレンダリング環境の Noto Sans JP / 代替日本語フォントです。
