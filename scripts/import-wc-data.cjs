#!/usr/bin/env node
/**
 * W杯2026 スカッドデータ取り込みスクリプト
 *
 * 使い方:
 *   1. プロジェクトルートに .env を作成（.env.example を参照）
 *   2. pdftotext をインストール（poppler-utils）
 *      - macOS:   brew install poppler
 *      - Ubuntu:  apt-get install poppler-utils
 *      - Windows: https://github.com/oschwartz10612/poppler-windows/releases
 *   3. node scripts/import-wc-data.js
 *      --dry-run    DB には書き込まず JSON 生成のみ
 *      --skip-download  PDF の再ダウンロードをスキップ
 */
'use strict';

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

// ─── 設定 ────────────────────────────────────────────────────────────────────
const CONFIG = {
  pdfUrl:    'https://fdp.fifa.org/assetspublic/ce281/pdf/SquadLists-English.pdf',
  pdfPath:   path.join(__dirname, 'squad-lists.pdf'),
  txtPath:   path.join(__dirname, 'squad-lists.txt'),
  publicDir: path.join(__dirname, '..', 'public', 'data'),
  dataDir:   path.join(__dirname, '..', 'data'),
  sourceUrl:  'https://fdp.fifa.org/assetspublic/ce281/pdf/SquadLists-English.pdf',
  sourceName: 'FIFA Official Squad List PDF',
  minTeams:   48,
  minPlayersPerTeam: 23,
  maxPlayersPerTeam: 26,
};

// ─── 引数 ────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const DRY_RUN       = args.includes('--dry-run');
const SKIP_DOWNLOAD = args.includes('--skip-download');

// ─── ログ ────────────────────────────────────────────────────────────────────
const LOG = { info: [], warn: [], error: [] };
function info(msg) { console.log('ℹ️  ' + msg); LOG.info.push(msg); }
function warn(msg) { console.warn('⚠️  ' + msg); LOG.warn.push(msg); }
function err(msg)  { console.error('❌  ' + msg); LOG.error.push(msg); }

// ─── ユーティリティ ──────────────────────────────────────────────────────────
function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, res => {
      if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode}`)); return; }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', reject);
  });
}

function parseDate(ddmmyyyy) {
  if (!ddmmyyyy) return null;
  const m = ddmmyyyy.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const d = new Date(`${m[3]}-${m[2]}-${m[1]}`);
  return isNaN(d.getTime()) ? null : `${m[3]}-${m[2]}-${m[1]}`;
}

function calcAge(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// ─── PDF パーサー ─────────────────────────────────────────────────────────────
const SKIP_PREFIXES = [
  'CLUB ', 'DOB ', 'LAST NAME', 'NAME ON SHIRT', 'HEIGHT',
  'NATIONALITY', 'FIRST NAME', 'FIFA World', '11 June', '19 July',
  'DOB Date', 'POS Position', 'MF Mid', 'FW Forward', 'DF Defender',
  'GK Goal', 'Saturday,', 'Sunday,', 'Monday,', 'Tuesday,', 'Wednesday,',
  'Thursday,', 'Friday,', '#', 'Head coach',
];

function parsePage(rawPage, pageNum) {
  const lines = rawPage.split('\n').map(l => l.trim()).filter(l => l);

  // ── 1. チーム名 / FIFA コード（Unicode 対応） ─────────────────────────────
  let teamName = null, fifaCode = null;
  for (const line of lines) {
    if (SKIP_PREFIXES.some(p => line.startsWith(p))) continue;
    // "Team Name (ABC)" - Unicode 対応 (Côte, Türkiye, Curaçao, USA etc.)
    const m = line.match(/^(.+?)\s+\(([A-Z]{3})\)(?:\s+.*)?$/);
    if (m && m[2].length === 3) {
      // CLUB 行の単一クラブ名がヒットしないよう、CLUB 行の先頭はすでに SKIP_PREFIXES で除外済み
      // 追加ガード: m[1] が純粋な国名 (短すぎない、数字がない)
      const candidate = m[1].trim();
      if (candidate.length >= 2 && !/\d/.test(candidate)) {
        teamName = candidate;
        fifaCode = m[2];
        break;
      }
    }
  }
  if (!fifaCode) {
    warn(`P${pageNum}: FIFA コードを検出できませんでした`);
    return null;
  }

  // ── 2. 選手行を抽出（Layout A: 個別行 / Layout B: 名前なし） ───────────────
  const players = [];
  let i = 0;
  while (i < lines.length && players.length < 26) {
    const l = lines[i];

    // Pattern C: "10 FW TROSSARD Leandro" - 番号+POS+名前が同一行 (Belgium, USA 等)
    const allOne = l.match(/^(\d{1,2})\s+(GK|DF|MF|FW)\s+(.+)$/);
    if (allOne) {
      const num = parseInt(allOne[1], 10);
      if (num >= 1 && num <= 26) {
        players.push({ num, pos: allOne[2], name: allOne[3].trim() });
        i++; continue;
      }
    }

    if (/^\d{1,2}$/.test(l)) {
      const num = parseInt(l, 10);
      if (num >= 1 && num <= 26) {
        const n1 = lines[i + 1] || '';
        const n2 = lines[i + 2] || '';
        // Pattern A: POS + 名前 が同一行 ("GK COURTOIS Thibaut")
        const posName = n1.match(/^(GK|DF|MF|FW)\s+(.+)$/);
        if (posName) {
          players.push({ num, pos: posName[1], name: posName[2].trim() });
          i += 2; continue;
        }
        // Pattern B: POS が単独行、次行が名前かどうか判定
        if (/^(GK|DF|MF|FW)$/.test(n1)) {
          const isPlayerName = n2 &&
            !/^\d{1,2}$/.test(n2) &&
            !/^(GK|DF|MF|FW)$/.test(n2) &&
            !SKIP_PREFIXES.some(p => n2.startsWith(p)) &&
            !/^(SQUAD|ROLE|COACH|PLAYER NAME|PLAYER$)/.test(n2);
          if (isPlayerName) {
            players.push({ num, pos: n1, name: n2 });
            i += 3; continue;
          }
          // Layout B (Japan 等): 名前なし
          players.push({ num, pos: n1, name: null });
          i += 2; continue;
        }
      }
    }
    i++;
  }

  // ── 3. Layout B の名前を "PLAYER NAME ..." 行から補完 ──────────────────────
  if (players.some(p => p.name === null)) {
    const pnLine = lines.find(l => /^PLAYER NAME\s+\S/.test(l));
    if (pnLine) {
      const namesStr = pnLine.replace(/^PLAYER NAME\s+/, '');
      const names = splitPlayerNames(namesStr, players.length);
      let ni = 0;
      for (const p of players) {
        if (p.name === null && ni < names.length) {
          p.name = names[ni++];
        } else if (p.name !== null) {
          ni++;
        }
      }
    }
  }

  // ── 4. DOB（生年月日） ────────────────────────────────────────────────────
  const dobLine = lines.find(l => l.startsWith('DOB ') && !l.includes('Date of birth'));
  const dobs = dobLine
    ? (dobLine.replace(/^DOB\s+/, '').match(/\d{2}\/\d{2}\/\d{4}/g) || [])
    : [];

  // ── 5. CLUB ───────────────────────────────────────────────────────────────
  const clubLine = lines.find(l => l.startsWith('CLUB '));
  const clubs = clubLine
    ? clubLine.replace(/^CLUB\s+/, '').split(/(?<=\([A-Z]{2,3}\))\s+/).map(s => s.trim()).filter(s => s)
    : [];

  // ── 6. HEIGHT ─────────────────────────────────────────────────────────────
  const htLine = lines.find(l => l.startsWith('HEIGHT (CM)'));
  const heights = htLine
    ? (htLine.replace(/^HEIGHT \(CM\)\s*/, '').match(/\d{2,3}/g) || []).map(Number)
    : [];

  // ── 7. 監督名 ─────────────────────────────────────────────────────────────
  // 形式: "LASTNAME Firstname" (例: MORIYASU Hajime, SCALONI Lionel)
  // "PLAYER NAME SUZUKI..." のような複合行は除外
  let headCoach = null;
  const hcIdx = lines.indexOf('Head coach');
  if (hcIdx >= 0) {
    for (let j = hcIdx + 1; j <= hcIdx + 6; j++) {
      const lj = lines[j] || '';
      // ALLCAPS LASTNAME + mixed-case FIRSTNAME パターン
      if (/^[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ'Š-]+\s+[A-Z][a-z]/.test(lj) &&
          !lj.startsWith('PLAYER NAME') &&
          !lj.startsWith('LAST NAME') &&
          !lj.startsWith('FIRST NAME') &&
          !['ROLE', 'COACH NAME', 'SQUAD LIST'].includes(lj)) {
        headCoach = lj; break;
      }
    }
  }

  // ── 8. 検証 ───────────────────────────────────────────────────────────────
  const pc = players.length;
  if (pc < CONFIG.minPlayersPerTeam || pc > CONFIG.maxPlayersPerTeam) {
    err(`${fifaCode}: 選手数 ${pc}（期待: ${CONFIG.minPlayersPerTeam}–${CONFIG.maxPlayersPerTeam}）`);
  }
  if (dobs.length > 0 && dobs.length !== pc) {
    warn(`${fifaCode}: DOB数 ${dobs.length} ≠ 選手数 ${pc}`);
  }

  return { teamName, fifaCode, headCoach, players, dobs, clubs, heights };
}

// 連続した UPPERCASE トークン → 姓、mixed case トークン → 名のヒューリスティック分割
function splitPlayerNames(str, expectedCount) {
  const tokens = str.split(/\s+/).filter(t => t);
  const names = [];
  let cur = [];
  let inFirst = false;

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    // ALLCAPS または ハイフン区切り ALLCAPS (AIT-NOURI など)
    const isUpper = /^[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖÙÚÛÜÝÞ''-]+$/.test(tok);

    if (!inFirst) {
      // 姓パート
      cur.push(tok);
      if (isUpper) continue; // 次も姓かもしれない
      // mixed case → 名の開始
      inFirst = true;
    } else {
      // 名パート: 次が ALLCAPS なら新プレーヤーの始まり
      if (isUpper && i + 1 < tokens.length && !/^[a-z]/.test(tokens[i + 1] || '')) {
        // 新プレーヤー
        names.push(cur.join(' '));
        cur = [tok];
        inFirst = false;
      } else {
        cur.push(tok);
      }
    }
  }
  if (cur.length > 0) names.push(cur.join(' '));
  return names;
}

// ─── メイン処理 ──────────────────────────────────────────────────────────────
async function main() {
  const importedAt = new Date().toISOString();
  info(`=== W杯2026 スカッドデータ取り込み開始 ${importedAt} ===`);
  if (DRY_RUN) info('DRY-RUN モード: DB への書き込みを行いません');

  // ── ステップ 1: PDF ダウンロード ──────────────────────────────────────────
  if (!SKIP_DOWNLOAD || !fs.existsSync(CONFIG.pdfPath)) {
    info(`PDF ダウンロード中: ${CONFIG.pdfUrl}`);
    try {
      await download(CONFIG.pdfUrl, CONFIG.pdfPath);
      const stat = fs.statSync(CONFIG.pdfPath);
      info(`PDF ダウンロード完了: ${(stat.size / 1024).toFixed(0)} KB`);
    } catch (e) {
      err(`PDF ダウンロード失敗: ${e.message}`);
      process.exit(1);
    }
  } else {
    info('PDF ダウンロードスキップ');
  }

  // ── ステップ 2: pdftotext ─────────────────────────────────────────────────
  info('PDF → テキスト変換中...');
  const pdftotextResult = spawnSync('pdftotext', ['-enc', 'UTF-8', CONFIG.pdfPath, CONFIG.txtPath], {
    encoding: 'utf8',
  });
  if (pdftotextResult.error || pdftotextResult.status !== 0) {
    err(`pdftotext 失敗: ${pdftotextResult.error?.message || pdftotextResult.stderr}`);
    err('pdftotext がインストールされていない場合: brew install poppler (Mac) / apt install poppler-utils (Linux)');
    process.exit(1);
  }
  const pdfText = fs.readFileSync(CONFIG.txtPath, 'utf8');
  const pages = pdfText.split('\x0c').filter(p => p.trim());
  info(`PDF ページ数: ${pages.length}`);

  // ── ステップ 3: パース ────────────────────────────────────────────────────
  info('スカッドデータ解析中...');
  const teams = [];
  pages.forEach((page, idx) => {
    const r = parsePage(page, idx + 1);
    if (r) teams.push(r);
  });

  // ── ステップ 4: 検証 ──────────────────────────────────────────────────────
  info(`\n=== 検証結果 ===`);
  if (teams.length < CONFIG.minTeams) {
    err(`チーム数 ${teams.length} < 最低 ${CONFIG.minTeams}（取り込み中断）`);
    saveLog(importedAt); process.exit(1);
  }
  info(`✅ チーム数: ${teams.length} / ${CONFIG.minTeams}`);

  let totalPlayers = 0;
  const badTeams = [];
  teams.forEach(t => {
    totalPlayers += t.players.length;
    if (t.players.length < CONFIG.minPlayersPerTeam || t.players.length > CONFIG.maxPlayersPerTeam) {
      badTeams.push(`${t.fifaCode}(${t.players.length})`);
    }
  });
  if (totalPlayers < 48 * 23) {
    warn(`総選手数 ${totalPlayers} が想定より少ない（期待 ≥ ${48 * 23}）`);
  } else {
    info(`✅ 総選手数: ${totalPlayers}（期待 ≈ 1248）`);
  }
  if (badTeams.length > 0) {
    warn(`選手数が範囲外のチーム: ${badTeams.join(', ')}`);
  } else {
    info(`✅ 全チームの選手数が ${CONFIG.minPlayersPerTeam}〜${CONFIG.maxPlayersPerTeam} 人の範囲内`);
  }

  // team_code 空チェック
  const noCode = teams.filter(t => !t.fifaCode);
  if (noCode.length > 0) {
    err(`FIFA コードが空のチーム: ${noCode.length} 件（スキップ）`);
  }

  // ── ステップ 5: レコード生成 ──────────────────────────────────────────────
  info('\n=== レコード生成 ===');
  const wcTeams = [];
  const wcPlayers = [];
  const wcStats = [];
  const dobWarnings = [];

  for (const t of teams) {
    if (!t.fifaCode) continue;

    wcTeams.push({
      fifa_code:    t.fifaCode,
      name_en:      t.teamName,
      name_ja:      null, // WC_GROUPS から後で補完可能
      head_coach:   t.headCoach,
      source_url:   CONFIG.sourceUrl,
      source_name:  CONFIG.sourceName,
      source_version: `Version 1 / ${new Date().toISOString().slice(0, 10)}`,
      imported_at:  importedAt,
    });

    let totalAge = 0, totalHeight = 0;
    let gk = 0, df = 0, mf = 0, fw = 0;
    let validAgeCnt = 0, validHtCnt = 0;

    t.players.forEach((p, i) => {
      const dobRaw = t.dobs[i] || null;
      let dobParsed = null;
      if (dobRaw) {
        dobParsed = parseDate(dobRaw);
        if (!dobParsed) {
          warn(`${t.fifaCode} #${p.num}: 不正な DOB "${dobRaw}" → null`);
          dobWarnings.push({ team: t.fifaCode, num: p.num, raw: dobRaw });
        }
      }

      const age = dobParsed ? calcAge(dobParsed) : null;
      const ht = t.heights[i] || null;
      const club = t.clubs[i] || null;

      // クラブ国コードを "(XYZ)" から抽出
      let clubName = club, clubCountryCode = null;
      if (club) {
        const cm = club.match(/^(.+)\s+\(([A-Z]{2,3})\)$/);
        if (cm) { clubName = cm[1].trim(); clubCountryCode = cm[2]; }
      }

      if (age) { totalAge += age; validAgeCnt++; }
      if (ht)  { totalHeight += ht; validHtCnt++; }
      if (p.pos === 'GK') gk++;
      else if (p.pos === 'DF') df++;
      else if (p.pos === 'MF') mf++;
      else if (p.pos === 'FW') fw++;

      wcPlayers.push({
        team_code:         t.fifaCode,
        shirt_number:      p.num,
        position:          p.pos,
        player_name:       p.name || null,
        date_of_birth:     dobParsed,
        club:              clubName,
        club_country_code: clubCountryCode,
        height_cm:         ht,
        source_url:        CONFIG.sourceUrl,
        source_name:       CONFIG.sourceName,
        source_version:    `Version 1 / ${new Date().toISOString().slice(0, 10)}`,
        imported_at:       importedAt,
      });
    });

    const sc = t.players.length;
    wcStats.push({
      team_code:                    t.fifaCode,
      squad_count:                  sc,
      avg_age:                      validAgeCnt > 0 ? parseFloat((totalAge / validAgeCnt).toFixed(1)) : null,
      avg_height:                   validHtCnt > 0  ? parseFloat((totalHeight / validHtCnt).toFixed(1)) : null,
      gk_count: gk, df_count: df, mf_count: mf, fw_count: fw,
      domestic_club_players_count:  null, // 後で集計可
      foreign_club_players_count:   null,
      source_url:   CONFIG.sourceUrl,
      source_name:  CONFIG.sourceName,
      source_version: `Version 1 / ${new Date().toISOString().slice(0, 10)}`,
      imported_at:  importedAt,
    });
  }

  info(`✅ wc_teams:   ${wcTeams.length} 件`);
  info(`✅ wc_players: ${wcPlayers.length} 件`);
  info(`✅ wc_stats:   ${wcStats.length} 件`);
  if (dobWarnings.length > 0) warn(`DOB 警告: ${dobWarnings.length} 件`);

  // ── ステップ 6: サンプル表示（目視確認用） ────────────────────────────────
  info('\n=== サンプル（先頭3チーム） ===');
  ['ALG', 'JPN', 'ARG'].forEach(code => {
    const t = wcTeams.find(x => x.fifa_code === code);
    const ps = wcPlayers.filter(p => p.team_code === code).slice(0, 3);
    if (t) {
      info(`${t.name_en} (${code}) 監督:${t.head_coach}`);
      ps.forEach(p => info(`  #${p.shirt_number} ${p.position} ${p.player_name||'?'} | ${p.date_of_birth||'?'} | ${p.height_cm||'?'}cm | ${p.club||'?'}`));
    }
  });

  // ── ステップ 7: 静的 JSON 生成 ─────────────────────────────────────────────
  fs.mkdirSync(CONFIG.publicDir, { recursive: true });
  fs.mkdirSync(CONFIG.dataDir,   { recursive: true });

  const meta = {
    imported_at: importedAt,
    source_urls:    [CONFIG.sourceUrl],
    source_versions: [`Version 1 / ${new Date().toISOString().slice(0, 10)}`],
    team_count:    wcTeams.length,
    player_count:  wcPlayers.length,
    match_count:   0,
    warnings:      LOG.warn,
  };

  const writes = [
    ['wc-teams.json',      wcTeams],
    ['wc-players.json',    wcPlayers],
    ['wc-matches.json',    []],   // 今回は空
    ['wc-team-stats.json', wcStats],
    ['wc-data-meta.json',  meta],
  ];

  for (const [name, data] of writes) {
    fs.writeFileSync(path.join(CONFIG.publicDir, name), JSON.stringify(data, null, 2), 'utf8');
    info(`✅ /public/data/${name} 生成完了`);
  }

  // ── ステップ 8: DB 書き込み ────────────────────────────────────────────────
  if (!DRY_RUN) {
    await writeToSupabase(wcTeams, wcPlayers, wcStats, importedAt);
  } else {
    info('\n[DRY-RUN] DB 書き込みをスキップしました');
  }

  // ── ログ保存 ─────────────────────────────────────────────────────────────
  saveLog(importedAt, { wcTeams, wcPlayers, wcStats, dobWarnings });
  info('\n✅ 取り込み完了');
}

async function writeToSupabase(wcTeams, wcPlayers, wcStats, importedAt) {
  // .env を読み込む
  let envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    err('.env ファイルが見つかりません。.env.example を参考に作成してください');
    return;
  }
  const envContent = fs.readFileSync(envPath, 'utf8');
  const getEnv = (key) => {
    const m = envContent.match(new RegExp(`^${key}=(.+)$`, 'm'));
    return m ? m[1].trim() : null;
  };
  const SUPABASE_URL = getEnv('SUPABASE_URL');
  const SERVICE_KEY  = getEnv('SUPABASE_SERVICE_ROLE_KEY');
  if (!SUPABASE_URL || !SERVICE_KEY) {
    err('.env に SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY が必要です');
    return;
  }

  // @supabase/supabase-js を動的に require
  let createClient;
  try {
    ({ createClient } = require('@supabase/supabase-js'));
  } catch {
    err('@supabase/supabase-js が見つかりません。npm install @supabase/supabase-js を実行してください');
    return;
  }

  const db = createClient(SUPABASE_URL, SERVICE_KEY);

  info('\nSupabase upsert 中...');

  // wc_teams upsert（conflict: fifa_code）
  const { error: teamsErr } = await db.from('wc_teams').upsert(
    wcTeams,
    { onConflict: 'fifa_code', ignoreDuplicates: false }
  );
  if (teamsErr) { err(`wc_teams upsert エラー: ${teamsErr.message}`); }
  else info(`✅ wc_teams: ${wcTeams.length} 件 upsert 完了`);

  // wc_players upsert（team_code + shirt_number で一意）
  const CHUNK = 200;
  for (let i = 0; i < wcPlayers.length; i += CHUNK) {
    const chunk = wcPlayers.slice(i, i + CHUNK);
    const { error: pErr } = await db.from('wc_players').upsert(
      chunk,
      { onConflict: 'team_code,shirt_number', ignoreDuplicates: false }
    );
    if (pErr) { err(`wc_players upsert エラー (chunk ${i}): ${pErr.message}`); }
  }
  info(`✅ wc_players: ${wcPlayers.length} 件 upsert 完了`);

  // wc_team_stats_snapshot upsert（team_code で一意）
  const { error: statsErr } = await db.from('wc_team_stats_snapshot').upsert(
    wcStats,
    { onConflict: 'team_code', ignoreDuplicates: false }
  );
  if (statsErr) { err(`wc_team_stats_snapshot upsert エラー: ${statsErr.message}`); }
  else info(`✅ wc_team_stats_snapshot: ${wcStats.length} 件 upsert 完了`);
}

function saveLog(importedAt, data = {}) {
  const logPath = path.join(__dirname, '..', 'data', 'import-log.json');
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  fs.writeFileSync(logPath, JSON.stringify({
    importedAt,
    summary: {
      teams:   (data.wcTeams   || []).length,
      players: (data.wcPlayers || []).length,
      stats:   (data.wcStats   || []).length,
      dobWarnings: (data.dobWarnings || []).length,
    },
    log: LOG,
    dobWarnings: data.dobWarnings || [],
  }, null, 2), 'utf8');
}

main().catch(e => { err(e.message); process.exit(1); });
