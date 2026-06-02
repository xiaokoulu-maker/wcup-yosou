// screenshot-mom.mjs — capture MoM prediction feature states at 390x844
// Usage: node screenshot-mom.mjs
import { chromium } from 'playwright';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync, existsSync } from 'fs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const OUT = path.resolve(__dirname, 'redesign-screenshots');
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

// Match with near-future kickoff so it shows as "scheduled"
const futureKO = new Date(Date.now() + 6 * 3600 * 1000).toISOString();
const futureKO2 = new Date(Date.now() + 10 * 3600 * 1000).toISOString();

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
      predictions: { winner: '日本', runnerUp: 'ブラジル' },
      points: 48, totalMatchPoints: 48,
      matchPredictions: {
        'gA-1': { pick: 'home', homeScore: null, awayScore: null, points: null },
      },
      coins: { balance: 1200, transactions: [] },
      badges: ['first_prediction'],
      streak: { current: 3, best: 5 },
    },
    {
      id: 'p2', nickname: 'ケンジ', icon: '🔥',
      predictions: { winner: 'ブラジル' }, points: 30, totalMatchPoints: 30,
      matchPredictions: {
        'gA-1': { pick: 'home', mom: 'エムバペ' },
        'gA-2': { pick: 'away', mom: 'エムバペ' },
      },
      coins: { balance: 1000 },
    },
    {
      id: 'p3', nickname: 'ミカ', icon: '👑',
      predictions: { winner: 'フランス' }, points: 20, totalMatchPoints: 20,
      matchPredictions: {
        'gA-1': { pick: 'draw', mom: '久保建英' },
        'gA-2': { pick: 'home', mom: 'エムバペ' },
      },
      coins: { balance: 900 },
    },
    {
      id: 'p4', nickname: 'ユウ', icon: '🌟',
      predictions: { winner: 'ドイツ' }, points: 15, totalMatchPoints: 15,
      matchPredictions: {
        'gA-1': { pick: 'home', mom: '久保建英' },
        'gA-2': { pick: 'home', mom: 'ムシアラ' },
      },
      coins: { balance: 800 },
    },
  ],
  results: null,
};

// Version with MoM already saved for "me"
const MOCK_TOURN_WITH_MOM = {
  ...MOCK_TOURN,
  participants: MOCK_TOURN.participants.map(p =>
    p.id === 'me_001'
      ? { ...p, matchPredictions: { ...p.matchPredictions, 'gA-1': { pick: 'home', mom: 'エムバペ' } } }
      : p
  ),
};

const MY_ID = 'me_001';

// Override MATCHES to inject our fake match with correct IDs & future kickoff
// We'll inject via page script
const FAKE_MATCHES_PATCH = `
  // Patch: inject fake matches at the start of MATCHES array
  window.__FAKE_MATCHES_PATCH__ = true;
`;

// ── Start Vite dev server ──────────────────────────────────────────────────
console.log('Starting Vite dev server on port 5175...');
const devServer = spawn('npx', ['vite', '--port', '5175', '--strictPort'], {
  cwd: __dirname, shell: true,
  stdio: ['ignore', 'pipe', 'pipe'],
});
devServer.on('error', e => console.error('devserver error:', e));

let serverReady = false;
await new Promise(resolve => {
  const check = (d) => {
    if (!serverReady && (d.includes('5175') || d.includes('localhost') || d.includes('ready'))) {
      serverReady = true; resolve();
    }
  };
  devServer.stdout.on('data', d => check(d.toString()));
  devServer.stderr.on('data', d => check(d.toString()));
  setTimeout(resolve, 14000);
});
await new Promise(r => setTimeout(r, 2000));
console.log('Server ready.');

// ── Playwright setup ───────────────────────────────────────────────────────
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const pg = await ctx.newPage();
pg.on('console', () => {});
pg.on('pageerror', () => {});

await pg.addInitScript(() => {
  localStorage.setItem('wcup_onboardingDone', '1');
});

await pg.goto('http://localhost:5175/', { waitUntil: 'networkidle', timeout: 25000 });
await pg.waitForTimeout(2000);

async function setAppState(pageName, tourn, myId) {
  // App hook order (current App.jsx):
  //   0: page, 1: showLandingOverride, 2: tourn, 3: myId, 4: adminOk, 5: selCountry, 6: onboardingDone
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
    hooks[0].queue.dispatch(pageName);          // page
    if (hooks[2]?.queue?.dispatch) hooks[2].queue.dispatch(tourn ?? null);  // tourn
    if (hooks[3]?.queue?.dispatch) hooks[3].queue.dispatch(myId ?? null);   // myId
    if (hooks[1]?.queue?.dispatch) hooks[1].queue.dispatch(false);          // showLandingOverride → hide
    if (hooks[6]?.queue?.dispatch) hooks[6].queue.dispatch(true);           // onboardingDone
    return 'ok';
  }, { pageName, tourn, myId });
  if (result !== 'ok') console.warn(`  setAppState(${pageName}) → ${result}`);
  await pg.waitForTimeout(1200);
}

async function snap(name) {
  await pg.screenshot({ path: path.join(OUT, name + '.png'), fullPage: false });
  console.log(`  ✓ ${name}.png`);
}

// ── Walk PgMatches fiber to find + dispatch showMomModal ──────────────────
async function openMomModalInPage(matchId) {
  await pg.evaluate((matchId) => {
    const root = document.getElementById('root');
    const fKey = Object.keys(root).find(k => k.startsWith('__reactFiber') || k.startsWith('__reactContainer'));
    if (!fKey) return;
    function walkFiber(fiber, depth) {
      if (!fiber || depth > 400) return null;
      if (fiber.type?.name === 'PgMatches') return fiber;
      const fromChild = walkFiber(fiber.child, depth + 1);
      if (fromChild) return fromChild;
      return walkFiber(fiber.sibling, depth + 1);
    }
    const f = walkFiber(root[fKey], 0);
    if (!f) { console.warn('PgMatches fiber not found'); return; }
    const hooks = [];
    let h = f.memoizedState;
    while (h) { hooks.push(h); h = h.next; }
    // showMomModal is at index 9 (after tab,savingId,expandedId,showDoneModal,sharingMatch,postingCard,cardPosted,saveErr,earnedBadgesM,betInput,submittingBet,showCoinDisclaimer,pendingDone,showMomModal...)
    // Find the hook that corresponds to showMomModal (null state)
    for (let i = 0; i < hooks.length; i++) {
      if (hooks[i]?.memoizedState === null && hooks[i]?.queue?.dispatch) {
        // Try to find the right one - showMomModal starts at null
        // We'll dispatch matchId to the first null-state hook after index 13
        if (i >= 13) {
          hooks[i].queue.dispatch(matchId);
          break;
        }
      }
    }
  }, matchId);
  await pg.waitForTimeout(800);
}

console.log('Taking MoM screenshots...');

// Screenshot 1: matches page showing MoM button (未予想)
await setAppState('matches', MOCK_TOURN, MY_ID);
await snap('mom_01_matches_card_unpredicted');

// Screenshot 2: matches page showing MoM button (予想済み - with mom)
await setAppState('matches', MOCK_TOURN_WITH_MOM, MY_ID);
await snap('mom_02_matches_card_predicted');

// Screenshot 3: Input modal - click first MoM予想 button
await setAppState('matches', MOCK_TOURN, MY_ID);
await pg.waitForTimeout(1000);
try {
  // Scroll down a bit so match cards load, then find MoM button
  await pg.evaluate(() => window.scrollTo(0, 200));
  await pg.waitForTimeout(500);
  const momBtn = pg.locator('button', { hasText: 'MoM予想' }).first();
  await momBtn.waitFor({ state: 'visible', timeout: 6000 });
  await momBtn.scrollIntoViewIfNeeded();
  await momBtn.click({ timeout: 3000 });
  await pg.waitForTimeout(1000);
  await snap('mom_03_input_modal');
} catch(e) {
  console.warn('  Could not click MoM button via locator:', e.message);
  await snap('mom_03_input_modal_fallback');
}

// Screenshot 4: Input modal with text typed
try {
  const input = pg.locator('input.tinput').first();
  await input.waitFor({ state: 'visible', timeout: 3000 });
  await input.fill('エムバペ');
  await pg.waitForTimeout(500);
  await snap('mom_04_input_modal_filled');
} catch(e) {
  console.warn('  Could not fill input:', e.message);
  await snap('mom_04_input_modal_filled_fallback');
}

// Screenshot 5: Distribution view — set MOCK_TOURN_WITH_MOM, click ✓ MoM button
await pg.keyboard.press('Escape');
await pg.waitForTimeout(600);
await setAppState('matches', MOCK_TOURN_WITH_MOM, MY_ID);
await pg.waitForTimeout(1000);
try {
  await pg.evaluate(() => window.scrollTo(0, 200));
  await pg.waitForTimeout(400);
  const momBtn2 = pg.locator('button').filter({ hasText: /✓/ }).first();
  await momBtn2.waitFor({ state: 'visible', timeout: 6000 });
  await momBtn2.scrollIntoViewIfNeeded();
  await momBtn2.click({ force: true, timeout: 3000 });
  await pg.waitForTimeout(1000);
  await snap('mom_05_distribution_modal');
} catch(e) {
  console.warn('  Could not click confirmed MoM button:', e.message);
  await snap('mom_05_distribution_modal_fallback');
}

await browser.close();
devServer.kill('SIGTERM');
console.log('\nAll done — MoM screenshots saved to redesign-screenshots/');
