// One-shot screenshot script — run after `npm run build`
// Usage: node screenshot-redesign.mjs
import { chromium } from 'playwright';
import { createServer } from 'http';
import { createReadStream, existsSync, readFileSync } from 'fs';
import { resolve, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const DIST = resolve(__dirname, 'dist');
const OUT  = resolve(__dirname, 'redesign-screenshots');
const PORT = 5174;

const MIME = {
  '.html':'text/html', '.css':'text/css', '.js':'application/javascript',
  '.png':'image/png',  '.svg':'image/svg+xml', '.json':'application/json',
  '.woff2':'font/woff2', '.woff':'font/woff',
};

// Minimal static file server for dist/
const server = createServer((req, res) => {
  const path = req.url.split('?')[0];
  const file = resolve(DIST, path.replace(/^\//, ''));
  if (existsSync(file) && !file.endsWith(DIST)) {
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
    createReadStream(file).pipe(res);
  } else {
    const idx = resolve(DIST, 'index.html');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    createReadStream(idx).pipe(res);
  }
});

await new Promise(r => server.listen(PORT, r));
console.log(`Static server on http://localhost:${PORT}`);

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();

// Suppress console noise from the app
page.on('console', () => {});
page.on('pageerror', () => {});

await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
await page.waitForTimeout(1200);

// ── inject minimal mock state so badges/mypage render content ──
// Build fake tournament + participant and store in React state via fiber walk
await page.evaluate(() => {
  // Find App's setState by walking the React fiber tree from root
  function getFibers(el) {
    const key = Object.keys(el).find(k => k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance'));
    return key ? el[key] : null;
  }
  function findStateSetter(fiber, componentName) {
    let f = fiber;
    while (f) {
      if (f.type && f.type.name === componentName) return f;
      f = f.child || f.sibling || (f.return && f.return.sibling);
    }
    return null;
  }

  const root = document.getElementById('root');
  const fiber = getFibers(root);
  // Walk fibers looking for App
  const results = [];
  function walk(f, depth) {
    if (!f || depth > 60) return;
    if (f.memoizedState && f.type && (f.type.name === 'App' || f.type === 'App')) results.push(f);
    walk(f.child, depth + 1);
    if (depth < 30) walk(f.sibling, depth + 1);
  }
  if (fiber) walk(fiber, 0);
  window._appFiberFound = results.length;
});

// Rather than injecting real state (complex), render mock HTML pages using just the compiled CSS

// Find the built CSS file
const distFiles = readFileSync(resolve(DIST, 'index.html'), 'utf8');
const cssMatch = distFiles.match(/\/assets\/index-[^"]+\.css/);
const cssPath = cssMatch ? cssMatch[0] : '/assets/index.css';

// ── badges mock page ──
const badgesHtml = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<link rel="stylesheet" href="${cssPath}"/>
<style>*{box-sizing:border-box}body{margin:0;display:flex;justify-content:center}</style>
</head>
<body>
<div class="screen">
  <!-- page header -->
  <div class="phead">
    <div class="b">←</div>
    <div class="t">
      <div class="s">MY BADGES</div>
      <h1>🏅 マイ・バッジ</h1>
    </div>
    <div class="r"></div>
  </div>

  <!-- progress card -->
  <div class="wrap section tight">
    <div class="card lg">
      <div class="bprog">
        <div class="ring" style="background:conic-gradient(var(--gold) 0deg 90deg,rgba(255,255,255,.07) 90deg 360deg)">
          <span>3</span>
        </div>
        <div>
          <div class="t">3 / 12 獲得</div>
          <div class="s">バッジを集めて全国TOPプレイヤーへ</div>
        </div>
      </div>
    </div>
  </div>

  <!-- earned section -->
  <div class="wrap section">
    <div class="sechead">
      <h2 class="gold">獲得済み (3)</h2>
    </div>
    <div class="badge-grid">
      <div class="bcell got">
        <div class="bi"><span style="font-size:20px">🎯</span></div>
        <div class="bn">予想デビュー</div>
      </div>
      <div class="bcell got">
        <div class="bi"><span style="font-size:20px">🔥</span></div>
        <div class="bn">連続的中×3</div>
      </div>
      <div class="bcell got">
        <div class="bi"><span style="font-size:20px">⚡</span></div>
        <div class="bn">10pt 達成</div>
      </div>
    </div>
  </div>

  <!-- near section -->
  <div class="wrap section">
    <div class="sechead">
      <h2>あと一歩 (2)</h2>
    </div>
    <div class="badge-grid">
      <div class="bcell near">
        <div class="bi"><span style="font-size:20px">🏆</span></div>
        <div class="bn">予想マスター</div>
        <div class="bp">4/5</div>
      </div>
      <div class="bcell near">
        <div class="bi"><span style="font-size:20px">💎</span></div>
        <div class="bn">50pt 達成</div>
        <div class="bp">38/50</div>
      </div>
    </div>
  </div>

  <!-- full list section -->
  <div class="wrap section">
    <div class="sechead">
      <h2>バッジ一覧</h2>
    </div>
    <div class="card">
      <div class="blist-row got">
        <div class="bi"><span style="font-size:18px">🎯</span></div>
        <div class="mid">
          <div class="bn">予想デビュー</div>
          <div class="bd">最初の試合予想を登録する</div>
        </div>
        <span class="chk">✓</span>
      </div>
      <div class="blist-row got">
        <div class="bi"><span style="font-size:18px">🔥</span></div>
        <div class="mid">
          <div class="bn">連続的中×3</div>
          <div class="bd">3試合連続的中</div>
        </div>
        <span class="chk">✓</span>
      </div>
      <div class="blist-row" style="opacity:0.6">
        <div class="bi"><span style="font-size:18px">🏆</span></div>
        <div class="mid">
          <div class="bn">予想マスター</div>
          <div class="bd">5試合以上予想する</div>
          <div style="margin-top:6px">
            <div style="background:rgba(255,255,255,.08);border-radius:4px;height:4px;overflow:hidden">
              <div style="background:var(--red);height:100%;border-radius:4px;width:80%"></div>
            </div>
            <div style="font-family:'Roboto Mono',monospace;font-size:10px;color:var(--dim);margin-top:3px">4 / 5</div>
          </div>
        </div>
        <span style="font-family:Roboto Mono;font-size:10.5px;color:var(--dim);font-weight:700">4/5</span>
      </div>
    </div>
  </div>
</div>
</body></html>`;

const mypageHtml = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<link rel="stylesheet" href="${cssPath}"/>
<style>*{box-sizing:border-box}body{margin:0;display:flex;justify-content:center}</style>
</head>
<body>
<div class="screen">
  <!-- page header -->
  <div class="phead">
    <div class="b">←</div>
    <div class="t">
      <div class="s">PROFILE</div>
      <h1>👤 マイページ</h1>
    </div>
    <div class="r"></div>
  </div>

  <!-- profile card -->
  <div class="wrap section tight">
    <div class="card lg">
      <div class="profile">
        <div class="av">⚽</div>
        <div>
          <div class="nm">タカシ</div>
          <button class="edit">✏️ プロフィールを編集</button>
        </div>
      </div>
    </div>
  </div>

  <!-- stats grid -->
  <div class="wrap section">
    <div class="grid2">
      <div class="stat">
        <div class="lbl">累計ポイント</div>
        <div class="num gold">48<span class="u">pt</span></div>
      </div>
      <div class="stat">
        <div class="lbl">的中率</div>
        <div class="num">67%</div>
        <div class="sub">4/6 試合</div>
      </div>
      <div class="stat">
        <div class="lbl">連続的中</div>
        <div class="num red">3<span class="u">連続</span></div>
        <div class="sub">自己ベスト 5</div>
      </div>
      <div class="stat">
        <div class="lbl">大会内順位</div>
        <div class="num">2位</div>
        <div class="sub">/ 8人中</div>
      </div>
    </div>
  </div>

  <!-- tournament section -->
  <div class="wrap section">
    <div class="sechead">
      <h2>参加中の大会</h2>
    </div>
    <div class="rowcard">
      <div class="ico" style="color:#fff;background:linear-gradient(160deg,#ff4147,#c41420);border:none">W</div>
      <div class="tx">
        <div class="t">みんなで W杯予想2026</div>
        <div class="s">2位 · 8人中 · 48pt</div>
      </div>
      <div class="end" style="color:#ff6066">開く</div>
    </div>
  </div>

  <!-- recent preds section -->
  <div class="wrap section">
    <div class="sechead">
      <h2>最近の予想</h2>
    </div>
    <div class="card">
      <div class="pred-row">
        <div class="mid">
          <div class="mt">日本 vs ドイツ</div>
          <div class="pk"><span class="ar">→</span> 日本 勝ち</div>
          <div class="dt">6/11(木) 21:00</div>
        </div>
        <div class="st" style="color:#37d67a;border-color:rgba(55,214,122,.3);background:rgba(55,214,122,.06)">+3pt 的中</div>
      </div>
      <div class="pred-row">
        <div class="mid">
          <div class="mt">フランス vs ブラジル</div>
          <div class="pk"><span class="ar">→</span> 引き分け</div>
          <div class="dt">6/12(金) 03:00</div>
        </div>
        <div class="st">未確定</div>
      </div>
      <div class="pred-row">
        <div class="mid">
          <div class="mt">スペイン vs アルゼンチン</div>
          <div class="pk"><span class="ar">→</span> スペイン 勝ち</div>
          <div class="dt">6/10(水) 21:00</div>
        </div>
        <div class="st">0pt 外れ</div>
      </div>
    </div>
  </div>

  <!-- other section -->
  <div class="wrap section">
    <div class="sechead">
      <h2>その他</h2>
    </div>
    <div class="grid3">
      <div class="feat"><div class="fi">🛒</div><div class="ft">コインショップ</div></div>
      <div class="feat"><div class="fi">🏅</div><div class="ft">バッジ</div></div>
      <div class="feat"><div class="fi">🌍</div><div class="ft">全国ランキング</div></div>
    </div>
  </div>
</div>
</body></html>`;

// Write temp HTML files into dist then screenshot them
import { writeFileSync } from 'fs';
writeFileSync(resolve(DIST, '_badges_mock.html'), badgesHtml);
writeFileSync(resolve(DIST, '_mypage_mock.html'), mypageHtml);

async function shot(path, outFile) {
  await page.goto(`http://localhost:${PORT}/${path}`, { waitUntil: 'networkidle', timeout: 10000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: resolve(OUT, outFile), fullPage: false });
  console.log(`  ✓ ${outFile}`);
}

console.log('Taking screenshots...');
await shot('_badges_mock.html', 'badges.png');
await shot('_mypage_mock.html', 'mypage.png');

await browser.close();
server.close();
console.log('Done.');
