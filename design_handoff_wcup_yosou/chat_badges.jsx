// chat_badges.jsx — Screen 6 (大会チャット) + Screen 7 (マイバッジ)

// ── Screen 6 : 大会チャット ──────────────────────────────────
function ChatScreen() {
  const [menuFor, setMenuFor] = React.useState(2); // show long-press menu open on one bubble

  const Reaction = ({ e, n, mine }) => (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full"
      style={mine ? { background: 'rgba(230,0,51,.14)', color: '#ff6a86', border: '1px solid rgba(230,0,51,.3)' } : { background: 'rgba(255,255,255,.08)', color: '#C9D6EC' }}>{e} {n}</span>
  );

  const Them = ({ name, init, children, reacts, quote }) => (
    <div className="flex gap-2 items-end">
      <Avatar name={init} size={30} />
      <div className="max-w-[76%]">
        <span className="text-[11px] font-bold ml-1" style={{ color: '#8fa3c9' }}>{name}</span>
        <div className="rounded-2xl rounded-bl-md px-3.5 py-2.5 mt-0.5" style={{ background: '#fff' }}>
          {quote && <div className="rounded-lg px-2.5 py-1.5 mb-1.5 text-[11px] leading-snug" style={{ background: '#F0F4FA', borderLeft: '3px solid #E60033', color: '#5B6B85' }}>{quote}</div>}
          <p className="text-[13.5px] leading-snug" style={{ color: '#0a1f4c' }}>{children}</p>
        </div>
        {reacts && <div className="flex gap-1 mt-1 ml-1">{reacts}</div>}
      </div>
    </div>
  );

  const Me = ({ children, reacts }) => (
    <div className="flex flex-col items-end">
      <div className="max-w-[76%] rounded-2xl rounded-br-md px-3.5 py-2.5" style={{ background: '#E60033' }}>
        <p className="text-[13.5px] leading-snug text-white">{children}</p>
      </div>
      {reacts && <div className="flex gap-1 mt-1 mr-1">{reacts}</div>}
    </div>
  );

  return (
    <PhoneChrome dark>
      <div className="h-full flex flex-col" style={{ background: '#0a1f4c' }}>
        <ScreenHeader title="陸たちのW杯2026" sub="● 8人がオンライン"
          right={<div className="flex -space-x-2">{['は', 'さ', 'ゆ'].map((c, i) => <Avatar key={i} name={c} size={28} ring="#0a1f4c" />)}</div>} />

        <div className="flex-1 min-h-0 overflow-hidden px-4 py-2 flex flex-col gap-3 justify-end relative">
          <Them name="はると" init="は" reacts={<><Reaction e="🔥" n="3" mine /><Reaction e="😂" n="2" /></>}>
            ドイツ戦、今回は日本いけるっしょ🇯🇵
          </Them>

          <Me reacts={<Reaction e="👍" n="4" />}>俺は2-1で日本勝ち予想したわ。久保が決める⚽</Me>

          {/* bubble with long-press menu open */}
          <div className="relative">
            <Them name="さくら" init="さ" quote="俺は2-1で日本勝ち予想したわ" reacts={<Reaction e="💯" n="1" />}>
              強気すぎ笑　私は引き分けに10🪙賭けた
            </Them>
            {menuFor === 2 && (
              <div className="absolute z-20 left-10 -top-2" onClick={() => setMenuFor(null)}>
                <div className="flex gap-1.5 mb-1.5 px-2 py-1.5 rounded-full" style={{ background: '#11244f', boxShadow: '0 10px 30px rgba(0,0,0,.5)' }}>
                  {['❤️', '🔥', '😂', '👍', '😮', '➕'].map((e) => <span key={e} className="text-[18px] active:scale-125 transition-transform">{e}</span>)}
                </div>
                <div className="rounded-2xl py-1 w-40" style={{ background: '#11244f', boxShadow: '0 10px 30px rgba(0,0,0,.5)' }}>
                  {[['share', '返信'], ['chart', '引用して返信'], ['check', 'コピー']].map(([ic, t]) => (
                    <div key={t} className="flex items-center gap-2.5 px-3.5 py-2 text-[13px] font-bold text-white"><Icon name={ic} size={15} className="text-[#8fa3c9]" />{t}</div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* posted prediction card */}
          <div className="flex flex-col items-end">
            <div className="max-w-[80%] rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(150deg,#0d2a5e,#11367a)', border: '1px solid rgba(244,180,0,.35)', boxShadow: '0 10px 26px rgba(0,0,0,.4)' }}>
              <div className="px-3.5 py-3">
                <p className="text-[10px] font-extrabold tracking-wide" style={{ color: '#F4B400' }}>陸 の予想カード</p>
                <div className="flex items-center justify-center gap-3 my-2">
                  <span className="text-white font-black text-[14px] whitespace-nowrap">日本</span>
                  <span className="font-black text-[22px] tabular-nums text-white whitespace-nowrap">2<span style={{ color: '#8fa3c9' }}>-</span>1</span>
                  <span className="text-white font-black text-[14px] whitespace-nowrap">ドイツ</span>
                </div>
                <p className="text-center text-[11px] font-bold whitespace-nowrap" style={{ color: '#C9D6EC' }}>得点者：久保建英 ⚽ / 120🪙 賭け</p>
              </div>
            </div>
            <div className="flex gap-1 mt-1 mr-1"><Reaction e="🔥" n="5" mine /><Reaction e="🙏" n="2" /></div>
          </div>
        </div>

        {/* input */}
        <div className="shrink-0 px-3 pt-2 pb-3 flex items-center gap-2" style={{ borderTop: '1px solid rgba(255,255,255,.08)' }}>
          <button className="flex items-center justify-center shrink-0" style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(255,255,255,.08)', color: '#F4B400' }}><Icon name="chart" size={18} /></button>
          <div className="flex-1 rounded-full px-4 py-2.5 text-[13px]" style={{ background: 'rgba(255,255,255,.08)', color: '#8fa3c9' }}>メッセージを入力…</div>
          <button className="flex items-center justify-center shrink-0" style={{ width: 36, height: 36, borderRadius: '50%', background: '#E60033', color: '#fff' }}><span style={{ transform: 'rotate(-90deg)', display: 'inline-flex' }}><Icon name="chevdown" size={18} /></span></button>
        </div>
      </div>
    </PhoneChrome>
  );
}

// ── Screen 7 : マイバッジ ────────────────────────────────────
function BadgeScreen() {
  const badges = [
    { ic: 'flame', n: '5連続的中', got: true, col: '#F4B400' },
    { ic: 'ball', n: '初予想', got: true, col: '#E60033' },
    { ic: 'bolt', n: '番狂わせ的中', got: true, col: '#F4B400' },
    { ic: 'trophy', n: '日本戦皆勤', got: true, col: '#E60033' },
    { ic: 'coin', n: 'コイン1000', got: true, col: '#F4B400' },
    { ic: 'share', n: 'シェア初投稿', got: true, col: '#E60033' },
    { ic: 'chart', n: '週間1位', got: true, col: '#F4B400' },
    { ic: 'check', n: '予言者', got: false, prog: 0.83, col: '#F4B400', hint: 'あと1的中' },
    { ic: 'flame', n: '10連続的中', got: false, prog: 0.5, col: '#E60033', hint: '5/10' },
    { ic: 'calendar', n: '全試合予想', got: false, prog: 0.4, col: '#8fa3c9' },
    { ic: 'lock', n: '優勝国的中', got: false, col: '#8fa3c9' },
    { ic: 'lock', n: '???', got: false, col: '#8fa3c9' },
  ];
  return (
    <PhoneChrome dark>
      <div className="h-full flex flex-col" style={{ background: '#0a1f4c' }}>
        <ScreenHeader title="マイバッジ" sub="集めて自慢しよう" />

        {/* summary */}
        <div className="mx-5 rounded-3xl px-5 py-4 flex items-center gap-4" style={{ background: 'linear-gradient(150deg,#0d2a5e,#11367a)', border: '1px solid rgba(244,180,0,.3)' }}>
          <div className="relative shrink-0" style={{ width: 64, height: 64 }}>
            <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,.10)" strokeWidth="6" />
              <circle cx="32" cy="32" r="28" fill="none" stroke="#F4B400" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 28 * 7 / 24} ${2 * Math.PI * 28}`} />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-black text-white text-[18px]">7</span>
          </div>
          <div>
            <p className="text-white font-black text-[18px] leading-tight">7 / 24 獲得</p>
            <p className="text-[12px] font-bold mt-0.5" style={{ color: '#C9D6EC' }}>次は「予言者」まで <span style={{ color: '#F4B400' }}>あと1的中</span></p>
          </div>
        </div>

        {/* grid */}
        <div className="flex-1 min-h-0 overflow-hidden px-5 pt-4 pb-3">
          <div className="grid grid-cols-3 gap-3">
            {badges.map((b, i) => (
              <div key={i} className="rounded-2xl px-2 py-3 flex flex-col items-center text-center"
                style={b.got ? { background: 'rgba(255,255,255,.06)', border: `1px solid ${b.col}55` } : { background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)' }}>
                <span className="flex items-center justify-center" style={{ width: 44, height: 44, borderRadius: 14, background: b.got ? `${b.col}22` : 'rgba(255,255,255,.05)', color: b.got ? b.col : '#5e74a0', opacity: b.got ? 1 : .8 }}>
                  <Icon name={b.got ? b.ic : 'lock'} size={22} />
                </span>
                <span className="text-[11px] font-bold mt-1.5 leading-tight" style={{ color: b.got ? '#fff' : '#7287ac' }}>{b.n}</span>
                {!b.got && b.prog != null && (
                  <div className="w-full mt-1.5">
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,.1)' }}><div style={{ width: `${b.prog * 100}%`, height: '100%', background: b.col, borderRadius: 4 }} /></div>
                    <span className="text-[9px] font-bold" style={{ color: '#8fa3c9' }}>{b.hint}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </PhoneChrome>
  );
}

Object.assign(window, { ChatScreen, BadgeScreen });
