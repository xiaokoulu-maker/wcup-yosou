// screenshot-bawards2.mjs — awards collapsible card in PgPredict, proper scroll
import { chromium } from 'playwright';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync, existsSync } from 'fs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const OUT = path.resolve(__dirname, 'redesign-screenshots');
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

// Gachi preset: all award categories enabled
const MOCK_TOURN = {
  id: 'screenshot_mock',
  name: 'W杯予想 2026 テスト大会',
  plan: 'free', allowLateJoin: true, inviteCode: 'MOCK01', deadline: null,
  predictionSettings: {
    winner:true, runnerUp:true, topScorer:true, japanResult:true,
    japanMvp:true, assistKing:true, tournamentMvp:true, best4:false, japanFirstMatchScore:false
  },
  participants: [{
    id: 'me_001', nickname: 'タカシ', icon: '⚽', points: 0, totalMatchPoints: 0,
    matchPredictions: {},
    predictions: { winner:'', runnerUp:'', topScorer:'', assistKing:'', tournamentMvp:'', japanMvp:'', japanResult:'', favoriteCountry:'', comment:'' },
    coins: { balance: 1000, transactions: [] }, badges: [], streak: {},
  }],
  results: null,
};
const MY_ID = 'me_001';

// ── Dev server ──────────────────────────────────────────────────────────
console.log('Starting Vite dev server on port 5178...');
const devServer = spawn('npx', ['vite', '--port', '5178', '--strictPort'], {
  cwd: __dirname, shell: true, stdio: ['ignore', 'pipe', 'pipe'],
});
devServer.on('error', e => { console.error('devserver error:', e); process.exit(1); });

await new Promise(resolve => {
  const check = d => { if (d.includes('5178') || d.includes('ready') || d.includes('localhost')) resolve(); };
  devServer.stdout.on('data', d => check(d.toString()));
  devServer.stderr.on('data', d => check(d.toString()));
  setTimeout(resolve, 15000);
});
await new Promise(r => setTimeout(r, 2500));
console.log('Server ready.');

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const pg = await ctx.newPage();
pg.on('console', () => {});
pg.on('pageerror', () => {});

await pg.addInitScript(() => { localStorage.setItem('wcup_onboardingDone', '1'); });
await pg.goto('http://localhost:5178/', { waitUntil: 'networkidle', timeout: 30000 });
await pg.waitForTimeout(2500);

// App hooks: 0=page,1=showLandingOverride,2=tourn,3=myId,4=adminOk,5=selCountry,6=onboardingDone
async function setAppState(pageName, tourn, myId) {
  const r = await pg.evaluate(({ pageName, tourn, myId }) => {
    const root = document.getElementById('root');
    const fKey = Object.keys(root).find(k => k.startsWith('__reactFiber') || k.startsWith('__reactContainer'));
    if (!fKey) return 'no-fiber';
    function walk(f, d) { if (!f || d > 300) return null; if (f.type?.name === 'App') return f; return walk(f.child, d+1) || walk(f.sibling, d+1); }
    const app = walk(root[fKey], 0);
    if (!app) return 'no-app';
    const hooks = []; let h = app.memoizedState; while (h) { hooks.push(h); h = h.next; }
    if (!hooks[0]?.queue?.dispatch) return 'no-dispatch';
    hooks[0].queue.dispatch(pageName);
    if (hooks[2]?.queue?.dispatch) hooks[2].queue.dispatch(tourn ?? null);
    if (hooks[3]?.queue?.dispatch) hooks[3].queue.dispatch(myId ?? null);
    if (hooks[1]?.queue?.dispatch) hooks[1].queue.dispatch(false);
    if (hooks[6]?.queue?.dispatch) hooks[6].queue.dispatch(true);
    return 'ok';
  }, { pageName, tourn, myId });
  if (r !== 'ok') console.warn(`  setAppState(${pageName}) → ${r}`);
  await pg.waitForTimeout(1500);
}

// Scroll so the awards card heading is visible at the top of viewport
async function scrollToAwardsCard() {
  await pg.evaluate(() => {
    // Try .screen container first (overflow-y scroll), then window
    const screen = document.querySelector('.screen');
    if (screen && screen.scrollHeight > screen.clientHeight) {
      screen.scrollTop = screen.scrollHeight;
    } else {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' });
    }
  });
  await pg.waitForTimeout(400);
}

async function snap(name) {
  await pg.screenshot({ path: path.join(OUT, name + '.png'), fullPage: false });
  console.log(`  ✓ ${name}.png`);
}

// ── SHOT 1: collapsed (default) ─────────────────────────────────────────
console.log('Taking awards screenshots...');
await setAppState('predict', MOCK_TOURN, MY_ID);
await scrollToAwardsCard();
// Verify the awards card text is present
const hasCard = await pg.locator('text=個人賞・スタッツ予想').count();
console.log(`  awards card visible: ${hasCard}`);
await snap('bawards_01_collapsed');

// ── SHOT 2: expanded — click the open button ────────────────────────────
// Click "＋ 個人賞も予想する"
try {
  const openBtn = pg.locator('button').filter({ hasText: /個人賞も予想する/ }).first();
  await openBtn.waitFor({ state: 'visible', timeout: 5000 });
  await openBtn.click({ force: true });
  await pg.waitForTimeout(700);
  await scrollToAwardsCard();
  await snap('bawards_02_expanded');
} catch(e) {
  console.warn('  Could not click open button:', e.message);
  await snap('bawards_02_expanded_fallback');
}

// ── SHOT 3: summary — fill awards then close ────────────────────────────
// Fill assistKing (first tinput in the awards card)
try {
  const inputs = pg.locator('input.tinput');
  const cnt = await inputs.count();
  console.log(`  tinput count: ${cnt}`);
  if (cnt > 0) await inputs.nth(0).fill('エムバペ');
  if (cnt > 1) await inputs.nth(1).fill('エムバペ');
  if (cnt > 2) await inputs.nth(2).fill('久保建英');
  await pg.waitForTimeout(400);
  // Click "入力を閉じる"
  const closeBtn = pg.locator('button').filter({ hasText: /入力を閉じる/ }).first();
  await closeBtn.waitFor({ state: 'visible', timeout: 4000 });
  await closeBtn.click({ force: true });
  await pg.waitForTimeout(700);
  await scrollToAwardsCard();
  await snap('bawards_03_summary');
} catch(e) {
  console.warn('  Could not complete summary flow:', e.message);
  await snap('bawards_03_summary_fallback');
}

await browser.close();
devServer.kill('SIGTERM');
// Ensure process exits even if devServer teardown hangs on Windows
setTimeout(() => process.exit(0), 2000);
console.log('\nAll done — bawards screenshots saved to redesign-screenshots/');
