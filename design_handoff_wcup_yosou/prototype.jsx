// prototype.jsx — interactive clickable flow tying all screens together.
// A single phone with bottom-tab routing, a 予想完了 victory modal, and a
// share-card overlay. Mounted as one artboard; works in focus mode too.

const PICK_LABEL = { jp: '日本 勝利', draw: '引き分け', de: 'ドイツ 勝利' };
const SCORER_NAME = { kubo: '久保建英', mitoma: '三笘 薫', ueda: '上田綺世', doan: '堂安 律' };

// 予想完了：勝利演出風モーダル
function CompletionModal({ pred, onClose, onRank, onShare }) {
  const p = pred || { pick: 'jp', bet: 120, scorer: 'kubo' };
  return (
    <div className="absolute inset-0 z-40 flex items-end" style={{ background: 'rgba(4,10,28,.66)', backdropFilter: 'blur(3px)' }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full rounded-t-[28px] px-6 pt-6 pb-7 relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg,#0d2a5e,#0a1f4c)', borderTop: '1px solid rgba(244,180,0,.4)', animation: 'wcSheet .34s cubic-bezier(.2,.8,.25,1)' }}>
        {/* glow burst */}
        <div className="absolute pointer-events-none" style={{ top: -70, left: '50%', transform: 'translateX(-50%)', width: 300, height: 220, background: 'radial-gradient(circle,rgba(244,180,0,.32),transparent 65%)' }} />

        <div className="relative flex flex-col items-center text-center">
          <span className="flex items-center justify-center" style={{ width: 70, height: 70, borderRadius: '50%', background: 'linear-gradient(135deg,#F4B400,#ffce4a)', boxShadow: '0 10px 30px rgba(244,180,0,.5)', animation: 'wcPop .4s .05s both' }}>
            <Icon name="check" size={40} style={{ color: '#3a2a00' }} />
          </span>
          <p className="text-[12px] font-extrabold tracking-wide mt-3" style={{ color: '#F4B400' }}>予想を保存しました！</p>
          <h2 className="text-white font-black text-[22px] leading-tight mt-1">いざ、勝負。🔥</h2>

          {/* recap */}
          <div className="w-full rounded-2xl px-4 py-3.5 mt-4" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.10)' }}>
            <div className="flex items-center justify-center gap-3">
              <Flag size={24} />
              <span className="font-black tabular-nums text-white whitespace-nowrap" style={{ fontSize: 28 }}>{p.pick === 'jp' ? '2' : p.pick === 'draw' ? '1' : '1'}<span style={{ color: '#8fa3c9' }}>-</span>{p.pick === 'jp' ? '1' : p.pick === 'draw' ? '1' : '2'}</span>
              <span style={{ width: 24, height: 17, borderRadius: 3, overflow: 'hidden', display: 'inline-flex' }}><span style={{ flex: 1, background: '#000' }} /><span style={{ flex: 1, background: '#D00' }} /><span style={{ flex: 1, background: '#FFCE00' }} /></span>
            </div>
            <p className="text-[12px] font-bold mt-2 whitespace-nowrap" style={{ color: '#C9D6EC' }}>{PICK_LABEL[p.pick]} ・ 得点者 {SCORER_NAME[p.scorer]} ・ {p.bet}🪙</p>
          </div>

          <div className="flex items-center gap-4 mt-3">
            <span className="text-[12px] font-bold" style={{ color: '#8fa3c9' }}>的中で <span className="font-black" style={{ color: '#F4B400' }}>+5pt</span></span>
            <span style={{ width: 1, height: 14, background: 'rgba(255,255,255,.15)' }} />
            <span className="text-[12px] font-bold whitespace-nowrap" style={{ color: '#8fa3c9' }}>🔥 6連続なるか？</span>
          </div>

          {/* actions */}
          <button onClick={onShare} className="w-full rounded-2xl py-3.5 mt-5 flex items-center justify-center gap-2 font-extrabold text-[15px] whitespace-nowrap active:scale-[.98] transition-transform"
            style={{ background: '#F4B400', color: '#3a2a00', boxShadow: '0 8px 22px rgba(244,180,0,.35)' }}>
            <Icon name="share" size={18} /> 予想カードをシェア
          </button>
          <div className="grid grid-cols-2 gap-2.5 w-full mt-2.5">
            <button onClick={onRank} className="rounded-2xl py-3 font-bold text-[14px] whitespace-nowrap active:scale-[.98] transition-transform" style={{ background: 'rgba(255,255,255,.08)', color: '#C9D6EC', border: '1px solid rgba(255,255,255,.14)' }}>順位を見る</button>
            <button onClick={onClose} className="rounded-2xl py-3 font-bold text-[14px] whitespace-nowrap active:scale-[.98] transition-transform" style={{ background: 'rgba(255,255,255,.08)', color: '#C9D6EC', border: '1px solid rgba(255,255,255,.14)' }}>続けて予想</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// シェアカードのプレビュー＋投稿オーバーレイ
function ShareOverlay({ onClose }) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col" style={{ background: 'rgba(4,10,28,.82)', backdropFilter: 'blur(6px)' }} onClick={onClose}>
      <div className="flex items-center justify-between px-5 pt-4 pb-2 shrink-0" onClick={(e) => e.stopPropagation()}>
        <span className="text-white font-black text-[15px]">シェアする</span>
        <button onClick={onClose} className="flex items-center justify-center" style={{ width: 30, height: 30, borderRadius: 15, background: 'rgba(255,255,255,.12)', color: '#fff', fontSize: 18, lineHeight: 1 }}>×</button>
      </div>
      <div className="flex-1 min-h-0 flex items-center justify-center px-5" onClick={(e) => e.stopPropagation()}>
        <div style={{ width: 300, height: 533, borderRadius: 22, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,.55)', animation: 'wcPop .34s both' }}>
          <ShareCard />
        </div>
      </div>
      <div className="shrink-0 px-5 pt-3 pb-6 flex items-center justify-center gap-3" onClick={(e) => e.stopPropagation()}>
        {[['LINE', '#06C755'], ['X', '#111'], ['保存', 'rgba(255,255,255,.14)']].map(([t, bg]) => (
          <button key={t} className="flex-1 rounded-2xl py-3 font-extrabold text-[14px] text-white whitespace-nowrap active:scale-[.97] transition-transform" style={{ background: bg, border: t === '保存' ? '1px solid rgba(255,255,255,.2)' : 'none' }}>{t === '保存' ? '画像を保存' : t}</button>
        ))}
      </div>
    </div>
  );
}

function PrototypeApp() {
  const [screen, setScreen] = React.useState('welcome');
  const [modal, setModal] = React.useState(null);   // 'complete' | 'share' | 'victory'
  const [pred, setPred] = React.useState(null);
  const [vres, setVres] = React.useState('win');

  const go = (s) => { setModal(null); setScreen(s); };
  const complete = (p) => { setPred(p); setModal('complete'); };
  const share = () => setModal('share');
  const victory = (res = 'win') => { setVres(res); setModal('victory'); };
  const tab = screen === 'welcome' ? null : (['home', 'predict', 'rank', 'chat', 'japan'].includes(screen) ? screen : '_');

  const screens = {
    welcome: <HomeA />, home: <HomeB />, predict: <PredictScreen />,
    rank: <RankingScreen />, chat: <ChatScreen />, japan: <JapanScreen />,
    badge: <BadgeScreen />, shop: <ShopScreen />,
    onboarding: <Onboarding onDone={() => go('home')} />,
    notif: <NotifCenter />, notifset: <NotifSettings />,
    create: <CreateTournament />, invite: <InviteScreen />, join: <JoinTournament />,
    scorer: <ScorerScreen />,
  };

  return (
    <NavCtx.Provider value={{ go, complete, share, victory, tab }}>
      <div className="relative h-full w-full" style={{ background: '#0a1f4c' }}>
        {screens[screen]}
        {modal === 'complete' && <CompletionModal pred={pred} onClose={() => setModal(null)} onRank={() => go('rank')} onShare={() => setModal('share')} />}
        {modal === 'share' && <ShareOverlay onClose={() => setModal(null)} />}
        {modal === 'victory' && (
          <div className="absolute inset-0 z-50">
            <VictoryScreen result={vres} onShare={() => setModal('share')} onRank={() => go('rank')} onPredict={() => go('predict')} onClose={() => setModal(null)} />
          </div>
        )}
      </div>
    </NavCtx.Provider>
  );
}

Object.assign(window, { PrototypeApp });
