// japan_shop.jsx — Screen 8 (日本代表モード) + Screen 9 (コインショップ)

// ── Screen 8 : 日本代表モード ────────────────────────────────
function JapanScreen() {
  const jp = useCountdown(JP_KICKOFF);
  const [cheered, setCheered] = React.useState(null);
  const nav = React.useContext(NavCtx);
  const cheers = ['ニッポン！', '行け久保！', '守れ！', '🔥🔥🔥'];
  const form = [
    { o: 'カナダ', r: 'W', s: '2-1' },
    { o: 'ガーナ', r: 'W', s: '4-1' },
    { o: 'スペイン', r: 'D', s: '1-1' },
    { o: 'ドイツ', r: 'L', s: '1-2' },
  ];
  const rc = { W: '#0e8a46', D: '#F4B400', L: '#E60033' };

  return (
    <PhoneChrome dark>
      <div className="h-full flex flex-col" style={{ background: '#0a1f4c' }}>
        {/* hero */}
        <div className="relative overflow-hidden shrink-0" style={{ background: 'linear-gradient(165deg,#061533,#0d2a5e)' }}>
          <div className="absolute pointer-events-none" style={{ top: -60, right: -40, width: 200, height: 200, background: 'radial-gradient(circle,rgba(230,0,51,.28),transparent 65%)' }} />
          <div className="relative px-5 pt-3 pb-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><Flag size={26} /><span className="text-white font-black text-[17px] whitespace-nowrap">日本代表モード</span></div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap" style={{ background: 'rgba(255,255,255,.1)', color: '#C9D6EC' }}>SAMURAI BLUE</span>
            </div>

            <div className="mt-5 text-center">
              <p className="text-[12px] font-bold tracking-wider" style={{ color: '#F4B400' }}>次の日本戦まで</p>
              <div className="flex items-start justify-center gap-3 mt-2">
                {[[jp.dd, 'DAYS'], [jp.hh, 'HRS'], [jp.mm, 'MIN'], [jp.ss, 'SEC']].map(([v, l], i) => (
                  <React.Fragment key={l}>
                    {i > 0 && <span className="font-black text-[26px] -mt-1" style={{ color: 'rgba(201,214,236,.4)' }}>:</span>}
                    <div className="flex flex-col items-center"><span className="font-black tabular-nums text-white leading-none" style={{ fontSize: 34 }}>{v}</span><span className="text-[10px] font-bold mt-1" style={{ color: i === 0 ? '#F4B400' : '#8fa3c9' }}>{l}</span></div>
                  </React.Fragment>
                ))}
              </div>
              <p className="mt-3 text-white font-black text-[15px]">日本 <span style={{ color: '#8fa3c9' }}>vs</span> ブラジル</p>
              <p className="text-[11px] font-bold" style={{ color: '#8fa3c9' }}>6/16 (火) 22:00 · ロサンゼルス SoFi Stadium</p>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden px-5 pt-4 pb-3">
          {/* 結果速報 → 勝利演出 */}
          <button onClick={() => nav.victory()} className="w-full mb-4 rounded-2xl px-4 py-3 flex items-center gap-3 active:scale-[.99] transition-transform" style={{ background: 'linear-gradient(110deg,#E60033,#ff3a63)', boxShadow: '0 10px 26px rgba(230,0,51,.4)' }}>
            <span className="flex items-center justify-center shrink-0" style={{ width: 34, height: 34, borderRadius: 11, background: 'rgba(255,255,255,.2)' }}><Icon name="trophy" size={19} className="text-white" /></span>
            <div className="text-left min-w-0 flex-1">
              <p className="text-white font-black text-[14px] whitespace-nowrap">速報：日本 2-1 ドイツ 🎉</p>
              <p className="text-[11px] font-bold whitespace-nowrap" style={{ color: 'rgba(255,255,255,.85)' }}>あなたの予想 的中！ 結果を見る</p>
            </div>
            <span style={{ display: 'inline-flex' }} className="text-white shrink-0"><Icon name="chevron" size={20} /></span>
          </button>

          {/* 結果演出プレビュー（デモ用） */}
          <div className="flex items-center gap-2 mb-4 -mt-1.5">
            <span className="text-[10px] font-bold whitespace-nowrap" style={{ color: '#5e74a0' }}>演出プレビュー</span>
            <div className="flex gap-1.5 flex-1">
              {[['win', '勝利', '#F4B400'], ['draw', 'ドロー', '#C9D6EC'], ['lose', '敗戦', '#8fa3c9']].map(([res, label, col]) => (
                <button key={res} onClick={() => nav.victory(res)} className="flex-1 rounded-lg py-1.5 text-[11px] font-extrabold whitespace-nowrap active:scale-95 transition-transform"
                  style={{ background: 'rgba(255,255,255,.06)', color: col, border: '1px solid rgba(255,255,255,.1)' }}>{label}</button>
              ))}
            </div>
          </div>

          {/* 応援クイック投稿 */}
          <p className="text-[12px] font-extrabold mb-2" style={{ color: '#C9D6EC' }}>応援を送る</p>
          <div className="grid grid-cols-2 gap-2.5">
            {cheers.map((c) => {
              const on = cheered === c;
              return (
                <button key={c} onClick={() => setCheered(c)}
                  className="rounded-2xl py-3 font-black text-[14px] whitespace-nowrap transition-all active:scale-[.96]"
                  style={on ? { background: '#E60033', color: '#fff', boxShadow: '0 8px 20px rgba(230,0,51,.4)' } : { background: '#fff', color: '#0a1f4c' }}>{c}</button>
              );
            })}
          </div>
          <p className="text-[11px] font-bold mt-2 text-center" style={{ color: '#8fa3c9' }}>みんなの応援 <span className="font-black" style={{ color: '#F4B400' }}>24,812</span> 件 · タップで参加</p>

          {/* 過去戦績 */}
          <p className="text-[12px] font-extrabold mt-3 mb-2" style={{ color: '#C9D6EC' }}>最近の戦績</p>
          <div className="rounded-2xl bg-white px-3.5 py-3" style={{ boxShadow: '0 10px 26px rgba(4,12,33,.28)' }}>
            <div className="flex items-center justify-between">
              {form.map((f, i) => (
                <div key={i} className="flex flex-col items-center gap-1 flex-1">
                  <span className="flex items-center justify-center font-black text-white text-[13px]" style={{ width: 28, height: 28, borderRadius: '50%', background: rc[f.r] }}>{f.r}</span>
                  <span className="text-[10px] font-bold whitespace-nowrap" style={{ color: '#5B6B85' }}>{f.o}</span>
                  <span className="text-[10px] font-black tabular-nums" style={{ color: '#0a1f4c' }}>{f.s}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 得点者予想ランキング */}
          <div className="flex items-center gap-1.5 mt-3 mb-2">
            <p className="text-[12px] font-extrabold" style={{ color: '#C9D6EC' }}>得点者予想 みんなの本命</p>
            <button onClick={() => nav.go('scorer')} className="ml-auto text-[11px] font-bold whitespace-nowrap" style={{ color: '#F4B400' }}>予想する ›</button>
          </div>
          <div className="flex flex-col gap-1.5">
            {[['久保建英', 38], ['三笘 薫', 31], ['上田綺世', 22]].map(([n, p], i) => (
              <div key={n} className="flex items-center gap-2.5 rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,.06)' }}>
                <span className="font-bold text-[13px] w-20 whitespace-nowrap text-white">{n}</span>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,.1)' }}><div style={{ width: `${p}%`, height: '100%', background: i === 0 ? '#F4B400' : '#2a5bd0', borderRadius: 4 }} /></div>
                <span className="text-[11px] font-black tabular-nums" style={{ color: i === 0 ? '#F4B400' : '#8fa3c9' }}>{p}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PhoneChrome>
  );
}

// ── Screen 9 : コインショップ ────────────────────────────────
function ShopScreen() {
  const [claimed, setClaimed] = React.useState(false);
  const days = [50, 50, 80, 80, 100, 100, 200];
  const today = 4; // 0-indexed, day 5
  const missions = [
    { ic: 'ball', t: '試合を3件予想する', sub: '2 / 3 完了', r: 30 },
    { ic: 'share', t: '予想カードをシェア', sub: 'LINE / X に投稿', r: 50 },
    { ic: 'chart', t: 'ランキングを確認', sub: '今日まだ', r: 10 },
    { ic: 'flame', t: '友達を1人招待', sub: '招待コードを送る', r: 200 },
  ];
  return (
    <PhoneChrome dark>
      <div className="h-full flex flex-col" style={{ background: '#0a1f4c' }}>
        <ScreenHeader title="コインショップ" />

        {/* balance */}
        <div className="mx-5 rounded-3xl px-5 py-4 flex items-center justify-between" style={{ background: 'linear-gradient(135deg,#F4B400,#ffce4a)', boxShadow: '0 12px 30px rgba(244,180,0,.3)' }}>
          <div>
            <p className="text-[12px] font-extrabold" style={{ color: '#7a5800' }}>コイン残高</p>
            <p className="font-black tabular-nums leading-none mt-1" style={{ fontSize: 36, color: '#3a2a00' }}>1,240 <span className="text-[18px]">🪙</span></p>
          </div>
          <Icon name="coin" size={56} className="opacity-30" style={{ color: '#7a5800' }} />
        </div>

        <div className="flex-1 min-h-0 overflow-hidden px-5 pt-4 pb-3">
          {/* daily login */}
          <p className="text-[12px] font-extrabold mb-2" style={{ color: '#C9D6EC' }}>毎日ログインボーナス</p>
          <div className="rounded-2xl bg-white px-3 py-3" style={{ boxShadow: '0 10px 26px rgba(4,12,33,.28)' }}>
            <div className="flex items-end justify-between gap-1">
              {days.map((d, i) => {
                const done = i < today, isToday = i === today;
                return (
                  <div key={i} className="flex flex-col items-center gap-1 flex-1">
                    <span className="flex items-center justify-center font-black text-[10px]" style={{ width: 30, height: 30, borderRadius: 10,
                      background: done ? 'rgba(14,138,70,.15)' : isToday ? '#E60033' : '#F0F4FA',
                      color: done ? '#0e8a46' : isToday ? '#fff' : '#5B6B85' }}>{done ? <Icon name="check" size={15} /> : `+${d}`}</span>
                    <span className="text-[9px] font-bold" style={{ color: isToday ? '#E60033' : '#8fa3c9' }}>{i + 1}日</span>
                  </div>
                );
              })}
            </div>
            <button onClick={() => setClaimed(true)} disabled={claimed}
              className="w-full rounded-xl py-2.5 mt-3 font-extrabold text-[14px] whitespace-nowrap transition-all active:scale-[.98]"
              style={claimed ? { background: '#F0F4FA', color: '#5B6B85' } : { background: '#E60033', color: '#fff', boxShadow: '0 6px 16px rgba(230,0,51,.35)' }}>
              {claimed ? '受け取り済み ✓' : '今日の +100🪙 を受け取る'}
            </button>
          </div>

          {/* free missions */}
          <p className="text-[12px] font-extrabold mt-4 mb-2" style={{ color: '#C9D6EC' }}>無料ミッション</p>
          <div className="flex flex-col gap-2">
            {missions.map((m, i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5" style={{ background: 'rgba(255,255,255,.06)' }}>
                <span className="flex items-center justify-center shrink-0" style={{ width: 34, height: 34, borderRadius: 11, background: 'rgba(244,180,0,.16)', color: '#F4B400' }}><Icon name={m.ic} size={18} /></span>
                <div className="flex-1 min-w-0"><p className="font-bold text-[13px] text-white whitespace-nowrap">{m.t}</p><p className="text-[11px] font-bold" style={{ color: '#8fa3c9' }}>{m.sub}</p></div>
                <span className="text-[12px] font-black tabular-nums px-2.5 py-1 rounded-full whitespace-nowrap" style={{ background: 'rgba(244,180,0,.16)', color: '#F4B400' }}>+{m.r}🪙</span>
              </div>
            ))}
          </div>

          {/* 換金不可 明示 */}
          <div className="rounded-2xl px-4 py-3 mt-4 flex items-start gap-2.5" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.10)' }}>
            <span className="shrink-0 mt-0.5" style={{ color: '#8fa3c9' }}><Icon name="lock" size={16} /></span>
            <p className="text-[11px] leading-relaxed" style={{ color: '#8fa3c9' }}>コインはアプリ内だけで使えるバーチャルアイテムです。<b style={{ color: '#C9D6EC' }}>現金・景品への換金や出金はできません。</b>本サービスは賭博ではありません。</p>
          </div>
        </div>
      </div>
    </PhoneChrome>
  );
}

Object.assign(window, { JapanScreen, ShopScreen });
