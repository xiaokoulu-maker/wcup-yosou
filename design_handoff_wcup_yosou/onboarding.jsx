// onboarding.jsx — 30秒で初予想の最短導線（新規オンボーディング）
// イントロ → 名前 → 大会 → 最初の予想 → 完了。経過秒数を見せて「速さ」を演出。

function OBProgress({ step, secs }) {
  // step 1..3 の進捗ドット + 経過タイマー
  return (
    <div className="flex items-center justify-between px-6 pt-1 pb-3 shrink-0">
      <div className="flex items-center gap-1.5">
        {[1, 2, 3].map((s) => (
          <span key={s} style={{ width: s === step ? 22 : 7, height: 7, borderRadius: 4, background: s <= step ? '#E60033' : 'rgba(255,255,255,.18)', transition: 'all .25s' }} />
        ))}
        <span className="text-[11px] font-bold ml-1.5 whitespace-nowrap" style={{ color: '#8fa3c9' }}>ステップ {step}/3</span>
      </div>
      <span className="flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-full tabular-nums whitespace-nowrap" style={{ background: 'rgba(244,180,0,.16)', color: '#F4B400' }}>
        <Icon name="clock" size={13} /> {secs}秒
      </span>
    </div>
  );
}

function Onboarding({ onDone = () => {} }) {
  const [step, setStep] = React.useState(0);     // 0 intro · 1 name · 2 mode · 3 predict · 4 done
  const [name, setName] = React.useState('陸');
  const [mode, setMode] = React.useState(null);
  const [pick, setPick] = React.useState(null);
  const [startTs, setStartTs] = React.useState(null);
  const [secs, setSecs] = React.useState(0);
  const finalSecs = React.useRef(0);

  React.useEffect(() => {
    if (startTs == null || step >= 4) return;
    const id = setInterval(() => setSecs(Math.floor((Date.now() - startTs) / 1000)), 250);
    return () => clearInterval(id);
  }, [startTs, step]);

  const start = () => { setStartTs(Date.now()); setStep(1); };
  const toDone = (p) => { setPick(p); finalSecs.current = startTs ? Math.max(8, Math.floor((Date.now() - startTs) / 1000)) : 18; setStep(4); };

  return (
    <PhoneChrome dark>
      <div className="h-full flex flex-col" style={{ background: 'linear-gradient(180deg,#061533,#0a1f4c 60%,#0d2a5e)' }}>
        {step >= 1 && step <= 3 && <OBProgress step={step} secs={secs} />}

        {/* ── intro ── */}
        {step === 0 && (
          <div className="flex-1 flex flex-col px-7 pt-6 pb-7" style={{ animation: 'wcRise .4s both' }}>
            <div className="relative">
              <div className="absolute pointer-events-none" style={{ top: -30, left: '50%', transform: 'translateX(-50%)', width: 280, height: 200, background: 'radial-gradient(circle,rgba(244,180,0,.25),transparent 65%)' }} />
              <p className="relative text-[12px] font-extrabold tracking-[0.22em] text-center mt-6" style={{ color: '#F4B400' }}>30秒チャレンジ</p>
              <h1 className="relative text-center font-black text-white leading-[1.15] mt-3" style={{ fontSize: 32 }}>30秒で、<br />予想デビュー。</h1>
              <p className="relative text-center text-[13px] mt-3 leading-relaxed" style={{ color: '#C9D6EC' }}>3ステップだけ。今すぐ友達と<br />勝敗を競い合える。</p>
            </div>
            <div className="mt-8 flex flex-col gap-2.5">
              {[['ball', '勝敗をワンタップで予想'], ['chart', '友達とライブ順位で競争'], ['flame', '日本代表をみんなで応援']].map(([ic, t]) => (
                <div key={t} className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)' }}>
                  <span className="flex items-center justify-center shrink-0" style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(244,180,0,.16)', color: '#F4B400' }}><Icon name={ic} size={18} /></span>
                  <span className="text-[13.5px] font-bold text-white whitespace-nowrap">{t}</span>
                </div>
              ))}
            </div>
            <div className="flex-1" />
            <button onClick={start} className="w-full rounded-2xl py-4 font-extrabold text-[17px] whitespace-nowrap text-white active:scale-[.98] transition-transform" style={{ background: '#E60033', boxShadow: '0 10px 26px rgba(230,0,51,.42)' }}>はじめる</button>
            <p className="text-center text-[11px] mt-2.5" style={{ color: '#8fa3c9' }}>登録不要・無料・あとから設定OK</p>
          </div>
        )}

        {/* ── step 1: name ── */}
        {step === 1 && (
          <div className="flex-1 flex flex-col px-7 pt-4 pb-7" style={{ animation: 'wcRise .35s both' }} key="s1">
            <h2 className="font-black text-white text-[24px] leading-tight">ニックネームを<br />決めよう</h2>
            <p className="text-[13px] mt-2" style={{ color: '#8fa3c9' }}>順位やシェアカードに表示されます</p>
            <div className="mt-6 rounded-2xl px-4 py-3.5 flex items-center gap-3" style={{ background: '#fff', boxShadow: '0 8px 22px rgba(0,0,0,.3)' }}>
              <span className="font-black text-[18px]" style={{ color: '#0a1f4c' }}>{name || 'なまえ'}</span>
              <span className="ml-auto text-[11px] font-bold px-2 py-1 rounded-full" style={{ background: '#F0F4FA', color: '#5B6B85' }}>編集</span>
            </div>
            <p className="text-[11px] font-bold mt-4 mb-2" style={{ color: '#8fa3c9' }}>候補からえらぶ</p>
            <div className="flex flex-wrap gap-2">
              {['陸', 'はると', 'サムライ侍', 'KUBO推し', '青のサポーター'].map((n) => (
                <button key={n} onClick={() => setName(n)} className="rounded-full px-3.5 py-2 text-[13px] font-bold whitespace-nowrap active:scale-95 transition-transform"
                  style={name === n ? { background: '#E60033', color: '#fff' } : { background: 'rgba(255,255,255,.08)', color: '#C9D6EC', border: '1px solid rgba(255,255,255,.14)' }}>{n}</button>
              ))}
            </div>
            <div className="flex-1" />
            <button onClick={() => setStep(2)} disabled={!name} className="w-full rounded-2xl py-4 font-extrabold text-[16px] whitespace-nowrap text-white active:scale-[.98] transition-transform" style={{ background: name ? '#E60033' : 'rgba(230,0,51,.3)', boxShadow: name ? '0 10px 26px rgba(230,0,51,.42)' : 'none' }}>次へ</button>
          </div>
        )}

        {/* ── step 2: mode ── */}
        {step === 2 && (
          <div className="flex-1 flex flex-col px-7 pt-4 pb-7" style={{ animation: 'wcRise .35s both' }} key="s2">
            <h2 className="font-black text-white text-[24px] leading-tight">どう遊ぶ？</h2>
            <p className="text-[13px] mt-2" style={{ color: '#8fa3c9' }}>あとからどちらも参加できます</p>
            <div className="mt-6 flex flex-col gap-3">
              <button onClick={() => { setMode('create'); setStep(3); }} className="text-left rounded-3xl px-5 py-4 active:scale-[.98] transition-transform" style={{ background: 'linear-gradient(135deg,#E60033,#ff5a7a)', boxShadow: '0 12px 30px rgba(230,0,51,.4)' }}>
                <div className="flex items-center gap-2 mb-1"><Icon name="plus" size={18} className="text-white" /><span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,.22)', color: '#fff' }}>おすすめ</span></div>
                <p className="text-white font-black text-[18px] whitespace-nowrap">友達と大会を作る</p>
                <p className="text-[12px] font-bold mt-0.5" style={{ color: 'rgba(255,255,255,.85)' }}>30秒で作成・LINEで招待</p>
              </button>
              <button onClick={() => { setMode('join'); setStep(3); }} className="text-left rounded-3xl px-5 py-4 active:scale-[.98] transition-transform" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.14)' }}>
                <Icon name="share" size={18} style={{ color: '#F4B400' }} />
                <p className="text-white font-black text-[18px] mt-1 whitespace-nowrap">招待コードで参加</p>
                <p className="text-[12px] font-bold mt-0.5" style={{ color: '#8fa3c9' }}>友達のコードを入力して合流</p>
              </button>
            </div>
            <div className="flex-1" />
            <p className="text-center text-[11px]" style={{ color: '#8fa3c9' }}>選ぶとすぐ最初の予想へ</p>
          </div>
        )}

        {/* ── step 3: first prediction ── */}
        {step === 3 && (
          <div className="flex-1 flex flex-col px-6 pt-3 pb-7" style={{ animation: 'wcRise .35s both' }} key="s3">
            <h2 className="font-black text-white text-[22px] leading-tight px-1">ラスト！<br />最初の予想をワンタップ</h2>
            {/* match card */}
            <div className="mt-4 rounded-3xl px-4 py-4" style={{ background: 'linear-gradient(160deg,#0d2a5e,#0a1f4c)', border: '1px solid rgba(255,255,255,.1)', boxShadow: '0 12px 30px rgba(4,12,33,.4)' }}>
              <p className="text-center text-[11px] font-bold mb-2" style={{ color: '#F4B400' }}>注目の一戦 · グループC</p>
              <div className="flex items-center justify-around">
                <div className="flex flex-col items-center gap-1.5"><Flag size={32} /><span className="text-white font-black text-[14px]">日本</span></div>
                <span className="font-black text-[22px]" style={{ color: 'rgba(255,255,255,.25)' }}>VS</span>
                <div className="flex flex-col items-center gap-1.5"><span style={{ width: 32, height: 22, borderRadius: 3, overflow: 'hidden', display: 'inline-flex' }}><span style={{ flex: 1, background: '#000' }} /><span style={{ flex: 1, background: '#D00' }} /><span style={{ flex: 1, background: '#FFCE00' }} /></span><span className="text-white font-black text-[14px]">ドイツ</span></div>
              </div>
            </div>
            <p className="text-center text-[12px] font-bold mt-4" style={{ color: '#C9D6EC' }}>勝つのはどっち？ <span style={{ color: '#F4B400' }}>当たれば +3pt</span></p>
            <div className="flex gap-2.5 mt-3">
              {[['jp', '🇯🇵', '日本'], ['draw', '🤝', '引分け'], ['de', '🇩🇪', 'ドイツ']].map(([id, e, l]) => (
                <button key={id} onClick={() => toDone(id)} className="flex-1 rounded-2xl py-4 flex flex-col items-center gap-1.5 bg-white active:scale-[.96] transition-transform" style={{ boxShadow: '0 8px 20px rgba(4,12,33,.25)' }}>
                  <span className="text-[24px] leading-none">{e}</span>
                  <span className="font-black text-[13px] whitespace-nowrap" style={{ color: '#0a1f4c' }}>{l}</span>
                </button>
              ))}
            </div>
            <div className="flex-1" />
            <p className="text-center text-[11px]" style={{ color: '#8fa3c9' }}>タップした瞬間に予想完了 ⚡</p>
          </div>
        )}

        {/* ── step 4: done ── */}
        {step === 4 && (
          <div className="relative flex-1 overflow-hidden">
            <Confetti count={26} />
            <div className="relative h-full flex flex-col px-7 pt-6 pb-7 items-center text-center" style={{ zIndex: 3 }}>
              <div style={{ animation: 'wcPopBig .5s cubic-bezier(.2,.9,.3,1.2) both' }} className="mt-8">
                <span className="flex items-center justify-center mx-auto" style={{ width: 76, height: 76, borderRadius: '50%', background: 'linear-gradient(135deg,#F4B400,#ffce4a)', boxShadow: '0 12px 34px rgba(244,180,0,.5)' }}><Icon name="check" size={42} style={{ color: '#3a2a00' }} /></span>
              </div>
              <p className="text-[12px] font-extrabold tracking-wide mt-4" style={{ color: '#F4B400' }}>予想デビュー完了！🎉</p>
              <h1 className="text-white font-black leading-tight mt-1" style={{ fontSize: 26 }}>たった<span className="tabular-nums" style={{ color: '#F4B400' }}>{finalSecs.current}</span>秒で参戦！</h1>
              <p className="text-[13px] mt-2" style={{ color: '#C9D6EC' }}>{name} として大会にエントリー</p>

              <div className="w-full rounded-2xl px-4 py-3.5 mt-6" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)' }}>
                <div className="flex items-center justify-center gap-3">
                  <Flag size={22} /><span className="font-black text-white text-[15px] whitespace-nowrap">日本 {pick === 'jp' ? '勝利' : pick === 'draw' ? '引き分け' : 'ドイツ勝利'} に予想</span>
                </div>
                <p className="text-[11px] font-bold mt-1.5" style={{ color: '#8fa3c9' }}>結果が出たら自動採点・順位に反映</p>
              </div>

              <div className="flex-1" />
              <button onClick={onDone} className="w-full rounded-2xl py-4 font-extrabold text-[16px] whitespace-nowrap text-white active:scale-[.98] transition-transform" style={{ background: '#E60033', boxShadow: '0 10px 26px rgba(230,0,51,.42)' }}>ホームでみんなと競う</button>
              <button onClick={() => { setStep(3); }} className="mt-2.5 text-[13px] font-bold whitespace-nowrap" style={{ color: '#8fa3c9' }}>もう1試合 予想する</button>
            </div>
          </div>
        )}
      </div>
    </PhoneChrome>
  );
}

Object.assign(window, { Onboarding });
