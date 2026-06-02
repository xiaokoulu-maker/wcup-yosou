// join.jsx — 参加する
const { useState } = React;
const AV_ICONS = ["ball", "flame", "crown", "star", "bolt", "trophy", "target", "shield", "medal", "whistle"];

function JoinApp() {
  const [toastNode, toast] = useToast();
  const [name, setName] = useState("");
  const [pick, setPick] = useState("ball");
  return (
    <div className="screen">
      <PageHead back="home.html" eyebrow="Join Tournament" title="参加する" />

      <div className="wrap section tight">
        <div className="card lg">
          <label className="field-lbl">ニックネーム</label>
          <input className="tinput" placeholder="例：サッカー太郎" value={name} onChange={(e) => setName(e.target.value)} maxLength={16} />

          <label className="field-lbl" style={{ marginTop: 22 }}>アイコンを選ぶ</label>
          <div className="icon-grid">
            {AV_ICONS.map((ic) => (
              <div key={ic} className={"icpick" + (pick === ic ? " on" : "")} onClick={() => setPick(ic)}>
                <Icon name={ic} size={22} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="wrap section">
        <button className="btn btn-red lg" onClick={() => toast(name ? `${name} で参加！` : "ニックネームを入力してください")}>
          参加して予想を入力する <Icon name="arrowRight" size={20} stroke={2.2} />
        </button>
        <div className="foot" style={{ marginTop: 14 }}>あとからプロフィールで変更できます</div>
      </div>

      {toastNode}
    </div>
  );
}
ReactDOM.createRoot(document.getElementById("root")).render(<JoinApp />);
