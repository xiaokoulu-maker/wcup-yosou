# Handoff: W杯予想メーカー — 全画面 高級感リデザイン

> このドキュメントは **そのまま Claude に貼り付けて使える** ハンドオフ仕様書です。
> Claude に「この仕様をもとに、Claude Code で実装するためのプロンプト（タスク分割つき）を作って」と頼んでください。
> 末尾に「Claude への依頼文サンプル」も用意しています。

---

## 0. 概要 (Overview)

サッカーW杯の「予想メーカー」アプリ（モバイルWebが主）。友達と大会を作り、試合結果やスコアを予想して的中ポイントを競う。既存サイトの**全11画面**を、トップページ（"4年に1度の夏" の世界観）を基準に統一し、**白カード中心の安っぽい見た目を、深ネイビーのガラス調＋ゴールド/レッドの上質トーンに刷新**したもの。

## 1. このバンドルについて (About the Design Files)

同梱の HTML/JSX/CSS は **デザインの参照用プロトタイプ**（見た目と挙動の意図を示すもの）であり、本番にそのまま載せるコードではありません。実装タスクは「これらのデザインを、対象コードベースの既存環境（React / Next.js / Vue / SwiftUI など）の作法・既存コンポーネントで**忠実に再現する**こと」。環境がまだ無ければ、適切なフレームワーク（推奨: **React + TypeScript + CSS Modules もしくは Tailwind**）を選んで実装してよい。

プロトタイプは React 18（UMD）+ Babel standalone をブラウザ内トランスパイルで動かす簡易構成。本番ではビルド済みの構成に置き換えること。

## 2. 忠実度 (Fidelity)

**High-fidelity（ハイファイ）。** 配色・タイポ・余白・角丸・影・インタラクションまで作り込み済み。ピクセル単位で再現する前提で各値を以下に明記する。

---

## 3. デザイントークン (Design Tokens)

すべて `theme.css` の `:root` に定義。実装でも CSS 変数 / テーマ定数として一元管理すること。

### カラー
| 用途 | 変数 | 値 |
|---|---|---|
| 背景ベース | `--bg` | `#05060f` |
| 背景(深) | `--ink-deep` | `#080c1e` |
| パネル | `--panel` | `#0f1730` |
| カード grad 上 | `--card-a` | `rgba(22,30,60,.9)` |
| カード grad 下 | `--card-b` | `rgba(13,19,40,.9)` |
| 境界線 | `--line` | `rgba(132,152,214,.14)` |
| 境界線(淡) | `--line-soft` | `rgba(132,152,214,.09)` |
| 境界線(強) | `--line-strong` | `rgba(132,152,214,.22)` |
| 文字 | `--txt` | `#f3f5fb` |
| 文字(副) | `--muted` | `#8b93ad` |
| 文字(淡) | `--dim` | `#646d8a` |
| 文字(極淡) | `--faint` | `#4d5778` |
| レッド | `--red` / `--red-mid` / `--red-2` | `#ff3b41` / `#e8242e` / `#c41420` |
| レッドCTAグラデ | — | `linear-gradient(180deg,#ff4248 0%,#d2121e 100%)` |
| レッドグロー | `--red-glow` | `rgba(214,20,38,.45)` |
| ブルー | `--blue` / `--blue-2` | `#3e7bff` / `#1c47c8` |
| ゴールド | `--gold` / `--gold-soft` / `--gold-2` | `#f5b431` / `#f0c674` / `#e0990f` |
| LINEグリーン | `--green` | `#06c755` |
| ティール | `--teal` | `#0f8a6e` |
| 成功(オンライン) | — | `#37d67a` |

### 背景（全画面共通）
body は3層のラジアルグロー + 縦グラデを重ねる。画面コンテナ `.screen` は最大幅 **438px**、左右に淡い境界線、右上に赤のラジアルグロー。
```css
/* .screen */
background:
  radial-gradient(640px 420px at 88% 2%, rgba(220,30,46,.16), transparent 58%),
  linear-gradient(180deg,#0a1026 0%, #080c1e 22%, #070a18 100%);
```

### タイポグラフィ
- 本文・見出し: **Noto Sans JP**（400/500/700/800/900）
- 数字・コード・ラベル(英字): **Roboto Mono**（500/600/700）
- 見出し H1 18–30px / 900、セクション見出し 16px / 800、本文 13–14px、補助 10.5–12px
- 字間 `letter-spacing:.01em`（本文）、ラベルは `.1〜.34em`

### 角丸・余白・影
| トークン | 値 |
|---|---|
| `--radius` | 18px |
| `--radius-sm` | 13px |
| `--radius-lg` | 22px |
| 画面左右パディング `.wrap` | 18px |
| セクション間 `.section` | margin-top 20px（tight=13px） |
| カード影 | `0 12px 34px rgba(0,0,0,.32), inset 0 1px 0 rgba(255,255,255,.03)` |

---

## 4. 共通コンポーネント (Shared Components)

`ui.jsx`（React）と `theme.css` のクラスで提供。実装では各フレームワークのコンポーネントに置き換える。

- **`.screen`** — モバイル幅(438px)の画面コンテナ。
- **TopBar (`.topbar`)** — 左に大会バッジ＋タイトル、右に通知ベル(赤ドット)・自分アバター(赤丸)・ハンバーガー。`.icobtn` 36×36 角丸11px。
- **PageHead (`.phead`)** — `[戻る40px][中央タイトル 1fr][右40px]` の3カラム。中央に小ラベル(mono大文字)＋H1。戻るは `.b`（角丸ボタン）。
- **BackRow (`.backrow`)** — 「‹ 戻る」テキストリンク。
- **Eyebrow (`.eyebrow`)** — mono大文字＋短い横グラデ線。色は赤(既定)/ゴールド。
- **SectionHead (`.sechead`)** — 左に縦バー(赤 or ゴールド)＋太字見出し、右に小アクション「すべて見る ›」。
- **Card (`.card` / `.card.lg` / `.card.flush`)** — ガラス調カード。
- **Button (`.btn`)** — サイズ `lg`(58px) / `md`(50px) / `sm`(42px)。種類: `btn-red`(主), `btn-red.ghost`, `btn-blue`, `btn-gold`, `btn-line`(LINE緑＋"L"アイコン), `btn-dark`, `btn-teal`。`livetag` で「●LIVE」バッジ。
- **Tabs (`.tabs` / `.tabs.gold`)** — セグメント型。`.tab.on` がアクティブ(赤 or ゴールドのグラデ)。`count` を mono で併記可。
- **Stat (`.stat`)** — ラベル(任意アイコン)＋大きな数字＋単位＋補助。数字色: 既定 / `.red` / `.gold`。
- **Banner (`.banner.blue` / `.banner.gold`)** — 採点ルール等の情報帯。`.pts` でゴールドのポイント表記。
- **Chip (`.chip.gold/.red/.dim`)** — 丸ピル。`.dot` で先頭ドット。
- **Flag (`.flag` / `.flag.lg`)** — **国旗絵文字は使わない。** 3文字国コード(mono)を角丸チップで表示し、国の代表色を `border-color` と上辺 `inset box-shadow` で差す。`ui.jsx` の `TEAMS` マップ参照（例: 日本=JPN/#d7224b, フランス=FRA/#2f6bd6, アメリカ=USA/#3f6dd6）。
- **MatchCard (`.match`)** — 上段にグループタグ＋カウントダウン、中段に[home flag+名][VS+KO時刻][away flag+名]、下段に3分割オッズ(`.odd`、本命は `.fav`)＋予想ボタン＋「当たれば +3pt」。
- **rowcard / feat / toast / live** — リスト行・機能グリッドセル・トースト・オンライン点滅。
- **Icon (`icons.jsx`)** — 24×24 ストロークのラインアイコン集（ball, trophy, medal, flame, coin, chart, whistle, target, crown, users, person, chatBig, bell, menu, calendar, clock, flag, grid, bracket, star, gear, share, xLogo, globe, edit, refresh, camera, shop, gift, shield, lock, send, link, copy, check, chevron, arrowRight, plus, bolt 等）。本番では好みのアイコンライブラリ（lucide 等）の同等アイコンに置換可。

---

## 5. 画面一覧 (Screens / Views)

ナビゲーションは `index.html`(ハブ) を起点に相互リンク。実体は各 `*.html` + `*.jsx`。

### 5.1 index.html — 画面ハブ
全画面へのリンク一覧。ヒーロー（赤オーブ＋"全画面、同じ世界観へ。"）＋更新済みリストカード。**本番では不要**（開発時のナビ用）。

### 5.2 home.html — 大会ホーム（ダッシュボード）
- TopBar（大会「あ」/ ベル / 自分 / メニュー）
- **次の日本戦カード** `.next-card`: 青系グラデ＋右上ブルーグロー。eyebrow "NEXT JAPAN MATCH"、`日本 VS オランダ`、3タイル(`14 DAYS / 19 HOURS / 52 MIN`、mono 27px)、`6/16(火) 19:00 KICK OFF`。
- **今日の試合カード** `.today`: 「今日の試合」＋赤チップ「未予想 1」、[ENG イングランド][VS 22:00][FRA フランス]、フッターに「締切まで 235h 57m」(赤mono)＋「当たれば +3pt」(ゴールド)。
- **スタッツ 2×2** (`grid2` + Stat): 現在の順位 1位/1人、連続的中 0連続(赤)、コイン残高 1,000(ゴールド)、獲得バッジ 2/16。
- **CTA** `btn-red lg`「試合を予想する」→ predict.html。
- **その他の機能 4×2** (`grid4` + `.feat`): 優勝予想→my-prediction、日本代表(ゴールド強調)→samurai、ベスト11、グループ表→bracket、チャット→global-chat、バッジ→badges、コイン、設定→room。
- **`btn-teal lg`「友達を招待する」**→ room.html。

### 5.3 room.html — 大会ルーム
（独立スタイル内蔵。前段で作成済み）招待カード(URL コピー/ LINE / 招待コード `OJTWQ3PC`)、主要CTA(参加する / 試合予想・ライブランキング)、大会メニュー(アイコン付きリスト6件、1つはオレンジ強調)、管理者メニュー(破線)、アップグレード帯、チャット(空状態＋送信)、応援/PR枠。Tweaks パネル付き（ヒーロー表示・メインカラー・密度・PR表示）。

### 5.4 predict.html — 試合を予想
- PageHead（"あ 大会" / 「試合を予想」 / 右に赤チップ +3pt）
- `banner.gold`「採点ルール：勝敗的中 +3pt スコア完全的中 +5pt (Phase B)」
- スタッツ 3列: 累計PT 0 / 的中数 0 / 的中率 0%(ゴールド)
- Tabs「受付中 104 / 締切済 0 / 確定 0」
- MatchCard リスト（グループA、各カードにオッズ・予想ボタン）。予想ボタン押下でトグル＋トースト。

### 5.5 samurai.html — 日本代表モード
- PageHead（"SAMURAI BLUE" / flagアイコン＋「日本代表モード」 / 右に赤チップ JP）
- **ヒーロー** `.jp-hero`: 赤系グラデ＋赤グロー。「次の日本戦まで」「日本 VS オランダ」、大きなゴールド数字 `14日 19時 47分`、KO日時。
- **得点者予想**（gold SectionHead「全選手を見る ›」）: gold banner「的中で +5pt」＋プレイヤー 2×2(`.player`、選択でゴールド強調＋チェック)。#9 MF 三笘薫 / #20 MF 久保建英 / #11 FW 上田綺世 / #14 MF 伊東純也。
- Tabs「概要 / 予想 / 選手 / 展望」
- **グループF**: rank-row 4件（日本 FIFA18位[自国は赤], オランダ7位, チュニジア40位, スウェーデン44位）。
- **応援コメント**空状態＋「全体チャットを見る」。

### 5.6 mypage.html — マイページ
- PageHead（personアイコン＋「マイページ」）
- プロフィールカード（赤丸アバター「あ」＋名前＋「プロフィールを編集」赤リンク）
- スタッツ 2×2: 累計ポイント 0pt(ゴールド)/ 的中率 —/ 連続的中 0連続(赤, 自己ベスト0)/ 大会内順位 1位/1人
- 参加中の大会（rowcard「あ / 1位・1人中・0pt / 開く ›」→home）
- 最近の予想（カード内 pred-row 5件: 対戦 / →予想 / 日時 / 「未確定」タグ）
- その他 3列(feat): コインショップ / バッジ→badges / 全国ランキング→ranking

### 5.7 badges.html — マイ・バッジ
- PageHead（medal＋「マイ・バッジ」、戻る先 mypage）
- 進捗ヒーロー: conic-gradient のゴールドリング「2」＋「2/16 獲得」
- 獲得済み(gold SectionHead): badge-grid 3列、`.bcell.got`（ゴールド）2件＋「+14 を解放」
- あと一歩: `.bcell.near`（ブルー）4件＋進捗 mono
- 未獲得: ロックアイコン6件（opacity .62）
- バッジ一覧: blist-row（獲得=ゴールド＋チェック、未獲得=ロック＋進捗）

### 5.8 join.html — 参加する
- PageHead（"JOIN TOURNAMENT" / 「参加する」）
- カード: ニックネーム入力（`.tinput`、placeholder「例：サッカー太郎」）＋「アイコンを選ぶ」5列グリッド(`.icpick`、選択でゴールド強調)。
- `btn-red lg`「参加して予想を入力する →」（未入力時はトーストで促す）

### 5.9 my-prediction.html — 私のW杯予想
- PageHead（trophy＋「私のW杯予想」）
- カード: eyebrow "MY FINAL PICK"、`.champ`(JPNチップ＋「優勝予想 / 日本」)、`.kv` 2列(日本の成績=ベスト16 / 順位予想=通過枠)
- シェア: [Xで投稿(dark)][LINEで共有(green)] 横並び → URLをコピー(dark) → 友達と大会を作る(red lg) → 予想を作り直す(dark)→predict

### 5.10 global-chat.html — みんなの全体チャット
- 中央寄せヘッダ: BackRow＋eyebrow "GLOBAL CHAT"＋H1「みんなの全体チャット」＋説明文
- チャットカード `.card.flush`: ヘッダ(全体チャット / ●1人オンライン / 設定)、本文(最大360pxスクロール、`.cmsg` 吹き出し。主催は crown アバター＋"主催"バッジ)、入力(`.composer`＋赤「送信」)。Enter/クリックで送信。
- gold 注意帯「個人情報・誹謗中傷・スパムは禁止です。楽しくご利用ください。」

### 5.11 bracket.html — トーナメント表
- 中央寄せヘッダ（trophyゴールド＋「トーナメント表」＋説明＋「0人が優勝予想済み」）
- `tabs.gold`「表 / 集計 / 自分 / 友達」
- **横スクロールのブラケット** `.bracket-scroll`: 4ラウンド（ベスト32 8枠 / ベスト16 4枠 / 準々決勝 2枠 / 優勝1枠）。各 `.slot` は[国コードチップ＋国名][VS][国コードチップ＋国名]、未定枠は破線。優勝枠はゴールド＋crown。
- ブルー注記カード＋「大会ページへ戻る」

### 5.12 ranking.html — ランキング
- PageHead（chart＋「ランキング」、"あ 大会"）
- Tabs「試合予想 / 大会予想 / コイン / 全国」
- gold 採点ルール banner
- **表彰台** `.podium`（3カラム、下に台座ブロック 2/1/3）。1位はゴールド枠＋crown＋グロー(高さ120px)、2位(自分 "YOU" 赤)、3位は未定。
- `btn-red lg`「成績を画像でシェア」＋「大会ページへ戻る」

---

## 6. インタラクション (Interactions & Behavior)

- **ナビゲーション**: 全画面 `<a href>` で相互遷移。戻る＝前画面/ホーム。
- **予想トグル**: MatchCard / 得点者 / アイコン選択は選択状態をローカルstateで保持し、選択でゴールド強調＋トースト表示。
- **チャット送信**: 入力→Enter or 送信で吹き出し追加、最下部へスクロール。タイムスタンプは送信時刻。
- **コピー系**: 招待URL/コードは `navigator.clipboard.writeText` ＋トースト「コピーしました」。
- **トースト**: 画面下中央、1.7秒で自動消滅（`.toast.show`）。
- **トランジション**: ボタン押下 `transform:translateY(1px) scale(.992)`、ホバーで border 強調＋微移動 (.14s)。オンラインドットは脈動アニメ。
- **レスポンシブ**: 画面は最大438px固定幅でモバイル前提。広い画面では中央寄せ＋レターボックス（黒背景）。

## 7. 状態管理 (State Management)

プロトタイプはローカル state のみ。本番で必要になる想定データ:
- ユーザー（ニックネーム・アバター・累計pt・的中率・連続的中・コイン・バッジ進捗）
- 大会（参加者・順位・招待コード）
- 試合（対戦カード・KO日時・締切・オッズ・自分の予想・結果）
- 予想（試合ごとの選択・確定/未確定・獲得pt）
- チャット（全体/大会、メッセージ・投稿者・時刻）
- バッジ（定義・獲得状況・進捗）
- ランキング（種別タブごとの順位リスト）

## 8. アセット (Assets)

- フォント: Google Fonts「Noto Sans JP」「Roboto Mono」
- 画像なし。アイコンは全てインラインSVG（`icons.jsx`）。**国旗は使わず3文字国コードチップ**（環境差で絵文字が崩れるのを回避）。本番で実旗を使う場合も、フォールバックとしてコードチップを残すこと。

## 9. ファイル (Files)

| 種別 | ファイル |
|---|---|
| デザインシステム | `theme.css` |
| 共通UI(React) | `ui.jsx` |
| アイコン | `icons.jsx` |
| Tweaks(room用) | `tweaks-panel.jsx` |
| ハブ | `index.html` |
| 各画面 | `home`, `room`(+`app.jsx`), `predict`, `samurai`, `mypage`, `my-prediction`, `join`, `global-chat`, `ranking`, `badges`, `bracket` の `.html` + 同名 `.jsx` |

---

## 10. Claude への依頼文サンプル（コピペ用）

> 添付の `README.md` は、W杯予想アプリの全11画面のハイファイ・デザイン仕様です。これをもとに、**Claude Code に渡す実装プロンプトを作成してください**。条件:
> - 対象スタック: 〔ここに自分の環境を書く。例: Next.js(App Router) + TypeScript + Tailwind〕。未定なら推奨構成を提案して。
> - まず「デザインシステム(トークン＋共通コンポーネント)」を作るタスク、その後に画面を1枚ずつ実装するタスク、という順で**タスクを分割**して。
> - 各タスクに、参照すべきトークン値・コンポーネント仕様・受け入れ基準(Acceptance Criteria)を明記して。
> - 国旗はコードチップ方式を踏襲。配色・角丸・影・タイポは README の値を厳守。
> - 既存コードがある場合の組み込み方針（命名・ディレクトリ）も指示に含めて。
