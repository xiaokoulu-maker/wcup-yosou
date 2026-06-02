// ds.jsx — Common design system board (1 board, all tokens)
// Rendered on a navy field so the white cards visibly float.

function Swatch({ name, hex, sub, ink = '#fff' }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.10)' }}>
      <div style={{ height: 64, background: hex }} />
      <div className="px-3 py-2.5">
        <p className="text-[13px] font-extrabold" style={{ color: '#fff' }}>{name}</p>
        <p className="text-[11px] font-bold tabular-nums mt-0.5" style={{ color: '#8fa3c9' }}>{hex}</p>
        {sub && <p className="text-[10.5px] mt-0.5" style={{ color: '#6f84ac' }}>{sub}</p>}
      </div>
    </div>
  );
}

function Panel({ title, children, span = 1 }) {
  return (
    <div className="rounded-3xl p-6" style={{ gridColumn: `span ${span}`, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.10)' }}>
      <p className="text-[12px] font-black tracking-[0.18em] mb-4" style={{ color: '#F4B400' }}>{title}</p>
      {children}
    </div>
  );
}

function Btn({ children, kind, state, icon }) {
  const base = 'w-full rounded-2xl py-3.5 flex items-center justify-center gap-1.5 font-extrabold text-[14px] whitespace-nowrap transition-all';
  const styles = {
    primary: { background: '#E60033', color: '#fff', boxShadow: '0 8px 20px rgba(230,0,51,.40)' },
    'primary-hover': { background: '#cc002e', color: '#fff', boxShadow: '0 12px 26px rgba(230,0,51,.55)' },
    'primary-active': { background: '#b30028', color: '#fff', transform: 'scale(.98)' },
    'primary-disabled': { background: 'rgba(230,0,51,.30)', color: 'rgba(255,255,255,.55)' },
    gold: { background: '#F4B400', color: '#3a2a00', boxShadow: '0 8px 20px rgba(244,180,0,.35)' },
    ghost: { background: 'rgba(255,255,255,.06)', color: '#C9D6EC', border: '1px solid rgba(255,255,255,.18)' },
  };
  const labels = { primary: 'Default', 'primary-hover': 'Hover', 'primary-active': 'Active', 'primary-disabled': 'Disabled' };
  return (
    <div>
      <button className={base} style={styles[kind] || styles.primary}>{icon && <Icon name={icon} size={18} />}{children}</button>
      {labels[kind] && <p className="text-center text-[10px] font-bold mt-1.5" style={{ color: '#8fa3c9' }}>{labels[kind]}</p>}
    </div>
  );
}

function DesignSystem() {
  return (
    <div className="w-full h-full overflow-hidden" style={{ fontFamily: '"Noto Sans JP", sans-serif', background: 'linear-gradient(180deg,#061533,#0a1f4c)' }}>
      <div className="px-9 py-8">
        {/* header */}
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="flex items-center justify-center" style={{ width: 34, height: 34, borderRadius: 10, background: '#E60033', boxShadow: '0 4px 14px rgba(230,0,51,.5)' }}><Icon name="ball" size={20} className="text-white" /></span>
              <span className="font-black text-white text-[24px] tracking-tight whitespace-nowrap">wcup<span style={{ color: '#F4B400' }}>-</span>yosou</span>
            </div>
            <p className="text-[14px]" style={{ color: '#C9D6EC' }}>Design System — 侍ブルー基調 / Samurai-Blue Dark</p>
          </div>
          <div className="flex items-center gap-2">
            <Flag size={26} />
            <span className="text-[12px] font-bold px-3 py-1.5 rounded-full" style={{ background: 'rgba(255,255,255,.10)', color: '#C9D6EC' }}>v2 · FIFA WC 2026</span>
          </div>
        </div>

        <div className="grid mt-7" style={{ gridTemplateColumns: 'repeat(3,1fr)', gap: 22 }}>
          {/* COLORS */}
          <Panel title="COLOR PALETTE" span={2}>
            <div className="grid grid-cols-4 gap-3">
              <Swatch name="Hero Navy" hex="#061533" sub="夜のスタジアム" />
              <Swatch name="Base Navy" hex="#0a1f4c" sub="ベース背景" />
              <Swatch name="Navy 700" hex="#0d2a5e" sub="面の差" />
              <Swatch name="Card Mist" hex="#F0F4FA" sub="サブカード" />
              <Swatch name="日の丸 Red" hex="#E60033" sub="CTA・強調・勝利" />
              <Swatch name="Gold" hex="#F4B400" sub="バッジ・特別演出" />
              <Swatch name="Mist Text" hex="#C9D6EC" sub="薄白文字" />
              <Swatch name="Card White" hex="#FFFFFF" sub="データカード" />
            </div>
            <p className="text-[11px] mt-4 leading-relaxed" style={{ color: '#8fa3c9' }}>役割を絞った2アクセント運用：<b style={{color:'#E60033'}}>赤</b>はここぞ（CTA・勝敗・締切）、<b style={{color:'#F4B400'}}>金</b>は祝福（バッジ・カウントダウン）。多色使いは禁止。</p>
          </Panel>

          {/* TYPE */}
          <Panel title="TYPOGRAPHY — Noto Sans JP">
            <div style={{ color: '#fff' }}>
              <p className="font-black leading-none" style={{ fontSize: 34 }}>夏が、はじまる。</p>
              <p className="text-[10px] font-bold mt-1" style={{ color: '#8fa3c9' }}>Display · Black 900 · 34/40</p>
              <p className="font-extrabold mt-4 leading-tight" style={{ fontSize: 22 }}>試合を予想する</p>
              <p className="text-[10px] font-bold mt-1" style={{ color: '#8fa3c9' }}>Title · ExtraBold 800 · 22/28</p>
              <p className="font-bold mt-4 text-[15px]">久保建英 のゴールを予想</p>
              <p className="text-[10px] font-bold mt-1" style={{ color: '#8fa3c9' }}>Body Strong · Bold 700 · 15</p>
              <p className="mt-4 text-[13px]" style={{ color: '#C9D6EC' }}>友達と勝敗を予想して競い合う。</p>
              <p className="text-[10px] font-bold mt-1" style={{ color: '#8fa3c9' }}>Body · Regular 400 · 13</p>
              <p className="font-black tabular-nums mt-4" style={{ fontSize: 30, color: '#F4B400' }}>24,812<span className="text-[13px] font-bold ml-1" style={{ color: '#8fa3c9' }}>票</span></p>
              <p className="text-[10px] font-bold mt-1" style={{ color: '#8fa3c9' }}>Numerals · Black · tabular · 数字は太く大きく</p>
            </div>
          </Panel>

          {/* BUTTONS */}
          <Panel title="BUTTONS — STATES" span={2}>
            <div className="grid grid-cols-4 gap-3">
              <Btn kind="primary" icon="ball">予想する</Btn>
              <Btn kind="primary-hover" icon="ball">予想する</Btn>
              <Btn kind="primary-active" icon="ball">予想する</Btn>
              <Btn kind="primary-disabled" icon="ball">予想する</Btn>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <Btn kind="gold" icon="trophy">バッジを見る</Btn>
              <Btn kind="ghost">ひとりで始める</Btn>
              <Btn kind="ghost" icon="share">シェア</Btn>
            </div>
          </Panel>

          {/* BADGES */}
          <Panel title="BADGES & PILLS">
            <div className="flex flex-wrap gap-2.5">
              <span className="inline-flex items-center gap-1 text-[12px] font-extrabold px-3 py-1.5 rounded-full whitespace-nowrap" style={{ background: 'rgba(244,180,0,.16)', color: '#F4B400' }}><Icon name="flame" size={14} />5連続的中</span>
              <span className="inline-flex items-center gap-1 text-[12px] font-extrabold px-3 py-1.5 rounded-full whitespace-nowrap" style={{ background: 'rgba(230,0,51,.14)', color: '#ff6a86' }}><Icon name="clock" size={14} />締切間近</span>
              <span className="inline-flex items-center gap-1 text-[12px] font-extrabold px-3 py-1.5 rounded-full whitespace-nowrap" style={{ background: 'rgba(255,255,255,.10)', color: '#C9D6EC' }}>3位 / 12人</span>
              <span className="inline-flex items-center gap-1 text-[12px] font-extrabold px-3 py-1.5 rounded-full whitespace-nowrap" style={{ background: '#fff', color: '#0a1f4c' }}><Icon name="check" size={14} />的中 +3pt</span>
              <span className="inline-flex items-center gap-1 text-[12px] font-extrabold px-3 py-1.5 rounded-full whitespace-nowrap" style={{ background: 'rgba(14,138,70,.18)', color: '#34d27e' }}>LIVE</span>
            </div>
            <div className="flex items-center gap-3 mt-4">
              {[['trophy','#F4B400','獲得'],['bolt','#E60033','獲得'],['lock','#6f84ac','未獲得']].map(([ic,col,st],i)=>(
                <div key={i} className="flex flex-col items-center">
                  <span className="flex items-center justify-center" style={{ width: 48, height: 48, borderRadius: 14, background: st==='未獲得'?'rgba(255,255,255,.06)':`${col}22`, color: col, border: `1.5px solid ${col}55` }}><Icon name={ic} size={24} /></span>
                  <span className="text-[10px] font-bold mt-1" style={{ color: '#8fa3c9' }}>{st}</span>
                </div>
              ))}
            </div>
          </Panel>

          {/* FORM */}
          <Panel title="INPUT / FORM">
            <label className="text-[12px] font-bold" style={{ color: '#C9D6EC' }}>大会名</label>
            <div className="mt-1.5 rounded-xl px-3.5 py-3 text-[14px] font-bold" style={{ background: '#fff', color: '#0a1f4c', boxShadow: '0 4px 14px rgba(0,0,0,.25)' }}>陸たちのW杯2026</div>
            <p className="text-[10px] font-bold mt-1" style={{ color: '#8fa3c9' }}>Filled · white card</p>
            <label className="text-[12px] font-bold mt-4 block" style={{ color: '#C9D6EC' }}>招待コード</label>
            <div className="mt-1.5 rounded-xl px-3.5 py-3 text-[14px] font-bold" style={{ background: 'rgba(255,255,255,.06)', color: '#6f84ac', border: '2px solid #F4B400' }}>WC26-▮</div>
            <p className="text-[10px] font-bold mt-1" style={{ color: '#8fa3c9' }}>Focus · gold ring</p>
          </Panel>

          {/* CARD */}
          <Panel title="DATA CARD — floats on navy">
            <div className="rounded-2xl bg-white px-4 py-3.5" style={{ boxShadow: '0 14px 34px rgba(4,12,33,.45)' }}>
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold" style={{ color: '#5B6B85' }}>今日の試合</span>
                <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full" style={{ background: 'rgba(230,0,51,.10)', color: '#E60033' }}>未予想 3</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="font-black text-[15px]" style={{ color: '#0a1f4c' }}>日本</span>
                <span className="text-[12px] font-black px-2.5 py-1 rounded-lg" style={{ background: '#F0F4FA', color: '#5B6B85' }}>VS</span>
                <span className="font-black text-[15px]" style={{ color: '#0a1f4c' }}>ドイツ</span>
              </div>
            </div>
            <p className="text-[11px] mt-3 leading-relaxed" style={{ color: '#8fa3c9' }}>白カード + 深い影で「ネイビーの上に浮く」。角丸 16–24px、影は濃いめ。</p>
          </Panel>

          {/* TOKENS */}
          <Panel title="RADIUS · SHADOW · SPACING">
            <div className="flex items-end gap-3">
              {[['12','lg'],['16','xl'],['24','2xl'],['32','3xl']].map(([r,n])=>(
                <div key={n} className="flex flex-col items-center">
                  <div style={{ width: 46, height: 46, borderRadius: Number(r), background: 'rgba(255,255,255,.10)', border: '1px solid rgba(255,255,255,.18)' }} />
                  <span className="text-[10px] font-bold mt-1" style={{ color: '#8fa3c9' }}>{r}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 mt-5">
              <div className="rounded-2xl bg-white" style={{ width: 56, height: 40, boxShadow: '0 4px 14px rgba(0,0,0,.25)' }} />
              <div className="rounded-2xl bg-white" style={{ width: 56, height: 40, boxShadow: '0 10px 26px rgba(4,12,33,.35)' }} />
              <div className="rounded-2xl bg-white" style={{ width: 56, height: 40, boxShadow: '0 18px 50px rgba(0,0,0,.5)' }} />
            </div>
            <p className="text-[10px] font-bold mt-2" style={{ color: '#8fa3c9' }}>card · float · hero — 3段の浮遊感</p>
            <div className="flex items-center gap-2 mt-5">
              {[4,8,12,16,24].map(s=>(<div key={s} className="flex flex-col items-center"><div style={{ width: s, height: 22, background: '#F4B400', borderRadius: 2 }} /><span className="text-[9px] font-bold mt-1" style={{ color: '#8fa3c9' }}>{s}</span></div>))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { DesignSystem });
