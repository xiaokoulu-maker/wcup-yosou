// victory.jsx — 試合結果演出（勝利 / 引き分け / 敗戦の出し分け）
// 中央の赤い丸は廃止。結果ごとにトーン・紙吹雪・コピーを切り替える。

// 紙吹雪レイヤー（CSSアニメのみ）
function Confetti({ count = 30, palette }) {
  const cols = palette || ['#F4B400', '#E60033', '#FFFFFF', '#C9D6EC'];
  const pieces = React.useMemo(() => Array.from({ length: count }, (_, i) => ({
    left: Math.random() * 100,
    w: 5 + Math.random() * 6,
    h: 9 + Math.random() * 9,
    c: cols[i % cols.length],
    delay: Math.random() * 2.6,
    dur: 2.6 + Math.random() * 1.8,
    rot: Math.random() * 360,
    rad: Math.random() > 0.6 ? '50%' : '1px',
  })), [count]);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 2 }}>
      {pieces.map((p, i) => (
        <span key={i} style={{
          position: 'absolute', top: -20, left: `${p.left}%`, width: p.w, height: p.h,
          background: p.c, borderRadius: p.rad, transform: `rotate(${p.rot}deg)`,
          animation: `wcFall ${p.dur}s ${p.delay}s linear infinite`,
        }} />
      ))}
    </div>
  );
}

const RESULTS = {
  win: {
    bg: 'radial-gradient(120% 80% at 50% 22%,#11337a 0%,#0a1f4c 50%,#061533 100%)',
    glow: 'rgba(244,180,0,.34)', confetti: 30, confettiPal: null,
    label: 'FULL TIME · 試合終了', head: '勝利！', headFlag: true, headColor: '#fff',
    sub: 'SAMURAI BLUE が歴史を動かした',
    jp: 2, de: 1, jpInk: '#fff', deInk: '#7e91b8',
    scorers: '⚽ 久保建英 ・ 三笘 薫',
    hit: true, hitText: 'あなたの予想、的中！', hitColor: '#34d27e',
    pts: '+5', streak: '6', streakLabel: '連続的中', coin: '+288',
    accent: '#F4B400', cardBorder: 'rgba(244,180,0,.4)',
    pill: { text: '新バッジ「予言者」を獲得！', icon: 'trophy' },
    primary: { label: 'この勝利をシェアする', icon: 'share', act: 'share' },
  },
  draw: {
    bg: 'radial-gradient(120% 80% at 50% 22%,#0d2a5e 0%,#0a1f4c 55%,#061533 100%)',
    glow: 'rgba(120,170,255,.22)', confetti: 14, confettiPal: ['#FFFFFF', '#C9D6EC', '#F4B400'],
    label: 'FULL TIME · 試合終了', head: 'ドロー', headFlag: true, headColor: '#fff',
    sub: '勝ち点1を持ち帰った',
    jp: 1, de: 1, jpInk: '#fff', deInk: '#fff',
    scorers: '⚽ 上田綺世',
    hit: true, hitText: '引き分け予想、的中！', hitColor: '#34d27e',
    pts: '+3', streak: '6', streakLabel: '連続的中', coin: '+96',
    accent: '#F4B400', cardBorder: 'rgba(244,180,0,.32)',
    pill: { text: 'ストリーク継続中 🔥', icon: 'flame' },
    primary: { label: '結果をシェアする', icon: 'share', act: 'share' },
  },
  lose: {
    bg: 'radial-gradient(120% 80% at 50% 22%,#11244f 0%,#0a1f4c 55%,#061533 100%)',
    glow: 'rgba(120,140,180,.16)', confetti: 0, confettiPal: null,
    label: 'FULL TIME · 試合終了', head: '惜敗', headFlag: false, headColor: '#C9D6EC',
    sub: '力は出し切った。次がある。',
    jp: 1, de: 2, jpInk: '#8fa3c9', deInk: '#fff',
    scorers: '⚽ 久保建英',
    hit: false, hitText: '今回の予想は、はずれ', hitColor: '#8fa3c9',
    pts: '0', streak: '0', streakLabel: '連続リセット', coin: '+20',
    accent: '#5B6B85', cardBorder: 'rgba(255,255,255,.12)',
    pill: { text: '切り替えて次の試合へ ⚽', icon: 'ball' },
    primary: { label: '次の試合を予想する', icon: 'ball', act: 'predict' },
  },
};

function VictoryScreen({ result = 'win', onShare = () => {}, onRank = () => {}, onClose = () => {}, onPredict }) {
  const r = RESULTS[result] || RESULTS.win;
  const doPrimary = r.primary.act === 'share' ? onShare : (onPredict || onClose);
  return (
    <div className="relative h-full w-full overflow-hidden" style={{ fontFamily: '"Noto Sans JP", sans-serif', background: r.bg }}>
      {/* soft top glow (no 日の丸 disc) */}
      <div className="absolute pointer-events-none" style={{ left: '50%', top: '6%', width: 360, height: 300, transform: 'translateX(-50%)', zIndex: 0, background: `radial-gradient(circle,${r.glow},transparent 68%)` }} />

      {r.confetti > 0 && <Confetti count={r.confetti} palette={r.confettiPal} />}

      <div className="relative h-full w-full flex flex-col px-6 pt-12 pb-7" style={{ zIndex: 3 }}>
        <button onClick={onClose} className="absolute top-4 right-4 flex items-center justify-center" style={{ width: 32, height: 32, borderRadius: 16, background: 'rgba(255,255,255,.12)', color: '#fff', fontSize: 19, lineHeight: 1, zIndex: 5 }}>×</button>

        {/* headline */}
        <div className="text-center" style={{ animation: 'wcPopBig .5s cubic-bezier(.2,.9,.3,1.2) both' }}>
          <p className="text-[13px] font-extrabold tracking-[0.25em]" style={{ color: r.accent }}>{r.label}</p>
          <div className="flex items-center justify-center gap-2.5 mt-2">
            {r.headFlag && <Flag size={40} />}
            <h1 className="font-black leading-none" style={{ fontSize: 46, color: r.headColor, textShadow: '0 4px 24px rgba(0,0,0,.5)' }}>{r.head}</h1>
          </div>
          <p className="text-[15px] font-black text-white mt-1">{r.sub}</p>
        </div>

        {/* score */}
        <div className="flex items-center justify-center gap-5 mt-7" style={{ animation: 'wcRise .5s .15s both' }}>
          <div className="flex flex-col items-center gap-1.5"><Flag size={34} /><span className="text-white font-black text-[15px]">日本</span></div>
          <div className="flex items-center gap-2">
            <span className="font-black tabular-nums leading-none" style={{ fontSize: 64, color: r.jpInk, textShadow: '0 4px 20px rgba(0,0,0,.5)' }}>{r.jp}</span>
            <span className="font-black text-[28px]" style={{ color: 'rgba(255,255,255,.4)' }}>-</span>
            <span className="font-black tabular-nums leading-none" style={{ fontSize: 64, color: r.deInk }}>{r.de}</span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <span style={{ width: 34, height: 24, borderRadius: 3, overflow: 'hidden', display: 'inline-flex', boxShadow: '0 1px 2px rgba(0,0,0,.3)' }}><span style={{ flex: 1, background: '#000' }} /><span style={{ flex: 1, background: '#D00' }} /><span style={{ flex: 1, background: '#FFCE00' }} /></span>
            <span className="font-black text-[15px]" style={{ color: '#8fa3c9' }}>ドイツ</span>
          </div>
        </div>
        <p className="text-center text-[12px] font-bold mt-2.5" style={{ color: '#C9D6EC', animation: 'wcRise .5s .2s both' }}>{r.scorers}</p>

        {/* your result */}
        <div className="rounded-3xl px-5 py-4 mt-7" style={{ background: 'rgba(255,255,255,.07)', border: `1px solid ${r.cardBorder}`, animation: 'wcRise .5s .3s both', boxShadow: '0 14px 40px rgba(0,0,0,.4)' }}>
          <div className="flex items-center gap-2 justify-center">
            <Icon name={r.hit ? 'check' : 'clock'} size={18} style={{ color: r.hitColor }} />
            <span className="font-black text-white text-[16px]">{r.hitText}</span>
          </div>
          <div className="flex items-center justify-center gap-3 mt-3">
            <div className="text-center px-2">
              <p className="font-black tabular-nums leading-none" style={{ fontSize: 26, color: r.hit ? r.accent : '#8fa3c9' }}>{r.pts}</p>
              <p className="text-[10px] font-bold mt-1" style={{ color: '#8fa3c9' }}>ポイント</p>
            </div>
            <span style={{ width: 1, height: 30, background: 'rgba(255,255,255,.14)' }} />
            <div className="text-center px-2">
              <p className="font-black tabular-nums leading-none whitespace-nowrap" style={{ fontSize: 26, color: '#fff' }}>{r.streak}<span className="text-[13px]"> {result === 'lose' ? '' : '🔥'}</span></p>
              <p className="text-[10px] font-bold mt-1" style={{ color: '#8fa3c9' }}>{r.streakLabel}</p>
            </div>
            <span style={{ width: 1, height: 30, background: 'rgba(255,255,255,.14)' }} />
            <div className="text-center px-2">
              <p className="font-black tabular-nums leading-none whitespace-nowrap" style={{ fontSize: 26, color: '#fff' }}>{r.coin}<span className="text-[13px]"> 🪙</span></p>
              <p className="text-[10px] font-bold mt-1" style={{ color: '#8fa3c9' }}>コイン</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-3 rounded-full py-1.5" style={{ background: result === 'lose' ? 'rgba(255,255,255,.06)' : 'rgba(244,180,0,.14)' }}>
            <Icon name={r.pill.icon} size={14} style={{ color: r.accent }} />
            <span className="text-[11px] font-extrabold whitespace-nowrap" style={{ color: result === 'lose' ? '#C9D6EC' : r.accent }}>{r.pill.text}</span>
          </div>
        </div>

        <div className="flex-1" />

        {/* actions */}
        <div style={{ animation: 'wcRise .5s .4s both' }}>
          <button onClick={doPrimary} className="w-full rounded-2xl py-4 flex items-center justify-center gap-2 font-extrabold text-[16px] whitespace-nowrap active:scale-[.98] transition-transform"
            style={{ background: r.accent, color: result === 'lose' ? '#fff' : '#3a2a00', boxShadow: `0 10px 26px ${r.accent}55` }}>
            <Icon name={r.primary.icon} size={19} /> {r.primary.label}
          </button>
          <div className="grid grid-cols-2 gap-2.5 mt-2.5">
            <button onClick={onRank} className="rounded-2xl py-3 font-bold text-[14px] whitespace-nowrap active:scale-[.98] transition-transform" style={{ background: 'rgba(255,255,255,.08)', color: '#fff', border: '1px solid rgba(255,255,255,.16)' }}>順位を見る</button>
            <button onClick={result === 'lose' ? onShare : onClose} className="rounded-2xl py-3 font-bold text-[14px] whitespace-nowrap active:scale-[.98] transition-transform" style={{ background: 'rgba(255,255,255,.08)', color: '#fff', border: '1px solid rgba(255,255,255,.16)' }}>{result === 'lose' ? '結果をシェア' : '閉じる'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { VictoryScreen, Confetti });
