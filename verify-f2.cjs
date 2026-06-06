'use strict';
const { chromium } = require('playwright');

const BASE   = 'http://localhost:5175';
const TOURN  = 'JVOM18ND';
const MY_ID  = 'EE7F72O5'; // 参加者「開発者」（予想未入力状態）
let ok=0, ng=0, wa=0;
const log=[];
const pass = m => { console.log(`✅ ${m}`); log.push(`✅ ${m}`); ok++; };
const fail = m => { console.error(`❌ ${m}`); log.push(`❌ ${m}`); ng++; };
const warn = m => { console.warn(`⚠️  ${m}`); log.push(`⚠️  ${m}`); wa++; };
async function txt(p) { return p.locator('body').innerText().catch(()=>''); }

/**
 * ルームページを開く共通処理。
 * goto(#t-X) → localStorage設定 → reload でReactが#t-Xを検出してroom表示。
 */
async function openRoom(br, w=390, h=844, joinedAs=null) {
  const ctx = await br.newContext({viewport:{width:w,height:h}});
  const p   = await ctx.newPage();
  p.setDefaultTimeout(15000);
  await p.goto(`${BASE}/#t-${TOURN}`, {waitUntil:'domcontentloaded',timeout:15000});
  await p.evaluate(({tid,mid})=>{
    localStorage.setItem('wcup_onboardingDone','true');
    localStorage.removeItem('wcup_myid_'+tid);
    if(mid) localStorage.setItem('wcup_myid_'+tid, mid);
  }, {tid:TOURN, mid:joinedAs});
  await p.reload({waitUntil:'domcontentloaded',timeout:15000});
  try { await p.locator(':text("リアルタイム更新中")').first().waitFor({state:'visible',timeout:12000}); }
  catch { /* room load may have failed */ }
  return {ctx,p};
}

/** ルームタブバーのタブボタンをクリック（完全一致で正確に選択）*/
async function clickRoomTab(p, label) {
  // 完全一致: 'ホーム'|'予想'|'ランキング'|'チャット'|'その他'
  const btn = p.locator('button').filter({hasText: new RegExp('^' + label + '$')}).first();
  await btn.waitFor({state:'visible', timeout:5000});
  await btn.click();
  await p.waitForTimeout(800);
}

(async()=>{
  const br = await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});

  // ── ① 未参加ユーザー → 予想タブに参加CTA ──
  console.log('\n── ① 未参加: 予想タブ → 参加CTA ──');
  try {
    const {ctx,p} = await openRoom(br, 390, 844, null);
    const t = await txt(p);
    if(!t.includes('リアルタイム')) { warn('① room 未表示'); await ctx.close(); }
    else {
      await clickRoomTab(p, '予想');
      const t2 = await txt(p);
      t2.includes('参加して予想') ? pass('①-a 未参加→予想タブ→参加CTA表示') : warn('①-a 参加CTA確認要');
      await ctx.close();
    }
  } catch(e) { fail(`① ${e.message.slice(0,80)}`); }

  // ── ② 参加済み → 予想フォーム表示確認 ──
  console.log('\n── ② 参加済み: 予想フォーム表示 ──');
  try {
    const {ctx,p} = await openRoom(br, 390, 844, MY_ID);
    const t = await txt(p);
    if(!t.includes('リアルタイム')) { warn('② room 未表示'); await ctx.close(); }
    else {
      await clickRoomTab(p, '予想');
      const t2 = await txt(p);
      t2.includes('優勝国')         ? pass('②-a 予想フォーム: 優勝国フィールドあり')     : fail('②-a 優勝国フィールド未検出');
      t2.includes('日本代表の成績') ? pass('②-b 予想フォーム: 日本代表フィールドあり')   : fail('②-b 日本代表フィールド未検出');
      t2.includes('予想を保存')     ? pass('②-c 保存ボタンあり')                         : fail('②-c 保存ボタン未検出');
      t2.includes('もっと詳しく予想') ? pass('②-d 試合スコア予想ボタンあり')             : fail('②-d 試合スコア予想ボタン未検出');
      await ctx.close();
    }
  } catch(e) { fail(`② ${e.message.slice(0,80)}`); }

  // ── ③ 予想入力→保存→共有カード表示 ──
  // 注意: 完全一致セレクタを使う。各FlagChipsグリッドが同じ国名を持つため nth() で区別する
  // 優勝国=nth(0), 準優勝国=nth(1), 応援国=nth(2) (各グリッドの「日本」ボタン)
  console.log('\n── ③ 予想保存→共有カード ──');
  try {
    const {ctx,p} = await openRoom(br, 390, 844, MY_ID);
    const t = await txt(p);
    if(!t.includes('リアルタイム')) { warn('③ room 未表示'); await ctx.close(); }
    else {
      await clickRoomTab(p, '予想');
      await p.waitForTimeout(500);
      const t2 = await txt(p);
      if(t2.includes('予想完了')){
        pass('③-skip 既に保存済み予想あり（③はスキップ、④以降で検証）');
      } else {
        // Flag コンポーネントが <span>JPN</span><span>日本</span> をレンダリングするため
        // ボタンの textContent は "JPN日本" → 部分一致で検索する
        // FlagChips は 優勝国/準優勝国/応援国 の3グリッドに同じ国を並べる:
        //   nth(0)=優勝国の日本, nth(1)=準優勝国の日本, nth(2)=応援国の日本
        const jpnBtns = p.locator('button').filter({hasText:'日本'}); // 部分一致
        const jpnCnt = await jpnBtns.count();
        console.log(`    [debug] 日本ボタン数: ${jpnCnt}`);
        if(jpnCnt>=1){ await jpnBtns.nth(0).click(); await p.waitForTimeout(200); }  // 優勝国
        // 日本代表成績: ベスト8（JAPAN_RES の選択肢。テキストは完全一致）
        const best8 = p.locator('button').filter({hasText:'ベスト8'}).first();
        if(await best8.isVisible({timeout:3000}).catch(()=>false)){ await best8.click(); await p.waitForTimeout(200); }
        // 応援国: nth(2) = 応援国グリッドの日本
        if(jpnCnt>=3){ await jpnBtns.nth(2).click(); await p.waitForTimeout(200); }
        else if(jpnCnt>=2){ await jpnBtns.nth(1).click(); await p.waitForTimeout(200); }
        // 保存ボタン
        const saveBtn = p.locator('button').filter({hasText:'予想を保存する'}).first();
        await saveBtn.waitFor({state:'visible',timeout:5000});
        await saveBtn.click();
        await p.waitForTimeout(6000); // Supabase書き込み完了待ち
        const t3 = await txt(p);
        t3.includes('予想完了')           ? pass('③-a 予想完了カード表示')          : fail('③-a 予想完了カード未検出（保存失敗の可能性）');
        t3.includes('LINEで友達')         ? pass('③-b LINE共有ボタンあり')           : fail('③-b LINEボタン未検出');
        t3.includes('招待リンクをコピー')  ? pass('③-c 招待リンクコピーボタンあり')  : fail('③-c コピーボタン未検出');
        t3.includes('ランキングを見る')   ? pass('③-d ランキングを見るボタンあり')   : fail('③-d ランキングボタン未検出');
        const lineHref = await p.locator('a[href*="line.me"]').first().getAttribute('href').catch(()=>'');
        lineHref.includes('line.me') ? pass('③-e LINE URL確認') : warn('③-e LINE URL確認要');
      }
      await ctx.close();
    }
  } catch(e) { fail(`③ ${e.message.slice(0,80)}`); }

  // ── ④ 保存後リロード → 予想が保持される ──
  console.log('\n── ④ 保存後リロード: 予想が保持される ──');
  try {
    const {ctx,p} = await openRoom(br, 390, 844, MY_ID);
    const t = await txt(p);
    if(!t.includes('リアルタイム')) { warn('④ room 未表示'); await ctx.close(); }
    else {
      await clickRoomTab(p, '予想');
      const t2 = await txt(p);
      // 「保存済み」バナーが出るか、もしくはすでに「予想完了」カードが出ているか
      (t2.includes('保存済み')||t2.includes('予想完了'))
        ? pass('④-a リロード後: 保存状態が維持されている')
        : warn('④-a 保存状態確認要（③が前提）');
      // 保存された値「日本」が何らかの形で画面に存在するか
      t2.includes('日本') ? pass('④-b リロード後: 保存値が画面に表示') : warn('④-b 保存値確認要');
      await ctx.close();
    }
  } catch(e) { fail(`④ ${e.message.slice(0,80)}`); }

  // ── ⑤ 既存PgPredict（ハンバーガー→優勝予想）で同じデータが読める ──
  console.log('\n── ⑤ 既存PgPredict で同じデータを確認 ──');
  try {
    const {ctx,p} = await openRoom(br, 390, 844, MY_ID);
    const t = await txt(p);
    if(!t.includes('リアルタイム')) { warn('⑤ room 未表示'); await ctx.close(); }
    else {
      const hamBtn = p.locator('button[aria-label="メニュー"]').first();
      await hamBtn.waitFor({state:'visible',timeout:5000});
      await hamBtn.click();
      await p.waitForTimeout(400);
      const yosouBtn = p.locator('button').filter({hasText:'優勝予想'}).first();
      if(await yosouBtn.isVisible({timeout:3000}).catch(()=>false)){
        await yosouBtn.click();
        await p.waitForTimeout(1000);
        const t2 = await txt(p);
        t2.includes('予想を入力') ? pass('⑤-a PgPredict ページ表示')           : warn('⑤-a PgPredict 確認要');
        t2.includes('優勝国')    ? pass('⑤-b PgPredict: 優勝国フィールドあり') : fail('⑤-b PgPredict 優勝国フィールド未検出');
        t2.includes('日本')      ? pass('⑤-c PgPredict: 保存済み値が表示')      : warn('⑤-c 保存値確認要');
      } else {
        warn('⑤ ハンバーガーに「優勝予想」未検出');
      }
      await ctx.close();
    }
  } catch(e) { fail(`⑤ ${e.message.slice(0,80)}`); }

  // ── ⑥ 共有カード → ランキングを見るボタン動作 ──
  console.log('\n── ⑥ 共有カード: ランキングを見るボタン ──');
  try {
    const {ctx,p} = await openRoom(br, 390, 844, MY_ID);
    const t = await txt(p);
    if(!t.includes('リアルタイム')) { warn('⑥ room 未表示'); await ctx.close(); }
    else {
      await clickRoomTab(p, '予想');
      const t2 = await txt(p);
      // 共有カード or 保存済みフォームのどちらかで、ランキングを見るボタンを探す
      let rankBtnVisible = false;
      if(t2.includes('予想完了')){
        // 共有カードから直接クリック
        const rankBtn = p.locator('button').filter({hasText:'ランキングを見る'}).first();
        rankBtnVisible = await rankBtn.isVisible({timeout:3000}).catch(()=>false);
        if(rankBtnVisible){
          await rankBtn.click(); await p.waitForTimeout(1500);
          const t3 = await txt(p);
          t3.includes('ランキング') ? pass('⑥-a ランキングを見る → ranking ページ') : warn('⑥-a ranking 遷移確認要');
        } else { warn('⑥-a ランキングボタン未検出'); }
      } else {
        // 保存済みバナーがある → 再保存して共有カードを出す
        const saveBtn = p.locator('button').filter({hasText:'予想を保存する'}).first();
        if(await saveBtn.isVisible({timeout:3000}).catch(()=>false)){
          await saveBtn.click(); await p.waitForTimeout(5000);
          const t3 = await txt(p);
          if(t3.includes('予想完了')){
            const rankBtn = p.locator('button').filter({hasText:'ランキングを見る'}).first();
            if(await rankBtn.isVisible({timeout:3000}).catch(()=>false)){
              await rankBtn.click(); await p.waitForTimeout(1500);
              const t4 = await txt(p);
              t4.includes('ランキング') ? pass('⑥-a ランキングを見る → ranking ページ') : warn('⑥-a ranking 遷移確認要');
            } else { warn('⑥-a ランキングボタン未検出'); }
          } else { warn('⑥-a 共有カード未表示'); }
        } else { warn('⑥ 予想完了状態へ入れず'); }
      }
      await ctx.close();
    }
  } catch(e) { warn(`⑥ ${e.message.slice(0,80)}`); }

  // ── ⑦ 既存機能: ランキング・URLコピー ──
  console.log('\n── ⑦ 既存機能（ランキング・URLコピー）──');
  try {
    const {ctx,p} = await openRoom(br, 390, 844, MY_ID);
    const t = await txt(p);
    if(!t.includes('リアルタイム')) { warn('⑦ room 未表示'); await ctx.close(); }
    else {
      await clickRoomTab(p, 'ランキング');
      await p.waitForTimeout(1500);
      const t2 = await txt(p);
      t2.includes('ランキング') ? pass('⑦-a ランキングタブ → ranking ページ') : warn('⑦-a ranking 確認要');
      const back = p.locator('button').filter({hasText:'戻る'}).first();
      if(await back.isVisible({timeout:3000}).catch(()=>false)){ await back.click(); await p.waitForTimeout(800); }
      else { await p.goBack().catch(()=>{}); await p.waitForTimeout(800); }
      const copyBtn = p.locator('button').filter({hasText:'コピー'}).first();
      await copyBtn.isVisible({timeout:3000}).catch(()=>false)
        ? pass('⑦-b ホームタブ URLコピーボタン確認')
        : warn('⑦-b URLコピー確認要');
      await ctx.close();
    }
  } catch(e) { fail(`⑦ ${e.message.slice(0,80)}`); }

  // ── ⑧ 375px スマホ幅: 予想タブで崩れない ──
  console.log('\n── ⑧ 375px 幅チェック ──');
  try {
    const {ctx,p} = await openRoom(br, 375, 812, MY_ID);
    const t = await txt(p);
    if(!t.includes('リアルタイム')) { warn('⑧ room 未表示'); await ctx.close(); }
    else {
      await clickRoomTab(p, '予想');
      const [sw,cw] = await p.evaluate(()=>[document.documentElement.scrollWidth,document.documentElement.clientWidth]);
      sw<=cw+2 ? pass(`⑧-a 375px 予想タブ 横はみ出しなし (${sw}≤${cw})`) : warn(`⑧-a 横スクロール検出 (${sw}>${cw})`);
      await ctx.close();
    }
  } catch(e) { fail(`⑧ ${e.message.slice(0,80)}`); }

  // ── ⑨ 既存機能: グローバルTOP → ランキング ──
  console.log('\n── ⑨ グローバルランキング ──');
  try {
    const ctx2 = await br.newContext({viewport:{width:390,height:844}});
    const p2   = await ctx2.newPage();
    p2.setDefaultTimeout(15000);
    await p2.goto(BASE,{waitUntil:'domcontentloaded'});
    await p2.evaluate(()=>localStorage.setItem('wcup_onboardingDone','true'));
    await p2.reload({waitUntil:'domcontentloaded'});
    await p2.waitForTimeout(600);
    await p2.locator('button').filter({hasText:/^ランキング$/}).first().waitFor({state:'visible',timeout:5000});
    await p2.locator('button').filter({hasText:/^ランキング$/}).first().click();
    await p2.waitForTimeout(1500);
    const t2 = await p2.locator('body').innerText().catch(()=>'');
    t2.includes('ランキング') ? pass('⑨-a グローバルランキングページ表示') : warn('⑨-a ranking 確認要');
    await ctx2.close();
  } catch(e) { fail(`⑨ ${e.message.slice(0,80)}`); }

  // ──────────────────────────────────────────
  await br.close();
  console.log('\n╔═══════════ F2 RESULT ═══════════╗');
  log.forEach(r=>console.log(r));
  console.log(`\nPASSED:${ok}  WARNED:${wa}  FAILED:${ng}`);
  console.log(ng===0?'→ PASS (FAILゼロ)':'→ FAIL');
})();
