// global-chat.jsx — みんなの全体チャット
const { useState, useRef, useEffect } = React;

const SEED = [
  { nm: "ゆうき", ic: "ball", text: "今回初めて興味ちゃんと持ちました。ワールドカップ楽しみです", time: "00:17" },
  { nm: "か", ic: "ball", text: "か", time: "17:33" },
  { nm: "さ", ic: "ball", text: "コメント", time: "23:50" },
  { nm: "さ", ic: "ball", text: "テスト", time: "23:50" },
  { nm: "ピーチ姫", ic: "crown", crown: true, text: "皆さんのコメント楽しみに待ってます", time: "23:51" },
  { nm: "ピーチ姫", ic: "crown", crown: true, text: "意見交流したいです", time: "23:51" },
];

function GlobalChatApp() {
  const [toastNode, toast] = useToast();
  const [msgs, setMsgs] = useState(SEED);
  const [val, setVal] = useState("");
  const bodyRef = useRef(null);
  const send = () => {
    const v = val.trim(); if (!v) return;
    const t = new Date(); const time = `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
    setMsgs((m) => [...m, { nm: "あなた", ic: "ball", text: v, time, me: true }]); setVal("");
  };
  useEffect(() => { if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight; }, [msgs]);

  return (
    <div className="screen">
      <div style={{ textAlign: "center", padding: "8px 18px 0" }}>
        <BackRow href="home.html" label="戻る" />
      </div>
      <div style={{ textAlign: "center", padding: "10px 18px 4px" }}>
        <div className="eyebrow" style={{ justifyContent: "center" }}>Global Chat</div>
        <h1 style={{ fontSize: 24, fontWeight: 900, marginTop: 12 }}><Icon name="chatBig" size={22} style={{ verticalAlign: "-3px", marginRight: 7, color: "#ff5a60" }} />みんなの全体チャット</h1>
        <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 9, lineHeight: 1.6, fontWeight: 500 }}>W杯について、誰とでも話せるチャットです。<br />予想・応援・感想を投稿しよう。</p>
      </div>

      <div className="wrap section">
        <div className="card flush">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid var(--line-soft)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <Icon name="chatBig" size={19} style={{ color: "#7ea2ff" }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 800 }}>全体チャット</div>
                <div className="live" style={{ marginTop: 2, fontSize: 10.5 }}><span className="blip"></span> 1人オンライン</div>
              </div>
            </div>
            <div className="icobtn" onClick={() => toast("チャット設定")}><Icon name="gear" size={18} /></div>
          </div>

          <div ref={bodyRef} style={{ maxHeight: 360, overflowY: "auto", padding: "16px 16px 4px" }}>
            {msgs.map((m, i) => (
              <div className="cmsg" key={i}>
                <div className={"av" + (m.crown ? " crown" : "")}><Icon name={m.crown ? "crown" : "ball"} size={17} /></div>
                <div className="col">
                  <div className="nm">{m.nm}{m.crown && <span className="badge">主催</span>}</div>
                  <div className="bbl">{m.text}</div>
                  <div className="meta"><span>{m.time}</span><span className="rep" onClick={() => toast("返信")}>↩ 返信</span></div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding: "12px 16px", borderTop: "1px solid var(--line-soft)" }}>
            <div className="composer">
              <input value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="メッセージを入力…" />
              <button className="btn btn-red" style={{ width: 78, height: 48 }} onClick={send}>送信</button>
            </div>
          </div>
        </div>
        <div className="banner" style={{ marginTop: 12, background: "rgba(255,180,60,.07)", border: "1px solid rgba(245,180,49,.2)", color: "#d8b88a" }}>
          <Icon name="shield" size={15} /><div>個人情報・誹謗中傷・スパムは禁止です。楽しくご利用ください。</div>
        </div>
      </div>

      {toastNode}
    </div>
  );
}
ReactDOM.createRoot(document.getElementById("root")).render(<GlobalChatApp />);
