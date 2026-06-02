// ui.jsx — shared components for all pages. Exports to window.
const { useState, useRef, useEffect } = React;

// lighten hex toward white by pct
function shade(hex, pct) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  r = Math.round(r + (255 - r) * (pct / 100));
  g = Math.round(g + (255 - g) * (pct / 100));
  b = Math.round(b + (255 - b) * (pct / 100));
  return `rgb(${r},${g},${b})`;
}

const TEAMS = {
  "日本": ["JPN", "#d7224b"], "オランダ": ["NED", "#f36c21"], "ブラジル": ["BRA", "#1ca64c"],
  "フランス": ["FRA", "#2f6bd6"], "スペイン": ["ESP", "#d3324a"], "アルゼンチン": ["ARG", "#6aaee0"],
  "イングランド": ["ENG", "#d44b58"], "アメリカ": ["USA", "#3f6dd6"], "ウルグアイ": ["URU", "#3f7fd6"],
  "パナマ": ["PAN", "#cf3145"], "ボリビア": ["BOL", "#1ca64c"], "チュニジア": ["TUN", "#d3324a"],
  "スウェーデン": ["SWE", "#e0b53a"], "ドイツ": ["GER", "#c9a23a"], "ポルトガル": ["POR", "#1ca64c"],
  "クロアチア": ["CRO", "#d3324a"], "ベルギー": ["BEL", "#e0b53a"], "韓国": ["KOR", "#3f6dd6"],
};
function Flag({ name, lg }) {
  const [code, color] = TEAMS[name] || ["???", "#8b93ad"];
  return (
    <span className={"flag" + (lg ? " lg" : "")}
      style={{ borderColor: color + "66", boxShadow: "inset 0 2px 0 " + color }}>{code}</span>
  );
}

// toast hook
function useToast() {
  const [msg, setMsg] = useState(null);
  const t = useRef(null);
  const show = (m) => { setMsg(m); clearTimeout(t.current); t.current = setTimeout(() => setMsg(null), 1700); };
  const node = <div className={"toast" + (msg ? " show" : "")}><span className="ok">✓</span> {msg}</div>;
  return [node, show];
}

function BackRow({ href = "index.html", label = "戻る" }) {
  return <a className="backrow" href={href}><Icon name="back" size={17} stroke={2.2} /> {label}</a>;
}

function PageHead({ back = "index.html", eyebrow, title, icon, right }) {
  return (
    <div className="phead">
      <a className="b" href={back}><Icon name="back" size={18} stroke={2.2} /></a>
      <div className="t">
        {eyebrow && <div className="s">{eyebrow}</div>}
        <h1>{icon && <Icon name={icon} size={18} />}{title}</h1>
      </div>
      <div className="r">{right}</div>
    </div>
  );
}

function SectionHead({ title, gold, action, onAction }) {
  return (
    <div className="sechead">
      <h2 className={gold ? "gold" : ""}>{title}</h2>
      {action && <div className="act" onClick={onAction}>{action} <Icon name="chevron" size={13} stroke={2} /></div>}
    </div>
  );
}

function Stat({ icon, label, value, unit, color, sub }) {
  return (
    <div className="stat">
      <div className="lbl">{icon && <span className="i"><Icon name={icon} size={15} /></span>}{label}</div>
      <div className={"num" + (color ? " " + color : "")}>{value}{unit && <span className="u">{unit}</span>}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}

function Tabs({ items, value, onChange, gold }) {
  return (
    <div className={"tabs" + (gold ? " gold" : "")}>
      {items.map((it) => {
        const key = typeof it === "string" ? it : it.key;
        const label = typeof it === "string" ? it : it.label;
        const count = typeof it === "object" ? it.count : null;
        return (
          <div key={key} className={"tab" + (value === key ? " on" : "")} onClick={() => onChange(key)}>
            {label}{count != null && <span className="c">{count}</span>}
          </div>
        );
      })}
    </div>
  );
}

function Banner({ tone = "blue", icon, children }) {
  return (
    <div className={"banner " + tone}>
      {icon && <Icon name={icon} size={15} />}
      <div>{children}</div>
    </div>
  );
}

// match card used on 試合を予想
function MatchCard({ group, flag, home, away, ko, cd, dt, odds, reward, onPredict, predicted }) {
  return (
    <div className="match">
      <div className="top">
        <div className="grp"><span className="tag">{group}</span></div>
        <div className="when"><span className="cd">あと {cd}</span><span className="dt">{dt}</span></div>
      </div>
      <div className="teams">
        <div className="team"><Flag name={home} lg /><span className="nm">{home}</span></div>
        <div className="vs">VS<span className="ko">{ko}</span></div>
        <div className="team"><Flag name={away} lg /><span className="nm">{away}</span></div>
      </div>
      {odds && (
        <div className="odds">
          <div className={"odd" + (odds.fav === 0 ? " fav" : "")}><div className="o-l">{home}</div><div className="o-v">{odds.h}</div></div>
          <div className="odd"><div className="o-l">引き分け</div><div className="o-v">{odds.d}</div></div>
          <div className={"odd" + (odds.fav === 2 ? " fav" : "")}><div className="o-l">{away}</div><div className="o-v">{odds.a}</div></div>
        </div>
      )}
      <button className="btn btn-dark sm" style={{ marginTop: 12 }} onClick={onPredict}>
        <Icon name={predicted ? "check" : "whistle"} size={17} /> {predicted ? "予想を変更する" : "予想する"}
      </button>
      {reward && <div className="reward">当たれば <b>{reward}</b></div>}
    </div>
  );
}

Object.assign(window, {
  shade, Flag, TEAMS, useToast, BackRow, PageHead, SectionHead, Stat, Tabs, Banner, MatchCard,
});
