// screenshot-awards.mjs — capture awards compare feature at 390x844
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
      id: 'me_001', nickname: 'タカシ', icon: '⚽', points: 48, totalMatchPoints: 48,
      matchPredictions: {},
      predictions: {
        winner: 'ブラジル', runnerUp: 'フランス', topScorer: 'エムバペ',
        japanResult: 'ベスト8', favoriteCountry: 'ブラジル',
        assistKing: 'エムバペ', tournamentMvp: 'エムバペ', japanMvp: '久保建英',
        comment: 'エムバペが全部獲る！',
      },
      coins: { balance: 1200, transactions: [] }, badges: [], streak: {},
    },
    {
      id: 'p2', nickname: 'ケンジ', icon: '🔥', points: 30, totalMatchPoints: 30,
      matchPredictions: {},
      predictions: {
        winner: 'フランス', runnerUp: 'ブラジル', topScorer: 'エムバペ',
        japanResult: 'グループ敗退', favoriteCountry: 'フランス',
        assistKing: 'エムバペ', tournamentMvp: 'エムバペ', japanMvp: '鎌田大地',
      },
      coins: { balance: 1000 }, badges: [], streak: {},
    },
    {
      id: 'p3', nickname: 'ミカ', icon: '👑', points: 20, totalMatchPoints: 20,
      matchPredictions: {},
      predictions: {
        winner: 'アルゼンチン', runnerUp: 'フランス', topScorer: 'メッシ',
        japanResult: 'ベスト16', favoriteCountry: 'アルゼンチン',
        assistKing: 'メッシ', tournamentMvp: 'メッシ', japanMvp: '三笘薫',
      },
      coins: { balance: 900 }, badges: [], streak: {},
    },
    {
      id: 'p4', nickname: 'ユウ', icon: '🌟', points: 15, totalMatchPoints: 15,
      matchPredictions: {},
      predictions: {
        winner: 'ドイツ', runnerUp: 'アルゼンチン', topScorer: 'エムバペ',
        japanResult: 'ベスト8', favoriteCountry: 'ドイツ',
        assistKing: 'エムバペ', tournamentMvp: 'エムバペ', japanMvp: '久保建英',
      },
      coins: { balance: 800 }, badges: [], streak: {},
    },
  ],
  results: null,
};

// Empty awards tournament — no one has non-winner predictions
const MOCK_TOURN_EMPTY_AWARDS = {
  ...MOCK_TOURN,
  participants: [
    {
      id: 'me_001', nickname: 'タカシ', icon: '⚽', points: 0, totalMatchPoints: 0,
      matchPredictions: {},
      predictions: { winner: 'ブラジル', favoriteCountry: 'ブラジル' },
      coins: { balance: 1000 }, badges: [], streak: {},
    },
    {
      id: 'p2', nickname: 'ケンジ', icon: '🔥', points: 0, totalMatchPoints: 0,
      matchPredictions: {},
      predictions: { winner: 'フランス', favoriteCountry: 'フランス' },
      coins: { balance: 900 }, badges: [], streak: {},
    },
  ],
};

const MY_ID = 'me_001';

// ── Start Vite dev server ────────────────────────────────────────────────
console.log('Starting Vite dev server on port 5176...');
const devServer = spawn('npx', ['vite', '--port', '5176', '--strictPort'], {
  cwd: __dirname, shell: true,
  stdio: ['ignore', 'pipe', 'pipe'],
});
devServer.on('error', e => console.error('devserver error:', e));

await new Promise(resolve => {
  const check = (d) => {
    if (d.includes('5176') || d.includes('localhost') || d.includes('ready')) resolve();
  };
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
await pg.goto('http://localhost:5176/', { waitUntil: 'networkidle', timeout: 25000 });
await pg.waitForTimeout(2000);

// App hook order: 0=page, 1=showLandingOverride, 2=tourn, 3=myId, 4=adminOk, 5=selCountry, 6=onboardingDone
async function setAppState(pageName, tourn, myId) {
  const result = await pg.evaluate(({ pageName, tourn, myId }) => {
    const root = document.getElementById('root');
    const fKey = Object.keys(root).find(k => k.startsWith('__reactFiber') || k.startsWith('__reactContainer'));
    if (!fKey) return 'no-fiber-key';
    function walkFiber(fiber, depth) {
      if (!fiber || depth > 300) return null;
      if (fiber.type?.name === 'App') return fiber;
      return walkFiber(fiber.child, depth+1) || walkFiber(fiber.sibling, depth+1);
    }
    const appFiber = walkFiber(root[fKey], 0);
    if (!appFiber) return 'no-app-fiber';
    const hooks = [];
    let h = appFiber.memoizedState;
    while (h) { hooks.push(h); h = h.next; }
    if (!hooks[0]?.queue?.dispatch) return 'no-dispatch';
    hooks[0].queue.dispatch(pageName);
    if (hooks[2]?.queue?.dispatch) hooks[2].queue.dispatch(tourn ?? null);
    if (hooks[3]?.queue?.dispatch) hooks[3].queue.dispatch(myId ?? null);
    if (hooks[1]?.queue?.dispatch) hooks[1].queue.dispatch(false);
    if (hooks[6]?.queue?.dispatch) hooks[6].queue.dispatch(true);
    return 'ok';
  }, { pageName, tourn, myId });
  if (result !== 'ok') console.warn(`setAppState(${pageName}) → ${result}`);
  await pg.waitForTimeout(1300);
}

// Walk to PgPredictions fiber and dispatch view/selCat state
async function setPredictionsState(view, selCat) {
  await pg.evaluate(({ view, selCat }) => {
    const root = document.getElementById('root');
    const fKey = Object.keys(root).find(k => k.startsWith('__reactFiber') || k.startsWith('__reactContainer'));
    if (!fKey) return;
    function walkFiber(fiber, depth) {
      if (!fiber || depth > 400) return null;
      if (fiber.type?.name === 'PgPredictions') return fiber;
      return walkFiber(fiber.child, depth+1) || walkFiber(fiber.sibling, depth+1);
    }
    const f = walkFiber(root[fKey], 0);
    if (!f) return;
    const hooks = [];
    let h = f.memoizedState;
    while (h) { hooks.push(h); h = h.next; }
    // hooks[0] = view state, hooks[1] = selCat state
    if (hooks[0]?.queue?.dispatch) hooks[0].queue.dispatch(view);
    if (hooks[1]?.queue?.dispatch && selCat) hooks[1].queue.dispatch(selCat);
  }, { view, selCat });
  await pg.waitForTimeout(900);
}

async function snap(name) {
  await pg.screenshot({ path: path.join(OUT, name + '.png'), fullPage: false });
  console.log(`  ✓ ${name}.png`);
}

console.log('Taking awards screenshots...');

// awards_01: 一覧ビューで参加者カードに個人賞チップが出ている
await setAppState('predictions', MOCK_TOURN, MY_ID);
await snap('awards_01_participant_chips');

// awards_02: 比較ビュー・大会MVP カテゴリで本命強調
await setPredictionsState('compare', 'tournamentMvp');
await snap('awards_02_compare_category');

// awards_03: 比較ビュー・空（誰も予想していない）
await setAppState('predictions', MOCK_TOURN_EMPTY_AWARDS, MY_ID);
await setPredictionsState('compare', 'assistKing');
await snap('awards_03_compare_empty');

await browser.close();
devServer.kill('SIGTERM');
console.log('\nAll done — awards screenshots saved to redesign-screenshots/');
