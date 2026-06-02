// ranking.jsx — ランキング
const { useState } = React;
function RankingApp() {
  const [toastNode, toast] = useToast();
  const [tab, setTab] = useState("match");
  return (
    <div className="screen">
      <PageHead back="home.html" eyebrow="あ 大会" title="ランキング" icon="chart" />

      <div className="wrap section tight">
        <Tabs value={tab} onChange={setTab}
          items={[{ key: "match", label: "試合予想" }, { key: "cup", label: "大会予想" }, { key: "coin", label: "コイン" }, { key: "all", label: "全国" }]} />
      </div>

      <div className="wrap section">
        <Banner tone="gold" icon="target">
          採点ルール：勝敗的中 <span className="pts">+3pt</span>　スコア完全的中 <span className="pts">+5pt</span> <span style={{ color: "var(--dim)" }}>(Phase B)</span>
        </Banner>
      </div>

      <div className="wrap section">
        <div className="card lg">
          <div className="podium">
            <div className="pod second">
              <div className="av"><Icon name="ball" size={26} /></div>
              <div className="nm">あ <span className="you">YOU</span></div>
              <div className="pt">0 pt</div>
              <div className="block">2</div>
            </div>
            <div className="pod first">
              <div className="av"><span className="crown"><Icon name="crown" size={22} /></span><Icon name="ball" size={34} /></div>
              <div className="nm">あ</div>
              <div className="pt">0 pt</div>
              <div className="block">1</div>
            </div>
            <div className="pod third">
              <div className="av" style={{ opacity: .4 }}><Icon name="person" size={22} /></div>
              <div className="nm" style={{ color: "var(--faint)" }}>—</div>
              <div className="pt">—</div>
              <div className="block">3</div>
            </div>
          </div>
        </div>
      </div>

      <div className="wrap section">
        <button className="btn btn-red lg" onClick={() => toast("成績画像を生成")}><Icon name="camera" size={20} /> 成績を画像でシェア</button>
        <a className="btn btn-dark md" href="home.html" style={{ marginTop: 9 }}><Icon name="back" size={17} stroke={2.2} /> 大会ページへ戻る</a>
      </div>

      {toastNode}
    </div>
  );
}
ReactDOM.createRoot(document.getElementById("root")).render(<RankingApp />);
