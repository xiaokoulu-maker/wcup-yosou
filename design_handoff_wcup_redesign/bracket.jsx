// bracket.jsx — トーナメント表
const { useState } = React;

const R32 = [
  ["日本", "オランダ"], ["ブラジル", "スペイン"], ["フランス", "アメリカ"], ["アルゼンチン", "ウルグアイ"],
  ["イングランド", "パナマ"], ["", ""], ["", ""], ["", ""],
];
const R16 = [["日本", "ブラジル"], ["フランス", "アルゼンチン"], ["イングランド", ""], ["", ""]];
const R8 = [["日本", ""], ["", ""]];

function Slot({ a, b }) {
  const filled = a || b;
  return (
    <div className={"slot" + (filled ? " filled" : "")}>
      <div className="tm">{a ? <Flag name={a} /> : <span className="dotf"></span>}{a || "未定"}</div>
      <div className="vs-s">VS</div>
      <div className="tm">{b ? <Flag name={b} /> : <span className="dotf"></span>}{b || "未定"}</div>
    </div>
  );
}

function BracketApp() {
  const [toastNode, toast] = useToast();
  const [tab, setTab] = useState("table");
  return (
    <div className="screen">
      <div style={{ textAlign: "center", padding: "8px 18px 0" }}><BackRow href="home.html" label="戻る" /></div>
      <div style={{ textAlign: "center", padding: "8px 18px 2px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 900 }}><Icon name="trophy" size={20} style={{ verticalAlign: "-3px", marginRight: 7, color: "var(--gold)" }} />トーナメント表</h1>
        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 8, lineHeight: 1.6, fontWeight: 500 }}>自分と友達が予想している国をカードで確認。<br /><span style={{ color: "var(--gold)", fontFamily: "Roboto Mono", fontSize: 11 }}>0人</span>が優勝予想済み</p>
      </div>

      <div className="wrap section tight">
        <Tabs gold value={tab} onChange={setTab}
          items={[{ key: "table", label: "表" }, { key: "agg", label: "集計" }, { key: "me", label: "自分" }, { key: "friend", label: "友達" }]} />
      </div>

      <div className="wrap section">
        <div className="bracket-scroll">
          <div className="bracket">
            <div className="round">
              <div className="rt">ベスト32</div>
              {R32.map((s, i) => <Slot key={i} a={s[0]} b={s[1]} />)}
            </div>
            <div className="round" style={{ justifyContent: "space-around" }}>
              <div className="rt">ベスト16</div>
              {R16.map((s, i) => <Slot key={i} a={s[0]} b={s[1]} />)}
            </div>
            <div className="round" style={{ justifyContent: "space-around" }}>
              <div className="rt">準々決勝</div>
              {R8.map((s, i) => <Slot key={i} a={s[0]} b={s[1]} />)}
            </div>
            <div className="round" style={{ justifyContent: "center" }}>
              <div className="rt">優勝</div>
              <div className="slot filled" style={{ borderColor: "rgba(245,180,49,.5)", boxShadow: "0 0 0 1px rgba(245,180,49,.18)" }}>
                <div className="tm" style={{ color: "var(--gold)" }}><Flag name="日本" /> 日本</div>
                <div className="vs-s" style={{ color: "var(--gold)" }}><Icon name="crown" size={14} /></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="wrap section">
        <div className="note-card">
          ※ 現在は仮の組み合わせです。抽選後に正式な組み合わせへ更新されます。<br />
          ※ 青いカードは自分の予想、金は優勝予想を表します。
        </div>
      </div>

      <div className="wrap section">
        <a className="btn btn-dark md" href="home.html"><Icon name="back" size={17} stroke={2.2} /> 大会ページへ戻る</a>
      </div>

      {toastNode}
    </div>
  );
}
ReactDOM.createRoot(document.getElementById("root")).render(<BracketApp />);
