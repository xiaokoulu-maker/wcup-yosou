// my-prediction.jsx — 私のW杯予想
function MyPredictionApp() {
  const [toastNode, toast] = useToast();
  return (
    <div className="screen">
      <PageHead back="home.html" title="私のW杯予想" icon="trophy" />

      <div className="wrap section tight">
        <div className="card lg">
          <div className="eyebrow gold">My Final Pick</div>
          <div className="champ" style={{ marginTop: 12 }}>
            <span className="big-flag" style={{ boxShadow: "inset 0 3px 0 #d7224b, 0 6px 16px rgba(0,0,0,.35)" }}>JPN</span>
            <div>
              <div className="lbl">優勝予想</div>
              <div className="nm">日本</div>
            </div>
          </div>
          <div className="kv">
            <div><div className="k">日本の成績</div><div className="v">ベスト16</div></div>
            <div><div className="k">順位予想</div><div className="v">通過 <span style={{ color: "var(--gold)", fontSize: 13 }}>枠</span></div></div>
          </div>
        </div>
      </div>

      <div className="wrap section">
        <SectionHead title="シェアする" />
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          <div style={{ display: "flex", gap: 9 }}>
            <button className="btn btn-dark md" onClick={() => toast("Xに投稿")}><Icon name="xLogo" size={17} /> Xで投稿</button>
            <button className="btn btn-line md" onClick={() => toast("LINEで共有")}><span className="lk">L</span> LINEで共有</button>
          </div>
          <button className="btn btn-dark md" onClick={() => toast("URLをコピーしました")}><Icon name="link" size={17} /> URLをコピー</button>
          <button className="btn btn-red lg" onClick={() => toast("大会を作成")}><Icon name="trophy" size={20} /> 友達と大会を作る</button>
          <a className="btn btn-dark md" href="predict.html"><Icon name="refresh" size={17} /> 予想を作り直す</a>
        </div>
      </div>

      {toastNode}
    </div>
  );
}
ReactDOM.createRoot(document.getElementById("root")).render(<MyPredictionApp />);
