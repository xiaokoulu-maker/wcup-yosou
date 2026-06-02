// scorer.jsx — 得点者予想（深掘り）：日本代表スカッドから複数選択 + 最初の得点者 + みんなの本命

const SQUAD = [
  { no: 10, name: '久保建英', pos: 'MF', pct: 38, hot: true },
  { no: 20, name: '上田綺世', pos: 'FW', pct: 31 },
  { no: 13, name: '三笘 薫', pos: 'MF', pct: 28 },
  { no: 9, name: '南野拓実', pos: 'FW', pct: 19 },
  { no: 14, name: '堂安 律', pos: 'MF', pct: 16 },
  { no: 11, name: '伊東純也', pos: 'MF', pct: 12 },
  { no: 8, name: '鎌田大地', pos: 'MF', pct: 9 },
  { no: 15, name: '町野修斗', pos: 'FW', pct: 5, dark: true },
];
const POS_COL = { FW: '#E60033', MF: '#F4B400', DF: '#2a5bd0' };

function ScorerScreen() {
  const nav = React.useContext(NavCtx);
  const [sel, setSel] = React.useState(['久保建英']);
  const [first, setFirst] = React.useState('久保建英');

  const toggle = (n) => setSel((s) => {
    if (s.includes(n)) { const ns = s.filter((x) => x !== n); if (first === n) setFirst(ns[0] || null); return ns; }
    return [...s, n];
  });
  const pts = sel.length * 2 + (first ? 1 : 0);

  return (
    <PhoneChrome dark>
      <div className="h-full flex flex-col" style={{ background: '#0a1f4c' }}>
        <ScreenHeader title="得点者予想" sub="日本 vs ドイツ · 当てて加点"
          right={<span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full whitespace-nowrap" style={{ background: 'rgba(244,180,0,.16)', color: '#F4B400' }}>+2pt/人</span>} />

        <div className="flex-1 min-h-0 overflow-hidden px-5 pb-3 flex flex-col">
          {/* 最初の得点者ボーナス */}
          <div className="rounded-2xl px-4 py-2.5 flex items-center gap-3" style={{ background: 'linear-gradient(110deg,#0d2a5e,#11367a)', border: '1px solid rgba(244,180,0,.35)' }}>
            <span className="text-[20px]">🥇</span>
            <div className="flex-1 min-w-0">
              <p className="text-white font-black text-[13.5px] whitespace-nowrap">最初の得点者ボーナス <span style={{ color: '#F4B400' }}>+3pt</span></p>
              <p className="text-[11px] font-bold whitespace-nowrap" style={{ color: '#8fa3c9' }}>{first ? `本命：${first}` : '下の★で1人を指名'}</p>
            </div>
          </div>

          <p className="text-[12px] font-extrabold mt-2.5 mb-1.5" style={{ color: '#C9D6EC' }}>得点する選手を選ぶ <span style={{ color: '#8fa3c9' }}>（複数OK）</span></p>

          {/* roster */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <div className="flex flex-col gap-1.5">
              {SQUAD.map((p) => {
                const on = sel.includes(p.name);
                const isFirst = first === p.name;
                return (
                  <div key={p.no} className="flex items-center gap-3 rounded-2xl px-3 py-2 transition-all"
                    style={on ? { background: '#fff', boxShadow: '0 6px 18px rgba(4,12,33,.25)' } : { background: 'rgba(255,255,255,.05)' }}>
                    {/* jersey number */}
                    <span className="flex items-center justify-center font-black text-white text-[14px] shrink-0 tabular-nums" style={{ width: 36, height: 36, borderRadius: 11, background: POS_COL[p.pos] }}>{p.no}</span>
                    <button onClick={() => toggle(p.name)} className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-[14px] whitespace-nowrap" style={{ color: on ? '#0a1f4c' : '#fff' }}>{p.name}</span>
                        <span className="text-[9.5px] font-extrabold px-1.5 py-0.5 rounded" style={{ background: `${POS_COL[p.pos]}22`, color: POS_COL[p.pos] }}>{p.pos}</span>
                        {p.hot && <span className="text-[9.5px] font-extrabold px-1.5 py-0.5 rounded whitespace-nowrap" style={{ background: 'rgba(230,0,51,.14)', color: '#E60033' }}>本命</span>}
                        {p.dark && <span className="text-[9.5px] font-extrabold px-1.5 py-0.5 rounded whitespace-nowrap" style={{ background: 'rgba(244,180,0,.16)', color: '#b98a00' }}>穴</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ width: 96, background: on ? '#E6EBF4' : 'rgba(255,255,255,.1)' }}><div style={{ width: `${p.pct}%`, height: '100%', background: p.hot ? '#F4B400' : (on ? '#2a5bd0' : '#5e74a0'), borderRadius: 4 }} /></div>
                        <span className="text-[10px] font-bold tabular-nums" style={{ color: on ? '#5B6B85' : '#8fa3c9' }}>本命度 {p.pct}%</span>
                      </div>
                    </button>
                    {/* first-scorer star (only when selected) */}
                    {on && (
                      <button onClick={() => setFirst(p.name)} className="shrink-0 active:scale-90 transition-transform" title="最初の得点者">
                        <span className="text-[18px]" style={{ filter: isFirst ? 'none' : 'grayscale(1)', opacity: isFirst ? 1 : .4 }}>⭐</span>
                      </button>
                    )}
                    {/* select check */}
                    <span className="flex items-center justify-center shrink-0" style={{ width: 26, height: 26, borderRadius: '50%', background: on ? '#E60033' : 'transparent', border: on ? 'none' : '2px solid rgba(255,255,255,.25)' }}>
                      {on && <Icon name="check" size={16} className="text-white" />}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* summary + CTA */}
        <div className="shrink-0 px-5 pt-2 pb-3" style={{ background: 'linear-gradient(180deg,transparent,#081a40 40%)' }}>
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[12px] font-bold" style={{ color: '#C9D6EC' }}>選択 <span className="font-black text-white">{sel.length}</span> 人</span>
            <span className="text-[12px] font-bold" style={{ color: '#8fa3c9' }}>的中で最大 <span className="font-black" style={{ color: '#F4B400' }}>+{pts}pt</span></span>
          </div>
          <button onClick={() => nav.go('predict')} disabled={!sel.length} className="w-full rounded-2xl py-4 flex items-center justify-center gap-2 font-extrabold text-[16px] whitespace-nowrap text-white active:scale-[.98] transition-transform"
            style={{ background: sel.length ? '#E60033' : 'rgba(230,0,51,.3)', boxShadow: sel.length ? '0 10px 26px rgba(230,0,51,.42)' : 'none' }}>
            <Icon name="check" size={20} /> 得点者予想を確定する
          </button>
        </div>
      </div>
    </PhoneChrome>
  );
}

Object.assign(window, { ScorerScreen });
