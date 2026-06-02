// predict.jsx — 試合を予想
const { useState } = React;

const MATCHES = [
  { group: "グループA", home: "アメリカ", away: "ウルグアイ", ko: "19:00", cd: "235h 48m", dt: "6/11", odds: { h: "5.0", d: "5.0", a: "1.2", fav: 2 }, reward: "+3pt" },
  { group: "グループA", home: "パナマ", away: "ボリビア", ko: "19:00", cd: "235h 48m", dt: "6/11", odds: { h: "2.1", d: "3.2", a: "3.4", fav: 0 }, reward: "+3pt" },
  { group: "グループA", home: "アメリカ", away: "パナマ", ko: "19:00", cd: "403h 48m", dt: "6/18", odds: { h: "1.6", d: "3.6", a: "5.2", fav: 0 }, reward: "+3pt" },
  { group: "グループA", home: "ウルグアイ", away: "ボリビア", ko: "19:00", cd: "403h 48m", dt: "6/18", odds: { h: "1.4", d: "4.2", a: "6.5", fav: 0 }, reward: "+3pt" },
  { group: "グループA", home: "アメリカ", away: "ボリビア", ko: "19:00", cd: "571h 48m", dt: "6/25", odds: { h: "1.3", d: "4.6", a: "7.0", fav: 0 }, reward: "+3pt" },
];

function PredictApp() {
  const [toastNode, toast] = useToast();
  const [tab, setTab] = useState("open");
  const [done, setDone] = useState({});
  return (
    <div className="screen">
      <PageHead back="home.html" eyebrow="あ 大会" title="試合を予想"
        right={<span className="chip red">+3pt</span>} />

      <div className="wrap section tight">
        <Banner tone="gold" icon="target">
          採点ルール：勝敗的中 <span className="pts">+3pt</span>　スコア完全的中 <span className="pts">+5pt</span> <span style={{ color: "var(--dim)" }}>(Phase B)</span>
        </Banner>
      </div>

      <div className="wrap section">
        <div className="grid3">
          <Stat label="累計PT" value="0" />
          <Stat label="的中数" value="0" />
          <Stat label="的中率" value="0" unit="%" color="gold" />
        </div>
      </div>

      <div className="wrap section">
        <Tabs value={tab} onChange={setTab}
          items={[{ key: "open", label: "受付中", count: "104" }, { key: "closed", label: "締切済", count: "0" }, { key: "fixed", label: "確定", count: "0" }]} />
      </div>

      <div className="wrap section" style={{ display: "flex", flexDirection: "column", gap: 13 }}>
        {tab === "open" ? MATCHES.map((m, i) => (
          <MatchCard key={i} {...m} predicted={done[i]}
            onPredict={() => { setDone((d) => ({ ...d, [i]: !d[i] })); toast(done[i] ? "予想を取消しました" : `${m.home} の勝ちで予想`); }} />
        )) : (
          <div className="card" style={{ textAlign: "center", padding: "40px 18px", color: "var(--dim)" }}>
            <Icon name="whistle" size={30} style={{ color: "var(--faint)" }} />
            <div style={{ marginTop: 12, fontSize: 13, fontWeight: 700, color: "var(--muted)" }}>該当する試合はまだありません</div>
          </div>
        )}
      </div>

      {toastNode}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<PredictApp />);
