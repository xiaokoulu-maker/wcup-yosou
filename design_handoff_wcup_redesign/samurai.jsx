// samurai.jsx — 日本代表モード
const { useState } = React;

const PLAYERS = [
  { no: "#9", pos: "MF", nm: "三笘 薫" },
  { no: "#20", pos: "MF", nm: "久保 建英" },
  { no: "#11", pos: "FW", nm: "上田 綺世" },
  { no: "#14", pos: "MF", nm: "伊東 純也" },
];
const GROUP_F = [
  { nm: "日本", fifa: "FIFA 18位", me: true },
  { nm: "オランダ", fifa: "FIFA 7位" },
  { nm: "チュニジア", fifa: "FIFA 40位" },
  { nm: "スウェーデン", fifa: "FIFA 44位" },
];

function SamuraiApp() {
  const [toastNode, toast] = useToast();
  const [tab, setTab] = useState("overview");
  const [pick, setPick] = useState(null);

  return (
    <div className="screen">
      <PageHead back="home.html" eyebrow="Samurai Blue" title="日本代表モード" icon="flag"
        right={<span className="chip red"><span className="dot"></span>JP</span>} />

      {/* hero countdown */}
      <div className="wrap section tight">
        <div className="jp-hero">
          <div className="glow"></div>
          <div className="lbl">次の日本戦まで</div>
          <div className="vs"><span className="jp">JP</span><span className="nm">日本<span className="x">VS</span>オランダ</span></div>
          <div className="big"><span className="n">14</span><span className="u">日</span><span className="n">19</span><span className="u">時</span><span className="n">47</span><span className="u">分</span></div>
          <div className="ko"><Icon name="calendar" size={14} /> 6/16(火) 19:00 KICK OFF</div>
        </div>
      </div>

      {/* scorer prediction */}
      <div className="wrap section">
        <SectionHead title="日本の得点者を予想" gold action="全選手を見る" onAction={() => toast("全選手一覧")} />
        <div className="banner gold" style={{ marginBottom: 12 }}>
          <Icon name="target" size={15} /><div>的中で <span className="pts">+5pt</span>。誰が決める？</div>
        </div>
        <div className="players">
          {PLAYERS.map((p) => (
            <div key={p.no} className={"player" + (pick === p.no ? " on" : "")} onClick={() => { setPick(p.no); toast(`${p.nm} を予想`); }}>
              <span className="chk"><Icon name={pick === p.no ? "check" : "plus"} size={17} /></span>
              <div className="pos">{p.no} {p.pos}</div>
              <div className="nm">{p.nm}</div>
            </div>
          ))}
        </div>
      </div>

      {/* tabs */}
      <div className="wrap section">
        <Tabs value={tab} onChange={setTab}
          items={[{ key: "overview", label: "概要" }, { key: "predict", label: "予想" }, { key: "players", label: "選手" }, { key: "outlook", label: "展望" }]} />
      </div>

      {/* group F */}
      <div className="wrap section">
        <SectionHead title="グループF ・ 日本代表" />
        <div className="card">
          {GROUP_F.map((g) => (
            <div key={g.nm} className={"rank-row" + (g.me ? " me" : "")}>
              <Flag name={g.nm} />
              <div className="nm">{g.nm}</div>
              <div className="fifa">{g.fifa}</div>
            </div>
          ))}
        </div>
      </div>

      {/* cheer comments */}
      <div className="wrap section">
        <SectionHead title="みんなの応援コメント" />
        <div className="card" style={{ textAlign: "center", padding: "30px 18px" }}>
          <Icon name="chatBig" size={28} style={{ color: "var(--faint)" }} />
          <div style={{ marginTop: 11, fontSize: 12.5, color: "var(--dim)", fontWeight: 600, lineHeight: 1.6 }}>
            大会に参加すると<br />応援コメントが表示されます
          </div>
          <a className="btn btn-dark sm" href="global-chat.html" style={{ marginTop: 14, width: "auto", display: "inline-flex", padding: "0 18px" }}>
            <Icon name="chatBig" size={16} /> 全体チャットを見る
          </a>
        </div>
      </div>

      {toastNode}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<SamuraiApp />);
