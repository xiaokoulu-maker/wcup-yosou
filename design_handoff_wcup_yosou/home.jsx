// home.jsx — Home Mode A (未参加) and Mode B (参加済み)
// Uses window globals from shared.jsx + Tailwind classes.

// ── Reusable bits ──────────────────────────────────────────
function Wordmark({ ink = '#fff' }) {
  return (
    <div className="flex items-center gap-2" style={{ color: ink }}>
      <span className="flex items-center justify-center" style={{ width: 26, height: 26, borderRadius: 8, background: '#E60033', boxShadow: '0 2px 8px rgba(230,0,51,.45)' }}>
        <Icon name="ball" size={16} className="text-white" />
      </span>
      <span className="font-extrabold tracking-tight text-[17px] whitespace-nowrap">wcup<span style={{ color: '#F4B400' }}>-</span>yosou</span>
    </div>
  );
}

// big tabular countdown unit
function CountUnit({ value, label, accent }) {
  return (
    <div className="flex flex-col items-center">
      <span className="leading-none font-black tabular-nums"
        style={{ fontSize: 40, color: '#fff', textShadow: '0 2px 12px rgba(0,0,0,.45)' }}>{value}</span>
      <span className="mt-1.5 text-[11px] font-bold tracking-widest" style={{ color: accent || '#C9D6EC' }}>{label}</span>
    </div>
  );
}

function Colon() {
  return <span className="font-black leading-none -mt-3" style={{ fontSize: 30, color: 'rgba(201,214,236,.5)' }}>:</span>;
}

// Night-stadium hero background (CSS only)
function StadiumHero({ children, h = 'auto' }) {
  return (
    <div className="relative w-full overflow-hidden" style={{ height: h, background: 'linear-gradient(180deg,#061533 0%,#0a1f4c 62%,#0d2a5e 100%)' }}>
      {/* floodlight glows */}
      <div className="absolute pointer-events-none" style={{ top: -90, left: -60, width: 240, height: 240, background: 'radial-gradient(circle,rgba(120,170,255,.35),transparent 65%)' }} />
      <div className="absolute pointer-events-none" style={{ top: -110, right: -60, width: 260, height: 260, background: 'radial-gradient(circle,rgba(120,170,255,.30),transparent 65%)' }} />
      {/* stars */}
      <div className="absolute inset-0 pointer-events-none" style={{ opacity: .7, backgroundImage:
        'radial-gradient(1.5px 1.5px at 20% 18%,#fff,transparent),radial-gradient(1.2px 1.2px at 70% 12%,#dce8ff,transparent),radial-gradient(1.5px 1.5px at 42% 26%,#fff,transparent),radial-gradient(1px 1px at 86% 24%,#fff,transparent),radial-gradient(1.2px 1.2px at 12% 40%,#cfe0ff,transparent),radial-gradient(1px 1px at 60% 34%,#fff,transparent)' }} />
      {/* pitch */}
      <div className="absolute pointer-events-none" style={{ bottom: 0, left: '-25%', right: '-25%', height: 230, perspective: '320px' }}>
        <div style={{ position: 'absolute', inset: 0, transform: 'rotateX(64deg)', transformOrigin: 'bottom center',
          background: 'repeating-linear-gradient(90deg,#0c7d3d 0,#0c7d3d 46px,#0f8e46 46px,#0f8e46 92px)',
          borderTop: '2px solid rgba(255,255,255,.5)' }}>
          {/* center line */}
          <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, background: 'rgba(255,255,255,.45)' }} />
          {/* center circle */}
          <div style={{ position: 'absolute', left: '50%', top: '46%', width: 130, height: 130, marginLeft: -65, marginTop: -65, borderRadius: '50%', border: '2px solid rgba(255,255,255,.45)' }} />
        </div>
        {/* fade pitch into navy */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#0a1f4c 0%,rgba(10,31,76,.55) 30%,transparent 70%)' }} />
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}

// ── HOME A : not joined ─────────────────────────────────────
function HomeA() {
  const c = useCountdown(WCUP_KICKOFF);
  const [open, setOpen] = React.useState(false);
  const nav = React.useContext(NavCtx);
  return (
    <PhoneChrome dark>
      <div className="h-full flex flex-col" style={{ background: '#0a1f4c' }}>
        <StadiumHero>
          <div className="px-6 pt-3 pb-9">
            <div className="flex items-center justify-between">
              <Wordmark />
              <span className="flex items-center gap-2 px-2.5 py-1.5 rounded-full" style={{ background: 'rgba(255,255,255,.10)' }}>
                <HostStrip codes={false} />
              </span>
            </div>

            <div className="mt-9 text-center">
              <p className="text-[12px] font-bold tracking-[0.2em]" style={{ color: '#F4B400' }}>FIFA WORLD CUP 2026</p>
              <p className="text-[11px] font-bold tracking-wide mt-1.5" style={{ color: '#8fa3c9' }}>北中米3カ国共催 · 史上初の48カ国</p>
              <h1 className="mt-3 font-black leading-[1.12] text-white" style={{ fontSize: 30 }}>
                夏が、はじまる。<br />予想で、もっとアツく。
              </h1>
              <p className="mt-3 text-[13px] leading-relaxed" style={{ color: '#C9D6EC' }}>友達と勝敗を予想して競い合う、<br />40日間だけの夏。</p>
            </div>

            {/* countdown */}
            <div className="mt-8 mx-auto rounded-3xl px-5 py-5" style={{ maxWidth: 320, background: 'rgba(6,21,51,.55)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,.10)', boxShadow: '0 18px 50px rgba(0,0,0,.45)' }}>
              <p className="text-center text-[12px] font-bold tracking-wider mb-3" style={{ color: '#C9D6EC' }}>開幕まで</p>
              <div className="flex items-start justify-center gap-3">
                <CountUnit value={c.dd} label="DAYS" accent="#F4B400" />
                <Colon />
                <CountUnit value={c.hh} label="HOURS" />
                <Colon />
                <CountUnit value={c.mm} label="MIN" />
                <Colon />
                <CountUnit value={c.ss} label="SEC" />
              </div>
              <div className="mt-4 pt-3.5 flex items-center justify-center gap-4" style={{ borderTop: '1px solid rgba(255,255,255,.10)' }}>
                {[['48', 'カ国'], ['16', '都市'], ['104', '試合']].map(([n, l], i) => (
                  <React.Fragment key={l}>
                    {i > 0 && <span style={{ width: 1, height: 22, background: 'rgba(255,255,255,.12)' }} />}
                    <div className="text-center whitespace-nowrap">
                      <span className="font-black tabular-nums leading-none" style={{ fontSize: 19, color: '#fff' }}>{n}</span>
                      <span className="text-[11px] font-bold ml-0.5" style={{ color: '#8fa3c9' }}>{l}</span>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </StadiumHero>

        {/* CTAs */}
        <div className="flex-1 px-6 pt-6 pb-4 flex flex-col" style={{ background: '#0a1f4c' }}>
          <button onClick={() => nav.go('create')} className="group w-full rounded-2xl py-4 flex items-center justify-center gap-2 font-extrabold text-[17px] whitespace-nowrap text-white transition-all duration-150 active:scale-[.98]"
            style={{ background: '#E60033', boxShadow: '0 10px 26px rgba(230,0,51,.42)' }}>
            <Icon name="plus" size={20} /> 友達と大会を作る
          </button>
          <p className="text-center text-[11px] mt-2.5" style={{ color: '#8fa3c9' }}>30秒で完成・LINEでそのまま招待</p>

          <button onClick={() => nav.go('onboarding')} className="mt-4 w-full rounded-2xl py-3.5 font-bold text-[15px] whitespace-nowrap transition-colors duration-150 active:scale-[.98]"
            style={{ color: '#C9D6EC', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.16)' }}>
            ひとりで予想を始める
          </button>

          <button onClick={() => nav.go('join')} className="mt-3 mx-auto block text-[13px] font-bold whitespace-nowrap" style={{ color: '#8fa3c9' }}>招待された？ <span style={{ color: '#F4B400' }}>コードで参加</span></button>

          {/* もっと遊ぶ collapsible */}
          <button onClick={() => setOpen(o => !o)} className="mt-5 mx-auto flex items-center gap-1 text-[13px] font-bold whitespace-nowrap" style={{ color: '#8fa3c9' }}>
            もっと遊ぶ
            <span style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s', display: 'inline-flex' }}><Icon name="chevdown" size={16} /></span>
          </button>
          <div style={{ maxHeight: open ? 220 : 0, opacity: open ? 1 : 0, overflow: 'hidden', transition: 'max-height .28s ease, opacity .2s' }}>
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              {[['ball','今大会の全試合'],['chart','みんなの予想を見る'],['trophy','バッジを集める'],['share','ルールを知る']].map(([ic,t]) => (
                <div key={t} className="rounded-2xl px-3.5 py-3.5 flex items-center gap-2.5" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.10)' }}>
                  <span className="flex items-center justify-center shrink-0" style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(244,180,0,.16)', color: '#F4B400' }}><Icon name={ic} size={17} /></span>
                  <span className="text-[12.5px] font-bold text-white leading-tight">{t}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1" />
        </div>
      </div>
    </PhoneChrome>
  );
}

// ── HOME B : joined ─────────────────────────────────────────
function StatCard({ icon, iconBg, iconInk, label, children, accent, onClick }) {
  return (
    <button onClick={onClick} className="text-left rounded-2xl bg-white px-3.5 py-3.5 flex flex-col active:scale-[.98] transition-transform" style={{ boxShadow: '0 10px 26px rgba(4,12,33,.30)' }}>
      <div className="flex items-center gap-1.5">
        <span className="flex items-center justify-center shrink-0" style={{ width: 22, height: 22, borderRadius: 7, background: iconBg, color: iconInk }}><Icon name={icon} size={14} /></span>
        <span className="text-[11px] font-bold whitespace-nowrap" style={{ color: '#5B6B85' }}>{label}</span>
      </div>
      <div className="mt-1.5 whitespace-nowrap" style={{ color: accent || '#0a1f4c' }}>{children}</div>
    </button>
  );
}

function HomeB() {
  const jp = useCountdown(JP_KICKOFF);
  const nav = React.useContext(NavCtx);
  const dl = useCountdown(new Date(Date.now() + 1000 * 60 * 60 * 5 + 1000 * 60 * 24)); // ~5h to deadline (mock)
  return (
    <PhoneChrome dark>
      <div className="h-full flex flex-col" style={{ background: '#0a1f4c' }}>
        {/* header */}
        <div className="px-5 pt-3 pb-4 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold tracking-wider" style={{ color: '#8fa3c9' }}>大会</p>
              <h1 className="text-white font-black text-[19px] leading-tight">陸たちのW杯2026 🏆</h1>
            </div>
            <div className="flex items-center gap-2.5">
              <button onClick={() => nav.go('notif')} className="relative flex items-center justify-center active:scale-90 transition-transform" style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,.08)', color: '#C9D6EC' }}>
                <Icon name="bell" size={20} />
                <span className="absolute" style={{ top: 7, right: 8, width: 9, height: 9, borderRadius: 5, background: '#E60033', border: '2px solid #0a1f4c' }} />
              </button>
              <span className="flex items-center justify-center font-black text-white text-[15px]" style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#E60033,#ff5a7a)', boxShadow: '0 4px 12px rgba(230,0,51,.4)' }}>陸</span>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden px-5 pb-3">
          {/* 日本戦カウントダウンバナー */}
          <button onClick={() => nav.go('japan')} className="w-full text-left relative rounded-2xl overflow-hidden px-4 py-3.5 active:scale-[.99] transition-transform" style={{ background: 'linear-gradient(110deg,#0d2a5e,#11367a)', border: '1px solid rgba(244,180,0,.35)', boxShadow: '0 10px 26px rgba(4,12,33,.35)' }}>
            <div className="absolute pointer-events-none" style={{ top: -40, right: -20, width: 130, height: 130, background: 'radial-gradient(circle,rgba(244,180,0,.22),transparent 60%)' }} />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Flag size={26} />
                <div>
                  <p className="text-[11px] font-bold whitespace-nowrap" style={{ color: '#F4B400' }}>次の日本戦まで</p>
                  <p className="text-white font-black text-[15px] leading-tight whitespace-nowrap">日本 <span style={{ color: '#8fa3c9' }}>vs</span> ブラジル</p>
                </div>
              </div>
              <div className="text-right tabular-nums shrink-0 pl-2">
                <p className="text-white font-black leading-none whitespace-nowrap"><span style={{ fontSize: 26 }}>{jp.d}</span><span className="text-[13px] font-bold" style={{ color: '#C9D6EC' }}>日 </span><span style={{ fontSize: 19 }}>{jp.hh}:{jp.mm}</span></p>
                <p className="text-[10px] font-bold mt-1 whitespace-nowrap" style={{ color: '#8fa3c9' }}>6/16 (火) 22:00 KO</p>
              </div>
            </div>
          </button>

          {/* 今日の試合 feature card */}
          <button onClick={() => nav.go('predict')} className="w-full text-left mt-2.5 rounded-2xl bg-white px-4 py-3.5 active:scale-[.99] transition-transform" style={{ boxShadow: '0 10px 26px rgba(4,12,33,.30)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="flex items-center justify-center shrink-0" style={{ width: 22, height: 22, borderRadius: 7, background: 'rgba(230,0,51,.12)', color: '#E60033' }}><Icon name="ball" size={14} /></span>
                <span className="text-[12px] font-bold whitespace-nowrap" style={{ color: '#5B6B85' }}>今日の試合</span>
              </div>
              <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: 'rgba(230,0,51,.10)', color: '#E60033' }}>未予想 3</span>
            </div>
            <div className="mt-2.5 flex items-center justify-between">
              <span className="font-black text-[16px] whitespace-nowrap" style={{ color: '#0a1f4c' }}>アルゼンチン</span>
              <span className="text-[12px] font-black px-2.5 py-1 rounded-lg shrink-0" style={{ background: '#F0F4FA', color: '#5B6B85' }}>VS</span>
              <span className="font-black text-[16px] whitespace-nowrap" style={{ color: '#0a1f4c' }}>フランス</span>
            </div>
            <div className="mt-2 flex items-center gap-1 text-[11px] font-bold whitespace-nowrap" style={{ color: '#5B6B85' }}>
              <Icon name="pin" size={13} /> ダラス · AT&T Stadium
            </div>
            <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-bold whitespace-nowrap" style={{ color: '#E60033' }}>
              <Icon name="clock" size={14} /> 締切まで {dl.hh}:{dl.mm}:{dl.ss}
              <span className="ml-auto font-bold" style={{ color: '#5B6B85' }}>当たれば <span className="font-black" style={{ color: '#0a1f4c' }}>+3pt</span></span>
            </div>
          </button>

          {/* 2x2 status grid */}
          <div className="mt-2.5 grid grid-cols-2 gap-2.5">
            <StatCard onClick={() => nav.go('rank')} icon="chart" iconBg="rgba(13,42,94,.10)" iconInk="#0d2a5e" label="現在の順位">
              <p className="font-black leading-none"><span style={{ fontSize: 26 }}>3</span><span className="text-[13px] font-bold" style={{ color: '#5B6B85' }}> 位 / 12人</span></p>
              <p className="text-[11px] font-bold mt-1" style={{ color: '#0e8a46' }}>▲ 2つ上昇</p>
            </StatCard>
            <StatCard onClick={() => nav.go('badge')} icon="flame" iconBg="rgba(244,180,0,.16)" iconInk="#F4B400" label="連続的中">
              <p className="font-black leading-none" style={{ color: '#E60033' }}><span style={{ fontSize: 26 }}>5</span><span className="text-[13px] font-bold"> 連続 🔥</span></p>
              <p className="text-[11px] font-bold mt-1" style={{ color: '#5B6B85' }}>自己ベスト更新中</p>
            </StatCard>
            <StatCard onClick={() => nav.go('shop')} icon="coin" iconBg="rgba(244,180,0,.16)" iconInk="#F4B400" label="コイン残高">
              <p className="font-black leading-none" style={{ color: '#0a1f4c' }}><span style={{ fontSize: 26 }}>1,240</span><span className="text-[13px] font-bold" style={{ color: '#F4B400' }}> 🪙</span></p>
              <p className="text-[11px] font-bold mt-1" style={{ color: '#5B6B85' }}>毎日ログインで +50</p>
            </StatCard>
            <StatCard onClick={() => nav.go('badge')} icon="trophy" iconBg="rgba(230,0,51,.12)" iconInk="#E60033" label="獲得バッジ">
              <p className="font-black leading-none" style={{ color: '#0a1f4c' }}><span style={{ fontSize: 26 }}>7</span><span className="text-[13px] font-bold" style={{ color: '#5B6B85' }}> / 24</span></p>
              <p className="text-[11px] font-bold mt-1" style={{ color: '#5B6B85' }}>あと1つで「予言者」</p>
            </StatCard>
          </div>
        </div>

        {/* main CTA */}
        <div className="shrink-0 px-5 pt-2 pb-3" style={{ background: 'linear-gradient(180deg,transparent,#081a40 40%)' }}>
          <button onClick={() => nav.go('predict')} className="w-full rounded-2xl py-4 flex items-center justify-center gap-2 font-extrabold text-[17px] whitespace-nowrap text-white transition-all duration-150 active:scale-[.98]"
            style={{ background: '#E60033', boxShadow: '0 10px 26px rgba(230,0,51,.42)' }}>
            <Icon name="ball" size={20} /> 試合を予想する
          </button>
        </div>
      </div>
    </PhoneChrome>
  );
}

Object.assign(window, { HomeA, HomeB });
