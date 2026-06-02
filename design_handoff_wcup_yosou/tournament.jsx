// tournament.jsx — 大会作成 → 招待・シェア / コードで参加

function Seg({ opts, val, set }) {
  return (
    <div className="flex gap-1 p-1 rounded-2xl" style={{ background: 'rgba(255,255,255,.07)' }}>
      {opts.map((o, i) => (
        <button key={o} onClick={() => set(i)} className="flex-1 rounded-xl py-2 text-[12.5px] font-extrabold whitespace-nowrap transition-all"
          style={i === val ? { background: '#fff', color: '#0a1f4c', boxShadow: '0 4px 12px rgba(0,0,0,.25)' } : { background: 'transparent', color: '#8fa3c9' }}>{o}</button>
      ))}
    </div>
  );
}

// プレースホルダーQR（モジュール風）
function FauxQR({ size = 116 }) {
  const cells = React.useMemo(() => Array.from({ length: 169 }, () => Math.random() > 0.52), []);
  return (
    <div className="relative" style={{ width: size, height: size, background: '#fff', borderRadius: 12, padding: 8, boxShadow: '0 8px 22px rgba(0,0,0,.25)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(13,1fr)', gridTemplateRows: 'repeat(13,1fr)', width: '100%', height: '100%' }}>
        {cells.map((on, i) => <span key={i} style={{ background: on ? '#0a1f4c' : 'transparent' }} />)}
      </div>
      {[[6, 6], [6, 'r'], ['b', 6]].map(([y, x], k) => (
        <span key={k} style={{ position: 'absolute', width: 26, height: 26, top: y === 'b' ? 'auto' : 6, bottom: y === 'b' ? 6 : 'auto', left: x === 'r' ? 'auto' : 6, right: x === 'r' ? 6 : 'auto', background: '#fff', border: '4px solid #0a1f4c', borderRadius: 5 }}>
          <span style={{ position: 'absolute', inset: 4, background: '#0a1f4c', borderRadius: 2 }} />
        </span>
      ))}
    </div>
  );
}

// ── ① 大会を作る ─────────────────────────────────────────────
function CreateTournament() {
  const nav = React.useContext(NavCtx);
  const [name, setName] = React.useState('陸たちのW杯2026');
  const [emoji, setEmoji] = React.useState('🏆');
  const [period, setPeriod] = React.useState(0);
  const [rules, setRules] = React.useState({ scorer: true, exact: false, upset: true });
  const tr = (k) => setRules((p) => ({ ...p, [k]: !p[k] }));

  const RuleRow = ({ k, title, pt, fixed, last }) => (
    <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: last ? 'none' : '1px solid rgba(255,255,255,.06)' }}>
      <div className="flex-1 min-w-0"><p className="font-bold text-[13.5px] text-white whitespace-nowrap">{title} <span style={{ color: '#F4B400' }}>{pt}</span></p></div>
      {fixed ? <span className="text-[11px] font-extrabold px-2 py-1 rounded-full whitespace-nowrap" style={{ background: 'rgba(255,255,255,.1)', color: '#8fa3c9' }}>必須</span> : <Switch on={rules[k]} onClick={() => tr(k)} />}
    </div>
  );

  return (
    <PhoneChrome dark>
      <div className="h-full flex flex-col" style={{ background: '#0a1f4c' }}>
        <ScreenHeader title="大会を作る" sub="30秒で完成・あとで編集OK" />
        <div className="flex-1 min-h-0 overflow-hidden px-5 pb-3 flex flex-col">
          {/* name + emoji */}
          <div className="rounded-2xl bg-white px-4 py-3.5 flex items-center gap-3" style={{ boxShadow: '0 8px 22px rgba(4,12,33,.25)' }}>
            <button className="flex items-center justify-center shrink-0 text-[22px]" style={{ width: 44, height: 44, borderRadius: 13, background: '#F0F4FA' }}>{emoji}</button>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold" style={{ color: '#5B6B85' }}>大会名</p>
              <p className="font-black text-[15px] truncate" style={{ color: '#0a1f4c' }}>{name}</p>
            </div>
          </div>
          <div className="flex gap-1.5 mt-2">
            {['🏆', '⚽', '🔥', '🇯🇵', '🍻'].map((e) => (
              <button key={e} onClick={() => setEmoji(e)} className="text-[18px] rounded-xl active:scale-90 transition-transform" style={{ width: 38, height: 38, background: emoji === e ? 'rgba(244,180,0,.18)' : 'rgba(255,255,255,.06)', border: emoji === e ? '1.5px solid #F4B400' : '1.5px solid transparent' }}>{e}</button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {['陸たちのW杯2026', '会社の予想バトル', '○○高サッカー部', '日本代表を勝たせる会'].map((n) => (
              <button key={n} onClick={() => setName(n)} className="rounded-full px-3 py-1.5 text-[11.5px] font-bold whitespace-nowrap active:scale-95 transition-transform"
                style={name === n ? { background: '#E60033', color: '#fff' } : { background: 'rgba(255,255,255,.07)', color: '#C9D6EC' }}>{n}</button>
            ))}
          </div>

          {/* period */}
          <p className="text-[11px] font-extrabold mt-4 mb-1.5 ml-1" style={{ color: '#8fa3c9' }}>対象期間</p>
          <Seg opts={['全期間', 'グループS', '決勝T']} val={period} set={setPeriod} />

          {/* rules */}
          <p className="text-[11px] font-extrabold mt-4 mb-1.5 ml-1" style={{ color: '#8fa3c9' }}>採点ルール</p>
          <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,.05)' }}>
            <RuleRow k="win" title="勝敗的中" pt="+3pt" fixed />
            <RuleRow k="scorer" title="得点者ボーナス" pt="+2pt" />
            <RuleRow k="exact" title="スコア完全的中" pt="+5pt" />
            <RuleRow k="upset" title="番狂わせボーナス" pt="+3pt" last />
          </div>

          <div className="flex-1" />
        </div>
        <div className="shrink-0 px-5 pt-2 pb-3" style={{ background: 'linear-gradient(180deg,transparent,#081a40 45%)' }}>
          <button onClick={() => nav.go('invite')} className="w-full rounded-2xl py-4 flex items-center justify-center gap-2 font-extrabold text-[16px] whitespace-nowrap text-white active:scale-[.98] transition-transform" style={{ background: '#E60033', boxShadow: '0 10px 26px rgba(230,0,51,.42)' }}>
            <Icon name="check" size={20} /> この設定で大会を作る
          </button>
        </div>
      </div>
    </PhoneChrome>
  );
}

// ── ② 招待・シェア ───────────────────────────────────────────
function InviteScreen() {
  const nav = React.useContext(NavCtx);
  const [copied, setCopied] = React.useState(false);
  return (
    <PhoneChrome dark>
      <div className="h-full flex flex-col" style={{ background: '#0a1f4c' }}>
        <ScreenHeader title="友達を招待" sub="対戦相手が多いほど盛り上がる" />
        <div className="flex-1 min-h-0 overflow-hidden px-5 pb-3 flex flex-col">
          <div className="text-center">
            <span className="inline-flex items-center justify-center" style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#F4B400,#ffce4a)', boxShadow: '0 8px 24px rgba(244,180,0,.45)' }}><Icon name="trophy" size={30} style={{ color: '#3a2a00' }} /></span>
            <h2 className="text-white font-black text-[19px] mt-2.5">「陸たちのW杯2026」<br />を作成しました！</h2>
          </div>

          {/* invite code + QR */}
          <div className="rounded-3xl px-5 py-4 mt-4 flex items-center gap-4" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)' }}>
            <FauxQR />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold" style={{ color: '#8fa3c9' }}>招待コード</p>
              <p className="font-black text-white tabular-nums tracking-wider" style={{ fontSize: 24 }}>WC26-RIKU</p>
              <button onClick={() => setCopied(true)} className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-extrabold px-3 py-1.5 rounded-full active:scale-95 transition-transform" style={{ background: copied ? 'rgba(14,138,70,.18)' : 'rgba(255,255,255,.1)', color: copied ? '#34d27e' : '#C9D6EC' }}>
                <Icon name={copied ? 'check' : 'share'} size={14} /> {copied ? 'コピーしました' : 'コードをコピー'}
              </button>
            </div>
          </div>

          {/* share buttons */}
          <button className="w-full rounded-2xl py-3.5 mt-4 flex items-center justify-center gap-2 font-extrabold text-[15px] whitespace-nowrap text-white active:scale-[.98] transition-transform" style={{ background: '#06C755', boxShadow: '0 8px 22px rgba(6,199,85,.35)' }}>
            <Icon name="share" size={18} /> LINEで友達を招待
          </button>
          <div className="grid grid-cols-2 gap-2.5 mt-2.5">
            <button className="rounded-2xl py-3 font-bold text-[13px] whitespace-nowrap text-white active:scale-[.98] transition-transform" style={{ background: '#111' }}>Xでシェア</button>
            <button className="rounded-2xl py-3 font-bold text-[13px] whitespace-nowrap active:scale-[.98] transition-transform" style={{ background: 'rgba(255,255,255,.08)', color: '#C9D6EC', border: '1px solid rgba(255,255,255,.16)' }}>リンクをコピー</button>
          </div>

          {/* members */}
          <div className="rounded-2xl px-4 py-3 mt-4 flex items-center gap-3" style={{ background: 'rgba(255,255,255,.05)' }}>
            <Avatar name="陸" size={34} bg="linear-gradient(135deg,#E60033,#ff5a7a)" />
            <div className="flex-1"><p className="font-bold text-[13px] text-white">メンバー 1人</p><p className="text-[11px] font-bold" style={{ color: '#8fa3c9' }}>あなた（主催）· 招待して増やそう</p></div>
            <span className="text-[11px] font-extrabold px-2 py-1 rounded-full whitespace-nowrap" style={{ background: 'rgba(230,0,51,.12)', color: '#E60033' }}>HOST</span>
          </div>

          <div className="flex-1" />
        </div>
        <div className="shrink-0 px-5 pt-2 pb-3">
          <button onClick={() => nav.go('home')} className="w-full rounded-2xl py-4 font-extrabold text-[16px] whitespace-nowrap text-white active:scale-[.98] transition-transform" style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.16)' }}>大会ホームへ</button>
        </div>
      </div>
    </PhoneChrome>
  );
}

// ── ③ コードで参加 ───────────────────────────────────────────
function JoinTournament() {
  const nav = React.useContext(NavCtx);
  const [code, setCode] = React.useState('');
  const ready = code.length >= 4;
  return (
    <PhoneChrome dark>
      <div className="h-full flex flex-col" style={{ background: '#0a1f4c' }}>
        <ScreenHeader title="コードで参加" sub="友達の大会に合流する" />
        <div className="flex-1 min-h-0 overflow-hidden px-5 pb-3 flex flex-col">
          <p className="text-[13px] font-bold mt-1" style={{ color: '#C9D6EC' }}>招待コードを入力</p>
          {/* code display */}
          <div className="flex items-center gap-2 mt-3">
            <span className="font-black text-white text-[20px] tabular-nums">WC26-</span>
            <div className="flex gap-1.5 flex-1">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex-1 flex items-center justify-center font-black text-white text-[20px] rounded-xl" style={{ height: 48, background: 'rgba(255,255,255,.06)', border: code.length === i ? '2px solid #F4B400' : '2px solid rgba(255,255,255,.12)' }}>{code[i] || ''}</div>
              ))}
            </div>
          </div>
          {/* quick fill (demo keypad) */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <button onClick={() => setCode('RIKU')} className="rounded-xl py-2.5 text-[13px] font-bold whitespace-nowrap active:scale-95 transition-transform" style={{ background: 'rgba(255,255,255,.07)', color: '#C9D6EC' }}>例：RIKU を入力</button>
            <button onClick={() => setCode('')} className="rounded-xl py-2.5 text-[13px] font-bold whitespace-nowrap active:scale-95 transition-transform" style={{ background: 'rgba(255,255,255,.07)', color: '#8fa3c9' }}>クリア</button>
          </div>

          {/* preview when ready */}
          {ready && (
            <div className="rounded-3xl px-4 py-4 mt-5" style={{ background: 'linear-gradient(150deg,#0d2a5e,#11367a)', border: '1px solid rgba(244,180,0,.3)', animation: 'wcRise .3s both' }}>
              <p className="text-[11px] font-bold" style={{ color: '#F4B400' }}>この大会が見つかりました</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="flex items-center justify-center text-[22px]" style={{ width: 46, height: 46, borderRadius: 13, background: 'rgba(255,255,255,.1)' }}>🏆</span>
                <div className="flex-1 min-w-0"><p className="font-black text-white text-[16px] truncate">陸たちのW杯2026</p><p className="text-[11px] font-bold" style={{ color: '#8fa3c9' }}>主催 陸 · 11人が参加中</p></div>
              </div>
              <div className="flex -space-x-2 mt-3">
                {['陸', 'は', 'さ', 'ゆ', 'み'].map((c, i) => <Avatar key={i} name={c} size={28} ring="#11367a" />)}
                <span className="flex items-center justify-center text-[11px] font-bold text-white" style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,.15)', border: '2px solid #11367a' }}>+6</span>
              </div>
            </div>
          )}

          <div className="flex-1" />
        </div>
        <div className="shrink-0 px-5 pt-2 pb-3">
          <button onClick={() => ready && nav.go('home')} disabled={!ready} className="w-full rounded-2xl py-4 font-extrabold text-[16px] whitespace-nowrap text-white active:scale-[.98] transition-transform" style={{ background: ready ? '#E60033' : 'rgba(230,0,51,.3)', boxShadow: ready ? '0 10px 26px rgba(230,0,51,.42)' : 'none' }}>{ready ? 'この大会に参加する' : 'コードを入力してください'}</button>
        </div>
      </div>
    </PhoneChrome>
  );
}

Object.assign(window, { CreateTournament, InviteScreen, JoinTournament, FauxQR });
