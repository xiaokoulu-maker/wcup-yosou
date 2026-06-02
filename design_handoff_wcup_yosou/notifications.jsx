// notifications.jsx — 通知：ロック画面プッシュ / お知らせセンター / 通知設定

// 通知バナー（ロック画面・センター共通の体裁）
function PushCard({ tone = 'default', emoji, title, body, time, big }) {
  const bg = tone === 'lock' ? 'rgba(255,255,255,.14)' : '#fff';
  const titleInk = tone === 'lock' ? '#fff' : '#0a1f4c';
  const bodyInk = tone === 'lock' ? 'rgba(255,255,255,.82)' : '#5B6B85';
  return (
    <div className="rounded-[20px] px-3.5 py-3" style={{ background: bg, backdropFilter: tone === 'lock' ? 'blur(16px)' : 'none', boxShadow: tone === 'lock' ? '0 6px 20px rgba(0,0,0,.25)' : '0 8px 22px rgba(4,12,33,.18)', border: big ? '1px solid rgba(244,180,0,.45)' : 'none' }}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="flex items-center justify-center shrink-0" style={{ width: 20, height: 20, borderRadius: 6, background: '#E60033' }}><Icon name="ball" size={13} className="text-white" /></span>
        <span className="text-[11px] font-extrabold tracking-wide" style={{ color: tone === 'lock' ? 'rgba(255,255,255,.9)' : '#5B6B85' }}>WCUP-YOSOU</span>
        <span className="ml-auto text-[11px] font-bold" style={{ color: tone === 'lock' ? 'rgba(255,255,255,.7)' : '#8fa3c9' }}>{time}</span>
      </div>
      <p className="font-black text-[14px] leading-snug" style={{ color: titleInk }}>{emoji} {title}</p>
      <p className="text-[12.5px] leading-snug mt-0.5" style={{ color: bodyInk }}>{body}</p>
    </div>
  );
}

// ── ロック画面プッシュ通知 ───────────────────────────────────
function LockScreen() {
  return (
    <div className="relative h-full w-full overflow-hidden" style={{ fontFamily: '"Noto Sans JP", sans-serif', background: 'linear-gradient(180deg,#061533,#0a1f4c 55%,#0d2a5e)' }}>
      {/* wallpaper glow + stars */}
      <div className="absolute pointer-events-none" style={{ top: -60, left: '50%', transform: 'translateX(-50%)', width: 320, height: 260, background: 'radial-gradient(circle,rgba(120,170,255,.22),transparent 65%)' }} />
      <div className="absolute inset-0 pointer-events-none" style={{ opacity: .6, backgroundImage: 'radial-gradient(1.5px 1.5px at 20% 16%,#fff,transparent),radial-gradient(1.2px 1.2px at 72% 12%,#dce8ff,transparent),radial-gradient(1.5px 1.5px at 44% 24%,#fff,transparent),radial-gradient(1px 1px at 86% 22%,#fff,transparent)' }} />

      <div className="relative h-full flex flex-col px-5 pt-3 pb-8" style={{ zIndex: 2 }}>
        {/* status row */}
        <div className="flex items-center justify-between text-white text-[13px] font-bold px-1">
          <span>9:41</span>
          <div className="flex items-center gap-1.5"><span style={{ opacity: .9 }}>●●●</span><span className="text-[11px]" style={{ opacity: .9 }}>5G</span><span style={{ width: 20, height: 10, border: '1.5px solid #fff', borderRadius: 3, opacity: .9, display: 'inline-block' }} /></div>
        </div>

        {/* clock */}
        <div className="text-center mt-10">
          <p className="text-white font-bold text-[15px]" style={{ opacity: .9 }}>6月15日（日）</p>
          <p className="text-white font-black tabular-nums leading-none" style={{ fontSize: 76, letterSpacing: -2, textShadow: '0 4px 24px rgba(0,0,0,.4)' }}>9:41</p>
          <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full" style={{ background: 'rgba(230,0,51,.22)', border: '1px solid rgba(255,107,134,.4)' }}>
            <Icon name="ball" size={13} className="text-white" /><span className="text-[12px] font-extrabold text-white whitespace-nowrap">日本 vs ドイツ まで 30分</span>
          </div>
        </div>

        <div className="flex-1" />

        {/* notification stack */}
        <p className="text-[11px] font-bold mb-2 ml-2" style={{ color: 'rgba(255,255,255,.6)' }}>通知センター</p>
        <div className="flex flex-col gap-2.5">
          <PushCard tone="lock" emoji="⏰" time="今" title="まもなく締切！" body="日本 vs ドイツ の予想がまだだよ。当てて +3pt、ストリークを伸ばそう。" />
          <PushCard tone="lock" emoji="🔥" time="5分前" title="6連続的中なるか？" body="今夜21:00キックオフ。久保の得点者予想も忘れずに。" />
          <PushCard tone="lock" emoji="👥" time="12分前" title="はるとが予想を変更" body="ドイツ勝ちに乗り換え。あなたの予想はそのままでいい？" />
        </div>

        {/* unlock hint */}
        <div className="flex flex-col items-center gap-2 mt-6">
          <span className="text-[12px] font-bold" style={{ color: 'rgba(255,255,255,.7)' }}>上にスワイプして予想する</span>
          <span style={{ width: 134, height: 5, borderRadius: 3, background: 'rgba(255,255,255,.6)' }} />
        </div>
      </div>
    </div>
  );
}

// ── アプリ内お知らせセンター ─────────────────────────────────
function NotifCenter() {
  const nav = React.useContext(NavCtx);
  const Row = ({ ic, col, title, sub, time, unread, hot }) => (
    <div className="flex items-start gap-3 rounded-2xl px-3.5 py-3" style={{ background: hot ? 'rgba(244,180,0,.10)' : 'rgba(255,255,255,.05)', border: hot ? '1px solid rgba(244,180,0,.3)' : '1px solid transparent' }}>
      <span className="flex items-center justify-center shrink-0 mt-0.5" style={{ width: 36, height: 36, borderRadius: 12, background: `${col}22`, color: col }}><Icon name={ic} size={19} /></span>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-[13.5px] text-white leading-snug">{title}</p>
        <p className="text-[12px] leading-snug mt-0.5" style={{ color: '#8fa3c9' }}>{sub}</p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className="text-[10.5px] font-bold whitespace-nowrap" style={{ color: '#8fa3c9' }}>{time}</span>
        {unread && <span style={{ width: 8, height: 8, borderRadius: 4, background: '#E60033' }} />}
      </div>
    </div>
  );
  return (
    <PhoneChrome dark>
      <div className="h-full flex flex-col" style={{ background: '#0a1f4c' }}>
        <ScreenHeader title="お知らせ" sub="未読 2件"
          right={<button onClick={() => nav.go('notifset')} className="flex items-center justify-center active:scale-90 transition-transform" style={{ width: 34, height: 34, borderRadius: 11, background: 'rgba(255,255,255,.08)', color: '#C9D6EC' }}><Icon name="cog" size={19} /></button>} />
        <div className="flex items-center justify-between px-5 pb-2">
          <span className="text-[11px] font-extrabold tracking-wide" style={{ color: '#8fa3c9' }}>今日</span>
          <button className="text-[11px] font-bold" style={{ color: '#F4B400' }}>すべて既読にする</button>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden px-5">
          <div className="flex flex-col gap-2">
            <Row ic="clock" col="#E60033" title="まもなく締切：日本 vs ドイツ" sub="あと30分。予想して +3pt を狙おう" time="19:30" unread />
            <Row ic="trophy" col="#F4B400" title="日本、2-1で勝利！🎉" sub="あなたの予想が的中。+5pt 獲得・新バッジ「予言者」" time="13:05" unread hot />
            <Row ic="chart" col="#2a5bd0" title="順位が変動しました" sub="さくらに抜かれて4位に。1試合で逆転できる" time="12:40" />
          </div>
          <p className="text-[11px] font-extrabold tracking-wide mt-4 mb-2" style={{ color: '#8fa3c9' }}>昨日</p>
          <div className="flex flex-col gap-2">
            <Row ic="flame" col="#F4B400" title="あと1的中で「予言者」バッジ" sub="連続的中ストリークが伸びています" time="21:12" />
            <Row ic="coin" col="#F4B400" title="デイリーボーナス +100🪙" sub="受け取り可能です。ログインを継続中" time="09:00" />
            <Row ic="chat" col="#2a5bd0" title="大会チャットに新着3件" sub="はると・さくら・ゆうき が投稿" time="08:30" />
          </div>
        </div>
      </div>
    </PhoneChrome>
  );
}

// ── 通知設定 ─────────────────────────────────────────────────
function Switch({ on, onClick }) {
  return (
    <button onClick={onClick} className="shrink-0 transition-colors" style={{ width: 46, height: 28, borderRadius: 16, background: on ? '#E60033' : 'rgba(255,255,255,.18)', padding: 3, display: 'flex', justifyContent: on ? 'flex-end' : 'flex-start' }}>
      <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.3)', transition: 'all .2s' }} />
    </button>
  );
}

function NotifSettings() {
  const [s, setS] = React.useState({ remind: true, kickoff: true, result: true, rank: true, friend: false, mention: true, daily: true, promo: false });
  const t = (k) => setS((p) => ({ ...p, [k]: !p[k] }));
  const Group = ({ label, children }) => (
    <div className="mt-4">
      <p className="text-[11px] font-extrabold tracking-wide mb-2 ml-1" style={{ color: '#8fa3c9' }}>{label}</p>
      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,.05)' }}>{children}</div>
    </div>
  );
  const Item = ({ k, title, sub, last }) => (
    <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: last ? 'none' : '1px solid rgba(255,255,255,.06)' }}>
      <div className="flex-1 min-w-0"><p className="font-bold text-[13.5px] text-white whitespace-nowrap">{title}</p><p className="text-[11.5px] mt-0.5" style={{ color: '#8fa3c9' }}>{sub}</p></div>
      <Switch on={s[k]} onClick={() => t(k)} />
    </div>
  );
  return (
    <PhoneChrome dark>
      <div className="h-full flex flex-col" style={{ background: '#0a1f4c' }}>
        <ScreenHeader title="通知設定" />
        <div className="flex-1 min-h-0 overflow-hidden px-5 pb-3">
          <div className="rounded-2xl px-4 py-3 flex items-center gap-2.5" style={{ background: 'rgba(244,180,0,.10)', border: '1px solid rgba(244,180,0,.3)' }}>
            <Icon name="bell" size={18} style={{ color: '#F4B400' }} />
            <p className="text-[12px] font-bold" style={{ color: '#F4B400' }}>通知をオンにすると、試合も締切も見逃しません ⚽</p>
          </div>
          <Group label="試合・予想">
            <Item k="remind" title="試合前リマインド" sub="締切30分前にお知らせ" />
            <Item k="kickoff" title="日本戦のキックオフ" sub="日本代表の試合開始を通知" />
            <Item k="result" title="結果速報・自動採点" sub="試合終了とポイント獲得" last />
          </Group>
          <Group label="ソーシャル">
            <Item k="rank" title="順位が変動したとき" sub="抜いた／抜かれたを通知" />
            <Item k="friend" title="友達の予想・参加" sub="フレンドの動きをお知らせ" />
            <Item k="mention" title="チャットのメンション" sub="自分宛ての投稿を通知" last />
          </Group>
          <Group label="その他">
            <Item k="daily" title="デイリーボーナス" sub="毎日のコイン受け取り" />
            <Item k="promo" title="おすすめ・お知らせ" sub="新機能やキャンペーン" last />
          </Group>
        </div>
      </div>
    </PhoneChrome>
  );
}

Object.assign(window, { LockScreen, NotifCenter, NotifSettings, Switch });
