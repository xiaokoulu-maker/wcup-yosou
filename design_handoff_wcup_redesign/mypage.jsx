// mypage.jsx — マイページ
const RECENT = [
  { m: "アメリカ vs ボリビア", pk: "ボリビア 勝ち", dt: "6/25(水) 19:00" },
  { m: "アメリカ vs パナマ", pk: "引き分け", dt: "6/18(水) 19:00" },
  { m: "ウルグアイ vs ボリビア", pk: "ボリビア 勝ち", dt: "6/18(水) 19:00" },
  { m: "ウルグアイ vs アメリカ", pk: "ウルグアイ 勝ち", dt: "6/11(水) 19:00" },
  { m: "パナマ vs ボリビア", pk: "引き分け", dt: "6/11(水) 19:00" },
];

function MyPageApp() {
  const [toastNode, toast] = useToast();
  return (
    <div className="screen">
      <PageHead back="home.html" title="マイページ" icon="person" />

      <div className="wrap section tight">
        <div className="card lg">
          <div className="profile">
            <div className="av">あ</div>
            <div>
              <div className="nm">あ</div>
              <div className="edit" onClick={() => toast("プロフィール編集")}><Icon name="edit" size={13} /> プロフィールを編集</div>
            </div>
          </div>
        </div>
      </div>

      <div className="wrap section">
        <div className="grid2">
          <Stat icon="coin" label="累計ポイント" value="0" unit="pt" color="gold" />
          <Stat icon="target" label="的中率" value="—" />
          <Stat icon="flame" label="連続的中" value="0" unit="連続" color="red" sub="自己ベスト 0" />
          <Stat icon="chart" label="大会内順位" value="1" unit="/ 1人" />
        </div>
      </div>

      <div className="wrap section">
        <SectionHead title="参加中の大会" />
        <a className="rowcard" href="home.html">
          <div className="ico" style={{ color: "#fff", background: "linear-gradient(160deg,#ff4147,#c41420)", border: "none" }}>あ</div>
          <div className="tx"><div className="t">あ</div><div className="s">1位 ・ 1人中 ・ 0pt</div></div>
          <div className="end" style={{ color: "#ff6066" }}>開く</div>
          <Icon name="chevron" size={17} stroke={2} style={{ color: "var(--faint)" }} />
        </a>
      </div>

      <div className="wrap section">
        <SectionHead title="最近の予想" action="すべて見る" onAction={() => toast("予想履歴")} />
        <div className="card">
          {RECENT.map((r, i) => (
            <div className="pred-row" key={i}>
              <Icon name="whistle" size={18} style={{ color: "var(--faint)", flex: "none" }} />
              <div className="mid">
                <div className="mt">{r.m}</div>
                <div className="pk"><span className="ar"><Icon name="arrowRight" size={13} stroke={2.4} /></span>{r.pk}</div>
                <div className="dt">{r.dt}</div>
              </div>
              <div className="st">未確定</div>
            </div>
          ))}
        </div>
      </div>

      <div className="wrap section">
        <SectionHead title="その他" />
        <div className="grid3">
          <div className="feat" onClick={() => toast("コインショップ")}><div className="fi"><Icon name="shop" size={20} /></div><div className="ft">コインショップ</div></div>
          <a className="feat" href="badges.html"><div className="fi"><Icon name="medal" size={20} /></div><div className="ft">バッジ</div></a>
          <a className="feat" href="ranking.html"><div className="fi"><Icon name="globe" size={20} /></div><div className="ft">全国ランキング</div></a>
        </div>
      </div>

      {toastNode}
    </div>
  );
}
ReactDOM.createRoot(document.getElementById("root")).render(<MyPageApp />);
