// app.jsx — 大会ルーム (tournament room)
const { useState, useRef, useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "heroStyle": "members",
  "primary": "#d2121e",
  "density": "regular",
  "showPromos": true
}/*EDITMODE-END*/;

const INVITE_URL = "https://wcup-yosou.app/r/OJTWQ3PC";
const CODE = "OJTWQ3PC";

function useToast() {
  const [msg, setMsg] = useState(null);
  const t = useRef(null);
  const show = (m) => {
    setMsg(m);
    clearTimeout(t.current);
    t.current = setTimeout(() => setMsg(null), 1700);
  };
  const node = (
    <div className={"toast" + (msg ? " show" : "")}>
      <span className="ok">✓</span> {msg}
    </div>
  );
  return [node, show];
}

function HeroMembers({ heroStyle }) {
  const cur = 1, max = 5;
  const pct = Math.round((cur / max) * 100);
  return (
    <div className="members">
      {heroStyle === "members" && (
        <React.Fragment>
          <div className="members-top">
            <div className="avatars">
              <div className="av" style={{ background: "linear-gradient(160deg,#ff4147,#c41420)" }}>あ</div>
              <div className="av empty">+</div>
              <div className="av empty">+</div>
              <div className="av empty">+</div>
              <div className="av empty">+</div>
            </div>
            <div className="count"><b>1</b> <span>/ 5人</span></div>
          </div>
          <div className="pbar"><i style={{ width: pct + "%" }}></i></div>
        </React.Fragment>
      )}
      {heroStyle === "numbers" && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18, padding: "4px 0 2px" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 40, fontWeight: 900, color: "#fff", lineHeight: 1 }}>1</div>
            <div style={{ fontFamily: "Roboto Mono", fontSize: 10, letterSpacing: ".18em", color: "var(--muted)", marginTop: 5 }}>PLAYERS</div>
          </div>
          <div style={{ fontSize: 30, color: "#3b4365", fontWeight: 300 }}>/</div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 40, fontWeight: 900, color: "var(--gold)", lineHeight: 1 }}>5</div>
            <div style={{ fontFamily: "Roboto Mono", fontSize: 10, letterSpacing: ".18em", color: "var(--muted)", marginTop: 5 }}>MAX</div>
          </div>
        </div>
      )}
      {heroStyle === "progress" && (
        <div style={{ padding: "2px 0" }}>
          <div className="members-top">
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--muted)" }}>参加メンバー</div>
            <div className="count"><b>1</b> <span>/ 5人</span></div>
          </div>
          <div className="pbar"><i style={{ width: pct + "%" }}></i></div>
          <div style={{ fontSize: 11, color: "var(--dim)", marginTop: 8, fontWeight: 600 }}>あと4人まで無料で招待できます</div>
        </div>
      )}
      <div className="live"><span className="blip"></span> リアルタイム更新中</div>
    </div>
  );
}

function MenuRow({ icon, title, sub, active, accent, onClick }) {
  return (
    <div className={"mrow" + (active ? " active" : "") + (accent ? " accent" : "")} onClick={onClick}>
      <div className="ico"><Icon name={icon} size={21} /></div>
      <div className="tx">
        <div className="t">{title}</div>
        {sub && <div className="s">{sub}</div>}
      </div>
      <div className="chev"><Icon name="chevron" size={18} stroke={2} /></div>
    </div>
  );
}

function Chat({ toast }) {
  const [msgs, setMsgs] = useState([]);
  const [val, setVal] = useState("");
  const bodyRef = useRef(null);
  const send = () => {
    const v = val.trim();
    if (!v) return;
    setMsgs((m) => [...m, { id: Date.now(), text: v, me: true }]);
    setVal("");
  };
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [msgs]);
  return (
    <div className="card section">
      <div className="chat-head">
        <div className="l">
          <Icon name="chatBig" size={22} style={{ color: "#7ea2ff" }} />
          <div>
            <h2>チャット</h2>
            <div className="online"><span className="blip"></span> 1人オンライン</div>
          </div>
        </div>
        <div className="chat-gear" onClick={() => toast("チャット設定")}><Icon name="gear" size={19} /></div>
      </div>
      <div className="chat-body" ref={bodyRef}>
        {msgs.length === 0 ? (
          <div className="empty">
            <div className="bub"><Icon name="chat" size={26} /></div>
            <div className="t">まだメッセージがありません</div>
            <div className="s">最初のメッセージを送って、みんなと盛り上がろう！</div>
          </div>
        ) : (
          msgs.map((m) => (
            <div className="msg" key={m.id}>
              <div className="av">あ</div>
              <div>
                <div className="nm">あなた</div>
                <div className="bbl">{m.text}</div>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="composer">
        <input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="メッセージを入力…"
        />
        <button className="btn sendbtn" onClick={send}><Icon name="send" size={20} /></button>
      </div>
    </div>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [toastNode, toast] = useToast();
  const [active, setActive] = useState("check");
  const [copied, setCopied] = useState(false);

  const copy = (text, label) => {
    navigator.clipboard && navigator.clipboard.writeText(text).catch(() => {});
    toast(label);
  };

  const redGrad = `linear-gradient(180deg, ${shade(t.primary, 18)} 0%, ${t.primary} 100%)`;

  return (
    <div id="app" className={t.density}>
      {/* top bar */}
      <div className="topbar">
        <div className="brand"><b>FIFA</b> WORLD CUP 2026</div>
        <div className="pill-x">W杯予想メーカー</div>
      </div>
      <div className="backrow"><Icon name="back" size={17} stroke={2.2} /> 大会一覧に戻る</div>

      {/* hero */}
      <div className="hero">
        <div className="orb"></div>
        <div className="eyebrow">Tournament Room</div>
        <div className="hero-card">
          <div className="hero-top">
            <div className="t-avatar" style={{ background: `linear-gradient(160deg, ${shade(t.primary,22)}, ${t.primary})` }}>
              あ<span className="ring"></span>
            </div>
            <div className="meta">
              <div className="hero-title">あ</div>
              <div className="plan-badge"><span className="dot"></span> 無料プラン・5人まで</div>
            </div>
          </div>
          <HeroMembers heroStyle={t.heroStyle} />
        </div>
      </div>

      {/* invite */}
      <div className="wrap section">
        <div className="sechead">
          <h2>友達を招待しよう</h2>
          <div className="act">あと4枠</div>
        </div>
        <div className="card invite">
          <div className="row">
            <div className="urlfield"><Icon name="link" size={16} style={{ color: "#6b7596", flex: "none" }} /><span className="u">{INVITE_URL}</span></div>
            <button className="btn btn-gold" onClick={() => { copy(INVITE_URL, "URLをコピーしました"); setCopied(true); }}>
              <Icon name="copy" size={16} /> {copied ? "済み" : "コピー"}
            </button>
          </div>
          <button className="btn btn-line" onClick={() => toast("LINEを開きます")}>
            <span className="lk">L</span> LINEで友達に送る
          </button>
          <div className="codepill" onClick={() => copy(CODE, "招待コードをコピーしました")}>
            <span className="lbl">招待コード</span>
            <span className="code">{CODE}</span>
            <span className="ic"><Icon name="copy" size={15} /></span>
          </div>
        </div>
      </div>

      {/* primary CTAs */}
      <div className="wrap section">
        <button className="btn cta cta-red" style={{ background: redGrad }} onClick={() => toast("予想を確定して参加")}>
          <Icon name="check" size={21} /> この大会に参加する
        </button>
        <button className="btn cta cta-red" style={{ background: redGrad }} onClick={() => toast("ライブランキングへ")}>
          <span className="livetag"><span className="b"></span>LIVE</span>
          <Icon name="bolt" size={21} /> 試合予想・ライブランキング
        </button>
      </div>

      {/* menu */}
      <div className="wrap section">
        <div className="sechead"><h2>大会メニュー</h2></div>
        <div className="menu">
          <MenuRow icon="users" title="みんなの予想を見る" sub="参加者の優勝予想を一覧" onClick={() => { setActive("users"); toast("みんなの予想"); }} active={active === "users"} />
          <MenuRow icon="trophy" title="ランキングを見る" sub="的中スコアで競争" onClick={() => { setActive("rank"); toast("ランキング"); }} active={active === "rank"} />
          <MenuRow icon="sliders" title="詳細設定を見る" sub="大会ルール・公開範囲" onClick={() => { setActive("settings"); toast("詳細設定"); }} active={active === "settings"} />
          <MenuRow icon="bracket" title="トーナメント表・予想マップ" sub="勝ち上がりを予想" onClick={() => { setActive("bracket"); toast("トーナメント表"); }} active={active === "bracket"} />
          <MenuRow icon="check" title="予想状況チェック" sub="未入力の試合をまとめて確認" onClick={() => setActive("check")} active={active === "check"} />
          <MenuRow icon="grid" title="グループ別・FIFAランキング" sub="32カ国のデータを確認" onClick={() => { setActive("groups"); toast("グループ別"); }} active={active === "groups"} accent />
        </div>
      </div>

      {/* admin / upgrade */}
      <div className="wrap section">
        <div className="admin" onClick={() => toast("管理者メニュー")}>
          <div className="ico"><Icon name="shield" size={19} /></div>
          <div className="tx">
            <div className="t">管理者メニュー</div>
            <div className="s">詳細入力・参加者管理</div>
          </div>
          <Icon name="chevron" size={18} style={{ color: "#4d5778" }} />
        </div>
        <div className="upgrade" onClick={() => toast("プランを見る")}>
          <div className="ico"><Icon name="sparkle" size={20} /></div>
          <div className="tx">5人まで無料。<b>友達が増えたらアップグレード</b>できます</div>
          <div className="go"><Icon name="arrowRight" size={18} stroke={2.2} /></div>
        </div>
      </div>

      {/* chat */}
      <div className="wrap">
        <Chat toast={toast} />
      </div>

      {/* promos */}
      {t.showPromos && (
        <div className="wrap section">
          <div className="promo" onClick={() => toast("コーヒーを贈る")}>
            <div className="ico"><Icon name="coffee" size={20} /></div>
            <div className="tx">
              <div className="t">開催記念コーヒーを贈る</div>
              <div className="s">手数料0で開発を応援・継続課金なし</div>
            </div>
            <div className="price">¥100</div>
          </div>
          <div className="pr-row" onClick={() => toast("企画ページ")}>
            <span className="tag">PR</span>
            <div className="tx">みんなで応援する企画</div>
            <div className="go">開く <Icon name="chevron" size={14} stroke={2.2} /></div>
          </div>
        </div>
      )}

      <div className="foot">招待されたら <b>コードで参加</b></div>

      {toastNode}

      <TweaksPanel>
        <TweakSection label="ヒーロー表示" />
        <TweakRadio label="メンバー表示" value={t.heroStyle}
          options={["members", "numbers", "progress"]}
          onChange={(v) => setTweak("heroStyle", v)} />
        <TweakSection label="テーマ" />
        <TweakColor label="メインカラー" value={t.primary}
          options={["#d2121e", "#1c47c8", "#e0990f", "#7a3ae0"]}
          onChange={(v) => setTweak("primary", v)} />
        <TweakSection label="レイアウト" />
        <TweakRadio label="密度" value={t.density}
          options={["compact", "regular", "comfy"]}
          onChange={(v) => setTweak("density", v)} />
        <TweakToggle label="応援・PR枠を表示" value={t.showPromos}
          onChange={(v) => setTweak("showPromos", v)} />
      </TweaksPanel>
    </div>
  );
}

// lighten a hex color by pct toward white
function shade(hex, pct) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  r = Math.round(r + (255 - r) * (pct / 100));
  g = Math.round(g + (255 - g) * (pct / 100));
  b = Math.round(b + (255 - b) * (pct / 100));
  return `rgb(${r},${g},${b})`;
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
