// screenshot-all.mjs — capture all 11 redesign screens at 390×844
// Usage: node screenshot-all.mjs
import { chromium } from 'playwright';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync, existsSync } from 'fs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const OUT = path.resolve(__dirname, 'redesign-screenshots');
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

// Mock tournament for screenshot purposes (no Supabase needed)
const MOCK_TOURN = {
  id: 'screenshot_mock',
  name: 'W杯予想 2026 テスト大会',
  plan: 'free',
  allowLateJoin: true,
  inviteCode: 'MOCK01',
  deadline: null,
  participants: [
    {
      id: 'me_001', nickname: 'タカシ', icon: '⚽',
      predictions: { winner: '日本', runnerUp: 'ブラジル', topScorer: '久保建英', japanResult: 'ベスト8', favoriteCountry: '日本', comment: '日本優勝！' },
      points: 48, totalMatchPoints: 48, matchPredictions: {},
      coins: { balance: 1200, transactions: [] },
      badges: ['first_prediction', 'streak_3', 'pts_10'],
      streak: { current: 3, best: 5 },
    },
    { id: 'p2', nickname: 'ケンジ', icon: '🔥', predictions: { winner: 'ブラジル', favoriteCountry: 'ブラジル' }, points: 30, totalMatchPoints: 30, coins: { balance: 1000 } },
    { id: 'p3', nickname: 'ミカ', icon: '👑', predictions: { winner: 'フランス', favoriteCountry: 'フランス' }, points: 20, totalMatchPoints: 20, coins: { balance: 900 } },
  ],
  results: null,
};
const MY_ID = 'me_001';

// ── Start Vite dev server ──────────────────────────────────────────────────
console.log('Starting Vite dev server on port 5174...');
const devServer = spawn('npx', ['vite', '--port', '5174', '--strictPort'], {
  cwd: __dirname, shell: true,
  stdio: ['ignore', 'pipe', 'pipe'],
});
devServer.on('error', e => console.error('devserver error:', e));

let serverReady = false;
await new Promise(resolve => {
  const check = (d) => {
    if (!serverReady && (d.includes('5174') || d.includes('localhost') || d.includes('ready'))) {
      serverReady = true; resolve();
    }
  };
  devServer.stdout.on('data', d => check(d.toString()));
  devServer.stderr.on('data', d => check(d.toString()));
  setTimeout(resolve, 12000);
});
await new Promise(r => setTimeout(r, 2000));
console.log('Server ready.');

// ── Playwright setup ───────────────────────────────────────────────────────
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const pg = await ctx.newPage();
pg.on('console', () => {});
pg.on('pageerror', () => {});

// Pre-set localStorage so onboarding is skipped
await pg.addInitScript(() => {
  localStorage.setItem('wcup_onboardingDone', '1');
});

await pg.goto('http://localhost:5174/', { waitUntil: 'networkidle', timeout: 20000 });
await pg.waitForTimeout(1500);

// ── Inject App state via React fiber ───────────────────────────────────────
// App's useState order (from App.jsx line 1681+):
//   0: page, 1: tourn, 2: myId, 3: adminOk, 4: selCountry, 5: onboardingDone
async function setAppState(pageName, tourn, myId) {
  const result = await pg.evaluate(({ pageName, tourn, myId }) => {
    const root = document.getElementById('root');
    const fKey = Object.keys(root).find(k => k.startsWith('__reactFiber') || k.startsWith('__reactContainer'));
    if (!fKey) return 'no-fiber-key';

    function walkFiber(fiber, depth) {
      if (!fiber || depth > 300) return null;
      if (fiber.type?.name === 'App') return fiber;
      const fromChild = walkFiber(fiber.child, depth + 1);
      if (fromChild) return fromChild;
      return walkFiber(fiber.sibling, depth + 1);
    }

    const appFiber = walkFiber(root[fKey], 0);
    if (!appFiber) return 'no-app-fiber';

    const hooks = [];
    let h = appFiber.memoizedState;
    while (h) { hooks.push(h); h = h.next; }

    if (!hooks[0]?.queue?.dispatch) return 'no-page-dispatch';
    // Dispatch all state changes (batched in React 18)
    hooks[0].queue.dispatch(pageName);
    if (hooks[1]?.queue?.dispatch) hooks[1].queue.dispatch(tourn ?? null);
    if (hooks[2]?.queue?.dispatch) hooks[2].queue.dispatch(myId ?? null);
    // Also ensure onboardingDone stays true
    if (hooks[5]?.queue?.dispatch) hooks[5].queue.dispatch(true);
    return 'ok';
  }, { pageName, tourn, myId });

  if (result !== 'ok') console.warn(`  setAppState(${pageName}) → ${result}`);
  await pg.waitForTimeout(900);
}

async function snap(name) {
  await pg.screenshot({ path: path.join(OUT, name + '.png'), fullPage: false });
  console.log(`  ✓ ${name}.png`);
}

// ── Take screenshots ──────────────────────────────────────────────────────
console.log('Taking screenshots...');

await setAppState('join',       MOCK_TOURN, null);   await snap('join');
await setAppState('predict',    MOCK_TOURN, MY_ID);  await snap('my-prediction');
await setAppState('home',       MOCK_TOURN, MY_ID);  await snap('home-b');
await setAppState('matches',    MOCK_TOURN, MY_ID);  await snap('matches');
await setAppState('ranking',    MOCK_TOURN, MY_ID);  await snap('ranking');
await setAppState('badges',     MOCK_TOURN, MY_ID);  await snap('badges');
await setAppState('japan',      MOCK_TOURN, MY_ID);  await snap('japan');
await setAppState('mypage',     MOCK_TOURN, MY_ID);  await snap('mypage');
await setAppState('bracket',    MOCK_TOURN, MY_ID);  await snap('bracket');
await setAppState('globalchat', null,       null);   await snap('global-chat');
await setAppState('tournament', MOCK_TOURN, MY_ID);  await snap('tournament');

await browser.close();
devServer.kill('SIGTERM');
console.log('\nAll done — screenshots saved to redesign-screenshots/');
