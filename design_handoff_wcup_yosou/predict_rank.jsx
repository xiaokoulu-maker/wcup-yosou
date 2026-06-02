// predict_rank.jsx — Screen 4 (試合予想) + Screen 5 (ランキング)

// ── Screen 4 : 試合予想 ──────────────────────────────────────
function PredictScreen() {
  const dl = useCountdown(new Date(Date.now() + 1000 * 60 * 60 * 4 + 1000 * 60 * 12));
  const nav = React.useContext(NavCtx);
  const [pick, setPick] = React.useState('jp');           // jp | draw | de
  const [bet, setBet] = React.useState(120);
  const [scorer, setScorer] = React.useState('kubo');

  const odds = { jp: 2.4, draw: 3.1, de: 2.8 };
  const payout = Math.round(bet * odds[pick]);
  const scorers = [
    { id: 'kubo', name: '久保建英', pct: 38 },
    { id: 'mitoma', name: '三笘 薫', pct: 31 },
    { id: 'ueda', name: '上田綺世', pct: 22 },
    { id: 'doan', name: '堂安 律', pct: 17 },
  ];

  const Choice = ({ id, top, label, sub }) => {
    const on = pick === id;
    return (
      <button onClick={() => setPick(id)}
        className="flex-1 rounded-2xl py-3 flex flex-col items-center gap-1 transition-all active:scale-[.97]"
        style={on
          ? { background: '#E60033', boxShadow: '0 8px 20px rgba(230,0,51,.4)' }
          : { background: '#fff' }}>
        <span className="text-[22px] leading-none">{top}</span>
        <span className="font-black text-[13px] whitespace-nowrap" style={{ color: on ? '#fff' : '#0a1f4c' }}>{label}</span>
        <span className="text-[10.5px] font-bold whitespace-nowrap" style={{ color: on ? 'rgba(255,255,255,.85)' : '#5B6B85' }}>{sub}</span>
      </button>
    );
  };

  return (
    <PhoneChrome dark>
      <div className="h-full flex flex-col" style={{ background: '#0a1f4c' }}>
        <ScreenHeader title="試合を予想" sub="グループC · 第1節"
          right={<span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full whitespace-nowrap" style={{ background: 'rgba(244,180,0,.16)', color: '#F4B400' }}>+3pt</span>} />

        <div className="flex-1 min-h-0 overflow-hidden px-5 pb-3 flex flex-col">
          {/* match card */}
          <div className="rounded-3xl px-4 py-4" style={{ background: 'linear-gradient(160deg,#0d2a5e,#0a1f4c)', border: '1px solid rgba(255,255,255,.10)', boxShadow: '0 12px 30px rgba(4,12,33,.4)' }}>
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="flex items-center gap-1 text-[11px] font-bold whitespace-nowrap" style={{ color: '#8fa3c9' }}><Icon name="pin" size={13} />シアトル · Lumen Field</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex flex-col items-center gap-1.5 w-[34%]"><Flag size={34} /><span className="text-white font-black text-[15px] whitespace-nowrap">日本</span></div>
              <div className="flex flex-col items-center">
                <span className="font-black text-white tabular-nums leading-none" style={{ fontSize: 13, color: '#E60033' }}>締切 {dl.hh}:{dl.mm}</span>
                <span className="text-[26px] font-black my-1" style={{ color: 'rgba(255,255,255,.25)' }}>VS</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 w-[34%]">
                <span style={{ width: 34, height: 24, borderRadius: 3, overflow: 'hidden', display: 'inline-flex', boxShadow: '0 1px 2px rgba(0,0,0,.3)' }}><span style={{ flex: 1, background: '#000' }} /><span style={{ flex: 1, background: '#D00' }} /><span style={{ flex: 1, background: '#FFCE00' }} /></span>
                <span className="text-white font-black text-[15px] whitespace-nowrap">ドイツ</span>
              </div>
            </div>
          </div>

          {/* 3-way pick */}
          <p className="text-[12px] font-extrabold mt-4 mb-2" style={{ color: '#C9D6EC' }}>勝敗を予想</p>
          <div className="flex gap-2.5">
            <Choice id="jp" top="🇯🇵" label="日本 勝利" sub={`${odds.jp}倍`} />
            <Choice id="draw" top="🤝" label="引き分け" sub={`${odds.draw}倍`} />
            <Choice id="de" top="🇩🇪" label="ドイツ 勝利" sub={`${odds.de}倍`} />
          </div>

          {/* coin bet */}
          <div className="rounded-2xl bg-white px-4 py-3.5 mt-4" style={{ boxShadow: '0 10px 26px rgba(4,12,33,.28)' }}>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[12px] font-bold whitespace-nowrap" style={{ color: '#5B6B85' }}><Icon name="coin" size={15} className="text-[#F4B400]" />コインを賭ける</span>
              <span className="font-black tabular-nums" style={{ color: '#0a1f4c' }}>{bet} <span className="text-[12px]" style={{ color: '#F4B400' }}>🪙</span></span>
            </div>
            <input type="range" min="0" max="500" step="10" value={bet} onChange={(e) => setBet(+e.target.value)}
              className="w-full mt-2.5 accent-[#E60033]" style={{ height: 6 }} />
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[11px] font-bold" style={{ color: '#8fa3c9' }}>残高 1,240</span>
              <span className="text-[11px] font-bold" style={{ color: '#0e8a46' }}>的中で <span className="font-black tabular-nums">+{payout}</span> 🪙</span>
            </div>
          </div>

          {/* 日本戦 scorer prediction */}
          <div className="flex items-center gap-1.5 mt-4 mb-2">
            <Flag size={18} /><p className="text-[12px] font-extrabold" style={{ color: '#C9D6EC' }}>得点者を予想 <span style={{ color: '#F4B400' }}>+2pt</span></p>
            <button onClick={() => nav.go('scorer')} className="ml-auto text-[11px] font-bold whitespace-nowrap" style={{ color: '#F4B400' }}>全選手・本命を見る ›</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {scorers.map((s) => {
              const on = scorer === s.id;
              return (
                <button key={s.id} onClick={() => setScorer(s.id)}
                  className="rounded-xl px-3 py-2.5 flex items-center justify-between transition-all active:scale-[.97]"
                  style={on ? { background: 'rgba(244,180,0,.16)', border: '1.5px solid #F4B400' } : { background: 'rgba(255,255,255,.06)', border: '1.5px solid transparent' }}>
                  <span className="font-bold text-[13px] whitespace-nowrap" style={{ color: on ? '#F4B400' : '#fff' }}>{s.name}</span>
                  <span className="text-[10px] font-bold" style={{ color: '#8fa3c9' }}>{s.pct}%</span>
                </button>
              );
            })}
          </div>
          <div className="flex-1" />
        </div>

        <div className="shrink-0 px-5 pt-2 pb-3" style={{ background: 'linear-gradient(180deg,transparent,#081a40 45%)' }}>
          <button onClick={() => nav.complete({ pick, bet, scorer })} className="w-full rounded-2xl py-4 flex items-center justify-center gap-2 font-extrabold text-[16px] whitespace-nowrap text-white transition-all active:scale-[.98]"
            style={{ background: '#E60033', boxShadow: '0 10px 26px rgba(230,0,51,.42)' }}>
            <Icon name="check" size={20} /> この予想で決定する
          </button>
        </div>
      </div>
    </PhoneChrome>
  );
}

// ── Screen 5 : ランキング ────────────────────────────────────
function RankingScreen() {
  const [tab, setTab] = React.useState(0);
  const tabs = ['試合予想', '大会予想', 'コインリッチ'];
  const data = [
    [ // 試合予想 (pts)
      { n: 'はると', v: '142pt', s: '🔥8', me: false },
      { n: 'さくら', v: '128pt', s: '🔥5', me: false },
      { n: '陸', v: '121pt', s: '🔥5', me: true },
      { n: 'ゆうき', v: '110pt', s: '🔥3', me: false },
      { n: 'みなと', v: '98pt', s: '🔥2', me: false },
      { n: 'あおい', v: '86pt', s: '—', me: false },
    ],
    [ // 大会予想 (correct)
      { n: 'さくら', v: '優勝:🇧🇷', s: '11of16', me: false },
      { n: '陸', v: '優勝:🇫🇷', s: '10of16', me: true },
      { n: 'はると', v: '優勝:🇦🇷', s: '9of16', me: false },
      { n: 'みなと', v: '優勝:🇧🇷', s: '8of16', me: false },
      { n: 'ゆうき', v: '優勝:🇪🇸', s: '7of16', me: false },
      { n: 'あおい', v: '優勝:🇯🇵', s: '6of16', me: false },
    ],
    [ // コインリッチ
      { n: 'みなと', v: '4,820🪙', s: '+12', me: false },
      { n: 'はると', v: '3,140🪙', s: '+8', me: false },
      { n: 'ゆうき', v: '2,050🪙', s: '+5', me: false },
      { n: '陸', v: '1,240🪙', s: '+3', me: true },
      { n: 'さくら', v: '980🪙', s: '+2', me: false },
      { n: 'あおい', v: '610🪙', s: '—', me: false },
    ],
  ];
  const rows = data[tab];
  const podium = rows.slice(0, 3);
  const colors = ['#F4B400', '#C9D6EC', '#cd7f32'];

  return (
    <PhoneChrome dark>
      <div className="h-full flex flex-col" style={{ background: '#0a1f4c' }}>
        <ScreenHeader title="ランキング" sub="陸たちのW杯2026 · 12人" />
        <Tabs tabs={tabs} active={tab} onChange={setTab} />

        {/* podium */}
        <div className="flex items-end justify-center gap-3 px-5 pt-5 pb-3">
          {[1, 0, 2].map((pi) => {
            const p = podium[pi]; const h = pi === 0 ? 84 : 60;
            return (
              <div key={pi} className="flex flex-col items-center" style={{ width: 84 }}>
                <Avatar name={p.n[0]} size={pi === 0 ? 52 : 42} ring={colors[pi]} bg={p.me ? 'linear-gradient(135deg,#E60033,#ff5a7a)' : undefined} />
                <span className="text-white font-bold text-[12px] mt-1.5 whitespace-nowrap">{p.n}</span>
                <span className="font-black tabular-nums text-[12px] whitespace-nowrap" style={{ color: colors[pi] }}>{p.v}</span>
                <div className="w-full rounded-t-xl mt-1.5 flex items-start justify-center pt-1.5" style={{ height: h, background: `linear-gradient(180deg,${colors[pi]}33,rgba(255,255,255,.04))`, border: `1px solid ${colors[pi]}55`, borderBottom: 'none' }}>
                  <span className="font-black text-[18px]" style={{ color: colors[pi] }}>{pi + 1}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* list */}
        <div className="flex-1 min-h-0 overflow-hidden px-5 pb-3">
          <div className="flex flex-col gap-2">
            {rows.map((r, i) => (
              <div key={r.n} className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5"
                style={r.me ? { background: '#fff', boxShadow: '0 8px 22px rgba(4,12,33,.3)' } : { background: 'rgba(255,255,255,.05)' }}>
                <span className="font-black tabular-nums text-center w-6 shrink-0" style={{ color: i < 3 ? colors[i] : (r.me ? '#5B6B85' : '#8fa3c9') }}>{i + 1}</span>
                <Avatar name={r.n[0]} size={32} bg={r.me ? 'linear-gradient(135deg,#E60033,#ff5a7a)' : undefined} />
                <span className="font-bold text-[14px] flex-1 whitespace-nowrap" style={{ color: r.me ? '#0a1f4c' : '#fff' }}>{r.n}{r.me && <span className="text-[10px] font-extrabold ml-1.5 px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(230,0,51,.12)', color: '#E60033' }}>YOU</span>}</span>
                <span className="text-[11px] font-bold" style={{ color: r.me ? '#8fa3c9' : '#8fa3c9' }}>{r.s}</span>
                <span className="font-black tabular-nums text-[14px] whitespace-nowrap" style={{ color: r.me ? '#0a1f4c' : '#C9D6EC' }}>{r.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PhoneChrome>
  );
}

Object.assign(window, { PredictScreen, RankingScreen });
