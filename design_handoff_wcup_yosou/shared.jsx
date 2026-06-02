// shared.jsx — palette, icons, phone chrome, countdown hook
// Exported to window for the other babel scripts.

const WCUP_KICKOFF = new Date('2026-06-11T19:00:00+09:00'); // 開幕
const JP_KICKOFF   = new Date('2026-06-16T22:00:00+09:00'); // 次の日本戦（モック）

// Navigation context for the interactive prototype. Defaults are no-ops so
// the standalone reference-board screens render & behave unchanged.
const NavCtx = React.createContext({ go: () => {}, complete: () => {}, share: () => {}, victory: () => {}, tab: null });

function useCountdown(target) {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  let diff = Math.max(0, target.getTime() - now);
  const d = Math.floor(diff / 86400000); diff -= d * 86400000;
  const h = Math.floor(diff / 3600000);  diff -= h * 3600000;
  const m = Math.floor(diff / 60000);    diff -= m * 60000;
  const s = Math.floor(diff / 1000);
  const p = (n) => String(n).padStart(2, '0');
  return { d, h, m, s, dd: p(d), hh: p(h), mm: p(m), ss: p(s) };
}

// ── Filled UI icons (heavy / shape-based, per brief: avoid thin outlines) ──
function Icon({ name, size = 20, className = '', style }) {
  const P = {
    trophy: 'M6 3h12v2h3v3a4 4 0 0 1-4 4 6 6 0 0 1-4 3.4V18h3v3H8v-3h3v-2.6A6 6 0 0 1 7 12a4 4 0 0 1-4-4V5h3V3Zm0 4H5v1a2 2 0 0 0 1 1.7V7Zm12 0v2.7A2 2 0 0 0 19 8V7h-1Z',
    flame: 'M13 2c.5 3-1.5 4.2-2.7 5.6C9 9 8 10.2 8 12a4 4 0 0 0 1.2 2.9C8.5 14.6 8 13.7 8 13c0-2 2-3 2.6-5 .8 1 1.4 1.6 2.2 2.6C14 12 15 13 15 15a5 5 0 1 1-10 0c0-3.2 2.2-5 3.7-6.8C10.2 6.4 12.7 4.7 13 2Z',
    coin: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 3.5c2.8 0 5 .9 5 2s-2.2 2-5 2-5-.9-5-2 2.2-2 5-2Zm5 5.2c0 1.1-2.2 2-5 2s-5-.9-5-2v3c0 1.1 2.2 2 5 2s5-.9 5-2v-3Z',
    chart: 'M4 13h4v7H4v-7Zm6-6h4v13h-4V7Zm6-4h4v17h-4V3Z',
    clock: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 5h-2v6l5 3 1-1.7-4-2.3V7Z',
    calendar: 'M7 2v2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7ZM5 9h14v10H5V9Z',
    plus: 'M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5Z',
    chevron: 'M8.5 5.5 15 12l-6.5 6.5L7 17l5-5-5-5 1.5-1.5Z',
    chevdown: 'M5.5 8.5 12 15l6.5-6.5L17 7l-5 5-5-5-1.5 1.5Z',
    share: 'M14 9V5l7 7-7 7v-4.1C9 11.8 6 13 3 18c0-7 5-9 11-9Z',
    ball: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 3 3 2.2-1.1 3.5h-3.8L9 7.2 12 5Zm-6.5 6 2.7-.2 1.2 3.6-2.2 1.8A8 8 0 0 1 5.5 11Zm13 0a8 8 0 0 1-1.7 5.2l-2.2-1.8 1.2-3.6 2.7.2ZM9.7 19.4l1.2-2.5h2.2l1.2 2.5a8 8 0 0 1-4.6 0Z',
    bolt: 'M13 2 4 14h6l-1 8 9-12h-6l1-8Z',
    lock: 'M12 2a4 4 0 0 0-4 4v3H6v13h12V9h-2V6a4 4 0 0 0-4-4Zm-2 7V6a2 2 0 1 1 4 0v3h-4Z',
    check: 'M9.5 17.5 4 12l1.7-1.7 3.8 3.8 8.8-8.8L20 7l-10.5 10.5Z',
    pin: 'M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z',
    home: 'M12 3 2 11h3v9h6v-6h2v6h6v-9h3L12 3Z',
    bell: 'M12 2a6 6 0 0 0-6 6v3.8L4 15.2V17h16v-1.8L18 11.8V8a6 6 0 0 0-6-6Zm0 20a3 3 0 0 0 2.8-2H9.2A3 3 0 0 0 12 22Z',
    cog: 'M19.4 13a7.5 7.5 0 0 0 0-2l2-1.6-2-3.4-2.4 1a7.3 7.3 0 0 0-1.7-1l-.3-2.6H9l-.3 2.6a7.3 7.3 0 0 0-1.7 1l-2.4-1-2 3.4L2.6 11a7.5 7.5 0 0 0 0 2l-2 1.6 2 3.4 2.4-1c.5.4 1.1.8 1.7 1l.3 2.6h6l.3-2.6c.6-.2 1.2-.6 1.7-1l2.4 1 2-3.4-2-1.6ZM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z',
    chat: 'M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H9l-4.5 4V5a1 1 0 0 1 1-1Zm3.5 5.5a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Zm4.5 0a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Zm4.5 0a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Z',
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style} fill="currentColor" aria-hidden="true">
      <path d={P[name] || P.ball} />
    </svg>
  );
}

// JP flag chip
function Flag({ size = 22 }) {
  return (
    <span style={{ width: size, height: Math.round(size * 0.7), borderRadius: 3, background: '#fff',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(0,0,0,.25)' }}>
      <span style={{ width: size * 0.46, height: size * 0.46, borderRadius: '50%', background: '#E60033' }} />
    </span>
  );
}

// Stylised mini host-nation flag (vertical thirds). Used as a 2026 nod.
function MiniFlag({ stripes, w = 18 }) {
  return (
    <span style={{ display: 'inline-flex', width: w, height: Math.round(w * 0.68), borderRadius: 2, overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,.35)' }}>
      {stripes.map((c, i) => <span key={i} style={{ flex: 1, background: c }} />)}
    </span>
  );
}

const HOSTS_2026 = [
  { code: 'CAN', stripes: ['#FF0000', '#fff', '#FF0000'] },
  { code: 'USA', stripes: ['#3c3b6e', '#fff', '#B22234'] },
  { code: 'MEX', stripes: ['#006847', '#fff', '#CE1126'] },
];

// Tri-nation host strip — "this year's World Cup" signal.
function HostStrip({ codes = true }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {HOSTS_2026.map((h) => (
        <span key={h.code} className="inline-flex items-center gap-1">
          <MiniFlag stripes={h.stripes} />
          {codes && <span className="text-[10px] font-extrabold tracking-wide" style={{ color: '#C9D6EC' }}>{h.code}</span>}
        </span>
      ))}
    </span>
  );
}

// Round avatar with initial.
function Avatar({ name, size = 36, bg = 'linear-gradient(135deg,#0d2a5e,#2a5bd0)', ring }) {
  return (
    <span className="flex items-center justify-center font-black text-white shrink-0"
      style={{ width: size, height: size, borderRadius: '50%', background: bg, fontSize: size * 0.42, boxShadow: ring ? `0 0 0 2.5px ${ring}` : '0 2px 6px rgba(0,0,0,.25)' }}>{name}</span>
  );
}

// Dark-screen sub-header: back chevron + title + optional right node.
function ScreenHeader({ title, sub, right, onBack }) {
  const nav = React.useContext(NavCtx);
  return (
    <div className="flex items-center gap-3 px-5 pt-3 pb-3 shrink-0">
      <button onClick={() => (onBack ? onBack() : nav.go('home'))} className="flex items-center justify-center shrink-0 active:scale-90 transition-transform" style={{ width: 34, height: 34, borderRadius: 11, background: 'rgba(255,255,255,.08)', color: '#fff' }}>
        <span style={{ display: 'inline-flex', transform: 'scaleX(-1)' }}><Icon name="chevron" size={20} /></span>
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-white font-black text-[17px] leading-tight truncate">{title}</p>
        {sub && <p className="text-[11px] font-bold truncate" style={{ color: '#8fa3c9' }}>{sub}</p>}
      </div>
      {right}
    </div>
  );
}

// Bottom tab bar for the interactive prototype. 日本 tab uses the flag chip.
function TabBar({ active, go }) {
  const items = [['home', 'home', 'ホーム'], ['predict', 'ball', '予想'], ['rank', 'chart', '順位'], ['chat', 'chat', 'チャット'], ['japan', null, '日本']];
  return (
    <div className="shrink-0 flex items-stretch px-1.5 pt-2 pb-4" style={{ borderTop: '1px solid rgba(255,255,255,.08)', background: '#081a40' }}>
      {items.map(([id, ic, label]) => {
        const on = active === id;
        return (
          <button key={id} onClick={() => go(id)} className="flex-1 flex flex-col items-center gap-1 py-0.5 active:scale-90 transition-transform">
            {ic ? <Icon name={ic} size={21} style={{ color: on ? '#E60033' : '#5e74a0' }} />
              : <span style={{ opacity: on ? 1 : .55, filter: on ? 'none' : 'grayscale(.3)' }}><Flag size={20} /></span>}
            <span className="text-[10px] font-bold whitespace-nowrap" style={{ color: on ? '#fff' : '#5e74a0' }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

// Pill tab bar. tabs: string[]; controlled by active/onChange.
function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 p-1 rounded-2xl mx-5" style={{ background: 'rgba(255,255,255,.07)' }}>
      {tabs.map((t, i) => (
        <button key={t} onClick={() => onChange(i)}
          className="flex-1 rounded-xl py-2 text-[12.5px] font-extrabold whitespace-nowrap transition-all"
          style={i === active
            ? { background: '#fff', color: '#0a1f4c', boxShadow: '0 4px 12px rgba(0,0,0,.25)' }
            : { background: 'transparent', color: '#8fa3c9' }}>{t}</button>
      ))}
    </div>
  );
}

// iPhone status bar + home-indicator wrapper. dark=true → light glyphs.
function PhoneChrome({ children, dark = true, statusInk }) {
  const ink = statusInk || (dark ? '#FFFFFF' : '#0a1f4c');
  const nav = React.useContext(NavCtx);
  return (
    <div className="h-full w-full flex flex-col overflow-hidden" style={{ fontFamily: '"Noto Sans JP", sans-serif' }}>
      {/* status bar */}
      <div className="flex items-center justify-between px-6 pt-3 pb-1 shrink-0" style={{ color: ink }}>
        <span className="text-[15px] font-bold tracking-tight" style={{ fontVariantNumeric: 'tabular-nums' }}>9:41</span>
        <div className="flex items-center gap-1.5">
          {/* signal */}
          <svg width="17" height="11" viewBox="0 0 17 11" fill={ink}><rect x="0" y="7" width="3" height="4" rx="1"/><rect x="4.5" y="5" width="3" height="6" rx="1"/><rect x="9" y="2.5" width="3" height="8.5" rx="1"/><rect x="13.5" y="0" width="3" height="11" rx="1"/></svg>
          {/* wifi */}
          <svg width="16" height="11" viewBox="0 0 16 11" fill={ink}><path d="M8 11 .5 3.6a10.5 10.5 0 0 1 15 0L8 11Z" opacity=".95"/></svg>
          {/* battery */}
          <span className="flex items-center gap-0.5">
            <span style={{ width: 22, height: 11, borderRadius: 3, border: `1.5px solid ${ink}`, opacity: .9, display: 'inline-flex', alignItems: 'center', padding: 1.5 }}>
              <span style={{ background: ink, width: '78%', height: '100%', borderRadius: 1 }} />
            </span>
            <span style={{ width: 1.5, height: 4, background: ink, borderRadius: 1, opacity: .9 }} />
          </span>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden relative">{children}</div>
      {/* tab bar in-app, otherwise the home indicator */}
      {nav && nav.tab ? (
        <TabBar active={nav.tab} go={nav.go} />
      ) : (
        <div className="shrink-0 flex justify-center py-2">
          <span style={{ width: 134, height: 5, borderRadius: 3, background: dark ? 'rgba(255,255,255,.55)' : 'rgba(10,31,76,.35)' }} />
        </div>
      )}
    </div>
  );
}

Object.assign(window, { useCountdown, Icon, Flag, MiniFlag, HostStrip, HOSTS_2026, PhoneChrome, Avatar, ScreenHeader, Tabs, TabBar, NavCtx, WCUP_KICKOFF, JP_KICKOFF });
