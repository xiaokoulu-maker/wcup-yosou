// share.jsx — Screen 10 : シェアカード (縦長 9:16, 1080×1920 相当 / Spotify Wrapped 風)
function ShareCard() {
  return (
    <div className="w-full h-full relative overflow-hidden" style={{ fontFamily: '"Noto Sans JP", sans-serif', background: 'linear-gradient(170deg,#061533 0%,#0a1f4c 55%,#0d2a5e 100%)' }}>
      {/* glows */}
      <div className="absolute pointer-events-none" style={{ top: -80, left: -60, width: 240, height: 240, background: 'radial-gradient(circle,rgba(120,170,255,.3),transparent 65%)' }} />
      <div className="absolute pointer-events-none" style={{ bottom: 40, right: -70, width: 240, height: 240, background: 'radial-gradient(circle,rgba(230,0,51,.25),transparent 65%)' }} />
      {/* stars */}
      <div className="absolute inset-0 pointer-events-none" style={{ opacity: .7, backgroundImage: 'radial-gradient(1.5px 1.5px at 18% 12%,#fff,transparent),radial-gradient(1.3px 1.3px at 72% 9%,#dce8ff,transparent),radial-gradient(1.5px 1.5px at 40% 18%,#fff,transparent),radial-gradient(1.1px 1.1px at 88% 16%,#fff,transparent)' }} />

      <div className="relative h-full flex flex-col px-7 py-8">
        {/* header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center" style={{ width: 24, height: 24, borderRadius: 8, background: '#E60033' }}><Icon name="ball" size={15} className="text-white" /></span>
            <span className="font-extrabold text-white text-[15px] whitespace-nowrap">wcup<span style={{ color: '#F4B400' }}>-</span>yosou</span>
          </div>
          <HostStrip codes={false} />
        </div>

        {/* identity */}
        <div className="mt-8 flex items-center gap-3">
          <Avatar name="陸" size={48} bg="linear-gradient(135deg,#E60033,#ff5a7a)" ring="#F4B400" />
          <div>
            <p className="text-[12px] font-bold" style={{ color: '#8fa3c9' }}>陸 のW杯2026</p>
            <p className="text-white font-black text-[20px] leading-tight whitespace-nowrap">予想サマリー</p>
          </div>
        </div>

        {/* hero stat */}
        <div className="mt-7">
          <p className="text-[13px] font-extrabold tracking-wide" style={{ color: '#F4B400' }}>🔥 連続的中ストリーク</p>
          <p className="font-black tabular-nums leading-none text-white" style={{ fontSize: 92, textShadow: '0 4px 24px rgba(0,0,0,.5)' }}>5</p>
          <p className="text-[14px] font-bold -mt-1" style={{ color: '#C9D6EC' }}>自己ベスト更新中 · 12人中 <span className="font-black" style={{ color: '#fff' }}>3位</span></p>
        </div>

        {/* prediction highlight */}
        <div className="mt-6 rounded-3xl px-5 py-4" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(244,180,0,.35)' }}>
          <p className="text-[11px] font-extrabold tracking-wide" style={{ color: '#F4B400' }}>会心の予想</p>
          <div className="flex items-center justify-center gap-4 my-2.5">
            <div className="flex flex-col items-center gap-1"><Flag size={28} /><span className="text-white font-black text-[14px] whitespace-nowrap">日本</span></div>
            <span className="font-black tabular-nums text-white whitespace-nowrap" style={{ fontSize: 36 }}>2<span style={{ color: '#8fa3c9' }}>-</span>1</span>
            <div className="flex flex-col items-center gap-1"><span style={{ width: 28, height: 20, borderRadius: 3, overflow: 'hidden', display: 'inline-flex' }}><span style={{ flex: 1, background: '#000' }} /><span style={{ flex: 1, background: '#D00' }} /><span style={{ flex: 1, background: '#FFCE00' }} /></span><span className="text-white font-black text-[14px] whitespace-nowrap">ドイツ</span></div>
          </div>
          <p className="text-center text-[12px] font-bold whitespace-nowrap" style={{ color: '#C9D6EC' }}>得点者：久保建英 ⚽ 的中！</p>
        </div>

        {/* stat grid */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          {[['的中率', '72%'], ['予想数', '28'], ['バッジ', '7']].map(([l, v]) => (
            <div key={l} className="rounded-2xl py-3 text-center" style={{ background: 'rgba(255,255,255,.05)' }}>
              <p className="font-black tabular-nums text-white text-[22px] leading-none">{v}</p>
              <p className="text-[11px] font-bold mt-1" style={{ color: '#8fa3c9' }}>{l}</p>
            </div>
          ))}
        </div>

        <div className="flex-1" />

        {/* footer */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-black text-[15px]">#wcup予想 で参戦中</p>
            <p className="text-[11px] font-bold" style={{ color: '#8fa3c9' }}>君の予想は？ 一緒に競おう</p>
          </div>
          <span className="text-[11px] font-extrabold px-3 py-2 rounded-xl whitespace-nowrap" style={{ background: '#E60033', color: '#fff' }}>大会に参加 →</span>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ShareCard });
