// badges.jsx — マイ・バッジ
const GOT = [
  { ic: "ball", nm: "予想デビュー" },
  { ic: "target", nm: "予想初的中" },
];
const NEAR = [
  { ic: "whistle", nm: "予想30試合", p: "12 / 30" },
  { ic: "grid", nm: "グループ完全予想", p: "1 / 8" },
  { ic: "flame", nm: "3試合連続的中", p: "0 / 3" },
  { ic: "star", nm: "5試合的中", p: "1 / 5" },
];
const LOCKED = [
  { ic: "trophy", nm: "10試合的中" },
  { ic: "crown", nm: "大会優勝" },
  { ic: "share", nm: "予想シェア" },
  { ic: "globe", nm: "全国デビュー" },
  { ic: "coin", nm: "1000コイン" },
  { ic: "medal", nm: "TOP3入賞" },
];
const LIST = [
  { ic: "ball", nm: "予想デビュー", d: "はじめての予想を入れた", got: true },
  { ic: "target", nm: "予想初的中", d: "はじめて予想が的中した", got: true },
  { ic: "whistle", nm: "予想30試合", d: "通算30試合を予想する", d2: "12 / 30" },
  { ic: "grid", nm: "グループ完全予想", d: "1グループ全試合を予想", d2: "1 / 8" },
  { ic: "flame", nm: "3連続的中", d: "3試合連続で的中させる", d2: "0 / 3" },
  { ic: "trophy", nm: "10試合的中", d: "通算10的中を達成", d2: "3 / 10" },
  { ic: "crown", nm: "大会優勝", d: "大会で1位になる", d2: "—" },
  { ic: "globe", nm: "全国ランキング入り", d: "全国ランキングに載る", d2: "—" },
];

function BadgesApp() {
  const [toastNode, toast] = useToast();
  return (
    <div className="screen">
      <PageHead back="mypage.html" title="マイ・バッジ" icon="medal" />

      <div className="wrap section tight">
        <div className="card lg">
          <div className="bprog">
            <div className="ring"><span>2</span></div>
            <div>
              <div className="t">2 / 16 獲得</div>
              <div className="s">バッジを集めて全国プレイヤーへ</div>
            </div>
          </div>
        </div>
      </div>

      <div className="wrap section">
        <SectionHead title="獲得済み" gold />
        <div className="badge-grid">
          {GOT.map((b) => (
            <div className="bcell got" key={b.nm}><div className="bi"><Icon name={b.ic} size={20} /></div><div className="bn">{b.nm}</div></div>
          ))}
          <div className="bcell" style={{ justifyContent: "center", color: "var(--faint)", fontSize: 11, fontWeight: 600 }}>+14 を解放</div>
        </div>
      </div>

      <div className="wrap section">
        <SectionHead title="あと一歩" />
        <div className="badge-grid">
          {NEAR.map((b) => (
            <div className="bcell near" key={b.nm}><div className="bi"><Icon name={b.ic} size={20} /></div><div className="bn">{b.nm}</div><div className="bp">{b.p}</div></div>
          ))}
        </div>
      </div>

      <div className="wrap section">
        <SectionHead title="未獲得" />
        <div className="badge-grid">
          {LOCKED.map((b) => (
            <div className="bcell" key={b.nm} style={{ opacity: .62 }}><div className="bi"><Icon name="lock" size={18} /></div><div className="bn">{b.nm}</div></div>
          ))}
        </div>
      </div>

      <div className="wrap section">
        <SectionHead title="バッジ一覧" />
        <div className="card">
          {LIST.map((b) => (
            <div className={"blist-row" + (b.got ? " got" : "")} key={b.nm}>
              <div className="bi"><Icon name={b.got ? b.ic : "lock"} size={18} /></div>
              <div className="mid"><div className="bn">{b.nm}</div><div className="bd">{b.d}</div></div>
              {b.got ? <span className="chk"><Icon name="check" size={19} /></span> : <span className="st" style={{ fontFamily: "Roboto Mono", fontSize: 10.5, color: "var(--dim)", fontWeight: 700 }}>{b.d2}</span>}
            </div>
          ))}
        </div>
      </div>

      {toastNode}
    </div>
  );
}
ReactDOM.createRoot(document.getElementById("root")).render(<BadgesApp />);
