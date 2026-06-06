/**
 * NGワードリスト
 *
 * 追加・編集・削除はこのファイルの NG_WORDS 配列だけ変えればOKです。
 * 記載形式:
 *   - 日本語(漢字) : 漢字のまま  例 "運営"
 *   - 日本語(読み) : ひらがなで  例 "うんえい"  (カタカナ入力は自動変換されます)
 *   - 英語        : 小文字で    例 "admin"
 */
export const NG_WORDS = [

  // ── 運営・公式・管理者装い ──────────────────────────────────
  "admin", "administrator",
  "staff",
  "official",
  "system",
  "moderator", "もでれーたー",
  "support", "さぽーと",
  "operator",
  "運営", "うんえい",
  "公式", "こうしき",
  "管理", "かんり",         // 管理者・管理人・管理アカ など全般
  "事務局", "じむきょく",
  "公認", "こうにん",
  "主催", "しゅさい",       // 主催者装いも含める

  // ── 性的・わいせつ ────────────────────────────────────────
  // 日本語（漢字・ひらがな）
  "射精", "しゃせい",
  "強姦", "ごうかん",
  "痴漢", "ちかん",
  "性器", "せいき",
  "きんたま",
  "ちんこ", "ちんちん", "ちんぽ",
  "まんこ", "おまんこ",
  "いんもう",
  "うんこ",
  "しっこ",
  "えっち",
  "えろ",
  "おなにー",
  "ふぇら",
  "くんに",
  "れいぷ",
  "せっくす",
  // ローマ字・英語
  "chinko", "chinpo", "manko",
  "sex",
  "fuck",
  "pussy",
  "cock",
  "dick",
  "asshole",
  "bitch",
  "cunt",
  "porn",
  "hentai",
  "rape",
  "masturbat",           // masturbate / masturbation など

  // ── 差別・攻撃的・脅迫 ───────────────────────────────────
  "死ね", "しね",
  "殺す", "ころす",
  "ぶっころ",
  "きちがい",
  "池沼",
  "白痴", "はくち",
  "nigger",
  "faggot",
  "chink",
];

/**
 * 入力文字列を正規化する
 *   1. NFKC 正規化（全角→半角、濁点結合など）
 *   2. 小文字化
 *   3. カタカナ → ひらがな
 *   4. 英数字・ひらがな・漢字以外（スペース・記号など）を除去
 */
export function normalizeText(str) {
  if (!str) return "";
  let s = str.normalize("NFKC");
  s = s.toLowerCase();
  // カタカナ(ァ-ヶ) → ひらがな(ぁ-け)
  s = s.replace(/[ァ-ヶ]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x60));
  // 英数字・ひらがな・漢字以外を除去
  s = s.replace(/[^a-z0-9ぁ-ゖ一-鿿]/g, "");
  return s;
}

const _normalizedNgWords = NG_WORDS.map(normalizeText);

/**
 * ニックネームが NG_WORDS のいずれかを含む場合 true を返す
 * どの単語に引っかかったかは返さない（回避のヒント防止）
 */
export function checkNickname(str) {
  const norm = normalizeText(str);
  if (!norm) return false;
  return _normalizedNgWords.some(w => w && norm.includes(w));
}
