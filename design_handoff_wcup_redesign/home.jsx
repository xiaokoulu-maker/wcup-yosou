// home.jsx — 大会ホーム (dashboard)
const { useState } = React;

const FEATURES = [
  { ic: "trophy", t: "優勝予想", href: "my-prediction.html" },
  { ic: "flag", t: "日本代表", href: "samurai.html", hl: true },
  { ic: "star", t: "ベスト11", href: "#" },
  { ic: "grid", t: "グループ表", href: "bracket.html" },
  { ic: "chatBig", t: "チャット", href: "global-chat.html" },
  { ic: "medal", t: "バッジ", href: "badges.html" },
  { ic: "coin", t: "コイン", href: "#" },
  { ic: "gear", t: "設定", href: "room.html" },
];

function HomeApp() {
  const [toastNode, toast] = useToast();
  return (
    <div className="screen">
      {/* top bar */}
      <div className="topbar">
        <div className="ttl">
          <div className="badge">あ</div>
          <div className="meta">
            <div className="k">大会</div>
            <div className="v">あ</div>
          </div>
        </div>
        <div className="acts">
          <div className="icobtn dot" onClick={() => toast("お知らせ")}><Icon name="bell" size={19} /></div>
          <a className="icobtn me" href="mypage.html">あ</a>
          <div className="icobtn" onClick={() => toast("メニュー")}><Icon name="menu" size={19} /></div>
        </div>
      </div>

      {/* next Japan match */}
      <div className="wrap section tight">
        <div className="next-card">
          <div className="glow"></div>
          <div className="eyebrow" style={{ color: "#7ea2ff" }}>Next Japan Match</div>
          <div className="teams-line">
            <span className="jp">JP</span>
            <span className="vs-t">日本<span className="x">VS</span>オランダ</span>
          </div>
          <div className="cd-row">
            <div className="cd-tile"><div className="n">14</div><div className="l">DAYS</div></div>
            <div className="cd-tile"><div className="n">19</div><div className="l">HOURS</div></div>
            <div className="cd-tile"><div className="n">52</div><div className="l">MIN</div></div>
          </div>
          <div className="ko-line"><Icon name="calendar" size={14} /> 6/16(火) 19:00 KICK OFF</div>
        </div>
      </div>

      {/* today's match */}
      <div className="wrap section">
        <div className="card today">
          <div className="top">
            <div className="l"><span className="i"><Icon name="whistle" size={17} /></span> 今日の試合</div>
            <span className="chip red"><span className="dot"></span> 未予想 1</span>
          </div>
          <div className="teams">
            <div className="team"><Flag name="イングランド" lg /><span className="nm">イングランド</span></div>
            <div className="vs">VS<span className="ko">22:00</span></div>
            <div className="team"><Flag name="フランス" lg /><span className="nm">フランス</span></div>
          </div>
          <div className="ft">
            <div className="dl"><Icon name="clock" size={14} /> 締切まで <b>235h 57m</b></div>
            <div className="rw">当たれば +3pt</div>
          </div>
        </div>
      </div>

      {/* stats */}
      <div className="wrap section">
        <div className="grid2">
          <Stat icon="chart" label="現在の順位" value="1" unit="位 / 1人" />
          <Stat icon="flame" label="連続的中" value="0" unit="連続" color="red" />
          <Stat icon="coin" label="コイン残高" value="1,000" color="gold" />
          <Stat icon="medal" label="獲得バッジ" value="2" unit="/ 16" />
        </div>
      </div>

      {/* primary CTA */}
      <div className="wrap section">
        <a className="btn btn-red lg rel" href="predict.html">
          <Icon name="whistle" size={21} /> 試合を予想する
        </a>
      </div>

      {/* other features */}
      <div className="wrap section">
        <SectionHead title="この大会のその他の機能" />
        <div className="grid4">
          {FEATURES.map((f) => (
            <a className={"feat" + (f.hl ? " hl" : "")} key={f.t} href={f.href}
               onClick={(e) => { if (f.href === "#") { e.preventDefault(); toast(f.t); } }}>
              <div className="fi"><Icon name={f.ic} size={20} /></div>
              <div className="ft">{f.t}</div>
            </a>
          ))}
        </div>
      </div>

      {/* invite */}
      <div className="wrap section">
        <a className="btn btn-teal lg" href="room.html">
          <Icon name="users" size={20} /> 友達を招待する
        </a>
      </div>

      {toastNode}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<HomeApp />);
