// screenshot-bawards.mjs — capture awards collapsible card in PgPredict at 390x844
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
  plan: 'free',
  allowLateJoin: true,
  inviteCode: 'MOCK01',
  deadline: null,
  predictionSettings: {
    winner:true, runnerUp:true, topScorer:true, japanResult:true,
    japanMvp:true, assistKing:true, tournamentMvp:true, best4:false, japanFirstMatchScore:false
  },
  participants: [
    {
      id: 'me_001', nickname: 'タカシ', icon: '⚽', points: 0, totalMatchPoints: 0,
      matchPredictions: {},
      predictions: { winner:'', runnerUp:'', topScorer:'', assistKing:'', tournamentMvp:'', japanMvp:'', japanResult:'', favoriteCountry:'', comment:'' },
      coins: { balance: 1000, transactions: [] }, badges: [], streak: {},
    },
  ],
  results: null,
};

const MY_ID = 'me_001';

// ── Start dev server ────────────────────────────────────────────────────
console.log('Starting Vite dev server on port 5177...');
const devServer = spawn('npx', ['vite', '--port', '5177', '--strictPort'], {
  cwd: __dirname, shell: true, stdio: ['ignore', 'pipe', 'pipe'],
});
devServer.on('error', e => console.error('devserver error:', e));

await new Promise(resolve => {
  const check = d => { if (d.includes('5177') || d.includes('ready')) resolve(); };
  devServer.stdout.on('data', d => check(d.toString()));
  devServer.stderr.on('data', d => check(d.toString()));
  setTimeout(resolve, 14000);
});
await new Promise(r => setTimeout(r, 2000));
console.log('Server ready.');

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const pg = await ctx.newPage();
pg.on('console', () => {});
pg.on('pageerror', () => {});

await pg.addInitScript(() => { localStorage.setItem('wcup_onboardingDone', '1'); });
await pg.goto('http://localhost:5177/', { waitUntil: 'networkidle', timeout: 25000 });
await pg.waitForTimeout(2000);

// App hooks: 0=page,1=showLandingOverride,2=tourn,3=myId,4=adminOk,5=selCountry,6=onboardingDone
async function setAppState(pageName, tourn, myId) {
  const r = await pg.evaluate(({ pageName, tourn, myId }) => {
    const root = document.getElementById('root');
    const fKey = Object.keys(root).find(k => k.startsWith('__reactFiber') || k.startsWith('__reactContainer'));
    if (!fKey) return 'no-fiber';
    function walk(f, d) {
      if (!f || d > 300) return null;
      if (f.type?.name === 'App') return f;
      return walk(f.child, d+1) || walk(f.sibling, d+1);
    }
    const app = walk(root[fKey], 0);
    if (!app) return 'no-app';
    const hooks = []; let h = app.memoizedState;
    while (h) { hooks.push(h); h = h.next; }
    if (!hooks[0]?.queue?.dispatch) return 'no-dispatch';
    hooks[0].queue.dispatch(pageName);
    if (hooks[2]?.queue?.dispatch) hooks[2].queue.dispatch(tourn ?? null);
    if (hooks[3]?.queue?.dispatch) hooks[3].queue.dispatch(myId ?? null);
    if (hooks[1]?.queue?.dispatch) hooks[1].queue.dispatch(false);
    if (hooks[6]?.queue?.dispatch) hooks[6].queue.dispatch(true);
    return 'ok';
  }, { pageName, tourn, myId });
  if (r !== 'ok') console.warn(`setAppState(${pageName}) → ${r}`);
  await pg.waitForTimeout(1400);
}

// Walk PgPredict fiber and set awardsOpen state (hook index 3 = awardsOpen)
async function setAwardsOpen(open) {
  await pg.evaluate((open) => {
    const root = document.getElementById('root');
    const fKey = Object.keys(root).find(k => k.startsWith('__reactFiber') || k.startsWith('__reactContainer'));
    if (!fKey) return;
    function walk(f, d) {
      if (!f || d > 400) return null;
      if (f.type?.name === 'PgPredict') return f;
      return walk(f.child, d+1) || walk(f.sibling, d+1);
    }
    const f = walk(root[fKey], 0);
    if (!f) { console.warn('PgPredict not found'); return; }
    const hooks = []; let h = f.memoizedState;
    while (h) { hooks.push(h); h = h.next; }
    // pred=0, err=1, loading=2, saved=3, awardsOpen=4, (set is not a hook)
    // Let's find awardsOpen by looking for boolean false hook
    for (let i = 0; i < hooks.length; i++) {
      if (typeof hooks[i]?.memoizedState === 'boolean' && hooks[i]?.queue?.dispatch) {
        hooks[i].queue.dispatch(open);
        break;
      }
    }
  }, open);
  await pg.waitForTimeout(900);
}

// Set pred state with some filled award values to trigger summary view
async function setPredWithAwards() {
  await pg.evaluate(() => {
    const root = document.getElementById('root');
    const fKey = Object.keys(root).find(k => k.startsWith('__reactFiber') || k.startsWith('__reactContainer'));
    if (!fKey) return;
    function walk(f, d) {
      if (!f || d > 400) return null;
      if (f.type?.name === 'PgPredict') return f;
      return walk(f.child, d+1) || walk(f.sibling, d+1);
    }
    const f = walk(root[fKey], 0);
    if (!f) return;
    const hooks = []; let h = f.memoizedState;
    while (h) { hooks.push(h); h = h.next; }
    // hooks[0] is pred state (object)
    if (hooks[0]?.queue?.dispatch) {
      hooks[0].queue.dispatch({
        winner:'ブラジル', runnerUp:'フランス',
        topScorer:'エムバペ', assistKing:'エムバペ', tournamentMvp:'エムバペ', japanMvp:'久保建英',
        japanResult:'ベスト8', favoriteCountry:'ブラジル', comment:'エムバペが全部獲る！'
      });
    }
  });
  await pg.waitForTimeout(900);
}

async function snap(name) {
  await pg.screenshot({ path: path.join(OUT, name + '.png'), fullPage: false });
  console.log(`  ✓ ${name}.png`);
}

console.log('Taking PgPredict awards screenshots...');

// bawards_01: collapsed state (default, no awards filled)
await setAppState('predict', MOCK_TOURN, MY_ID);
await snap('bawards_01_collapsed');

// bawards_02: expanded state
await setAwardsOpen(true);
await snap('bawards_02_expanded');

// bawards_03: summary state (awards filled, awardsOpen=false)
await setAppState('predict', MOCK_TOURN, MY_ID);
await setPredWithAwards();
await snap('bawards_03_summary');

await browser.close();
devServer.kill('SIGTERM');
console.log('\nAll done — bawards screenshots saved to redesign-screenshots/');
