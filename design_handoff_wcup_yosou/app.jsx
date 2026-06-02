// app.jsx — mounts the design canvas with the three priority screens.
function App() {
  return (
    <DesignCanvas>
      <DCSection id="proto" title="▶ クリックできるプロトタイプ" subtitle="タップで画面遷移 — ホーム→予想→完了演出→シェア。下のタブで移動。フォーカス表示で実機サイズに">
        <DCArtboard id="app" label="インタラクティブ・プロトタイプ（触れます）" width={390} height={884}>
          <PrototypeApp />
        </DCArtboard>
      </DCSection>

      <DCSection id="onb" title="オンボーディング — 30秒で初予想" subtitle="はじめる → 名前 → 大会 → ワンタップ予想 → 完了。経過秒数で「速さ」を演出（触れます）">
        <DCArtboard id="onbflow" label="オンボーディング（5ステップ）" width={390} height={844}>
          <Onboarding />
        </DCArtboard>
      </DCSection>

      <DCSection id="ds" title="共通デザインシステム" subtitle="Colors · Type · Buttons · Cards · Forms · Badges · Tokens — 侍ブルー基調">
        <DCArtboard id="system" label="Design System" width={1140} height={1180}>
          <DesignSystem />
        </DCArtboard>
      </DCSection>

      <DCSection id="home" title="ホーム画面" subtitle="開いた瞬間に「W杯やってる！」— 夜のスタジアム × 白カード">
        <DCArtboard id="a" label="モードA · 未参加" width={390} height={844}>
          <HomeA />
        </DCArtboard>
        <DCArtboard id="b" label="モードB · 参加済み" width={390} height={844}>
          <HomeB />
        </DCArtboard>
      </DCSection>

      <DCSection id="play" title="予想・競争" subtitle="勝敗予想 → コイン → ライブ順位">
        <DCArtboard id="predict" label="試合予想" width={390} height={844}>
          <PredictScreen />
        </DCArtboard>
        <DCArtboard id="rank" label="ランキング（3タブ）" width={390} height={844}>
          <RankingScreen />
        </DCArtboard>
        <DCArtboard id="chat" label="大会チャット" width={390} height={844}>
          <ChatScreen />
        </DCArtboard>
        <DCArtboard id="scorer" label="得点者予想（深掘り）" width={390} height={844}>
          <ScorerScreen />
        </DCArtboard>
      </DCSection>

      <DCSection id="meta" title="熱狂の仕掛け" subtitle="ゲーミフィケーション × 日本代表特化 × バイラル">
        <DCArtboard id="badge" label="マイバッジ" width={390} height={844}>
          <BadgeScreen />
        </DCArtboard>
        <DCArtboard id="japan" label="日本代表モード" width={390} height={844}>
          <JapanScreen />
        </DCArtboard>
        <DCArtboard id="shop" label="コインショップ" width={390} height={844}>
          <ShopScreen />
        </DCArtboard>
        <DCArtboard id="share" label="シェアカード（9:16）" width={360} height={640}>
          <ShareCard />
        </DCArtboard>
        <DCArtboard id="victory" label="勝利演出（日本勝利）" width={390} height={844}>
          <VictoryScreen result="win" />
        </DCArtboard>
        <DCArtboard id="draw" label="結果演出（引き分け）" width={390} height={844}>
          <VictoryScreen result="draw" />
        </DCArtboard>
        <DCArtboard id="lose" label="結果演出（敗戦）" width={390} height={844}>
          <VictoryScreen result="lose" />
        </DCArtboard>
      </DCSection>

      <DCSection id="notif" title="通知・リマインド" subtitle="試合を見逃させない — ロック画面プッシュ × お知らせセンター × 通知設定">
        <DCArtboard id="lock" label="ロック画面プッシュ通知" width={390} height={844}>
          <LockScreen />
        </DCArtboard>
        <DCArtboard id="center" label="お知らせセンター" width={390} height={844}>
          <NotifCenter />
        </DCArtboard>
        <DCArtboard id="nset" label="通知設定" width={390} height={844}>
          <NotifSettings />
        </DCArtboard>
      </DCSection>

      <DCSection id="tourn" title="大会作成・招待" subtitle="作る → 招待コード/QR/LINE で友達を集める → 参加">
        <DCArtboard id="create" label="大会を作る" width={390} height={844}>
          <CreateTournament />
        </DCArtboard>
        <DCArtboard id="invite" label="招待・シェア" width={390} height={844}>
          <InviteScreen />
        </DCArtboard>
        <DCArtboard id="join" label="コードで参加" width={390} height={844}>
          <JoinTournament />
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
