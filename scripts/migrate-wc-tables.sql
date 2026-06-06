-- ============================================================
-- W杯2026 データ表示用テーブル マイグレーション
-- 対象: wc_teams / wc_players / wc_team_stats_snapshot
-- 既存テーブル (tournaments/messages/events/feedback) には一切触れない
-- ============================================================

-- ── wc_teams ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wc_teams (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fifa_code       text UNIQUE NOT NULL,       -- 例: JPN, BRA, ARG
  name_en         text NOT NULL,
  name_ja         text,                        -- 日本語名（後で補完可）
  group_name      text,                        -- 例: A, B, C（後で補完可）
  confederation   text,
  head_coach      text,
  fifa_ranking    integer,                     -- 後で補完可
  flag_url        text,
  team_page_url   text,
  source_url      text NOT NULL,
  source_name     text NOT NULL,
  source_version  text,
  imported_at     timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- ── wc_players ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wc_players (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_code       text NOT NULL REFERENCES wc_teams(fifa_code),
  shirt_number    integer,
  position        text,                        -- GK / DF / MF / FW
  player_name     text,
  first_names     text,
  last_names      text,
  name_on_shirt   text,
  date_of_birth   date,
  club            text,
  club_country_code text,
  height_cm       integer,
  source_url      text NOT NULL,
  source_name     text NOT NULL,
  source_version  text,
  imported_at     timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  UNIQUE (team_code, shirt_number)             -- upsert の競合キー
);

-- ── wc_team_stats_snapshot ───────────────────────────────────
CREATE TABLE IF NOT EXISTS wc_team_stats_snapshot (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_code       text UNIQUE REFERENCES wc_teams(fifa_code),
  squad_count     integer,
  avg_age         numeric(4,1),
  avg_height      numeric(5,1),
  gk_count        integer,
  df_count        integer,
  mf_count        integer,
  fw_count        integer,
  domestic_club_players_count integer,
  foreign_club_players_count  integer,
  source_url      text NOT NULL,
  source_name     text NOT NULL,
  source_version  text,
  imported_at     timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- ── RLS: public read のみ / フロントから INSERT/UPDATE/DELETE 不可 ──
ALTER TABLE wc_teams              ENABLE ROW LEVEL SECURITY;
ALTER TABLE wc_players            ENABLE ROW LEVEL SECURITY;
ALTER TABLE wc_team_stats_snapshot ENABLE ROW LEVEL SECURITY;

-- SELECT は誰でも可（ログイン不要）
CREATE POLICY "wc_teams_public_read"
  ON wc_teams FOR SELECT USING (true);

CREATE POLICY "wc_players_public_read"
  ON wc_players FOR SELECT USING (true);

CREATE POLICY "wc_team_stats_public_read"
  ON wc_team_stats_snapshot FOR SELECT USING (true);

-- INSERT / UPDATE / DELETE は service_role のみ（フロントからは不可）
-- ※ RLS を有効にすると anon / authenticated ロールからの書き込みはブロックされる。
--   スクリプトは service_role キーを使うため RLS をバイパスして書き込み可能。

-- ── インデックス（検索高速化） ─────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_wc_players_team_code
  ON wc_players (team_code);

CREATE INDEX IF NOT EXISTS idx_wc_players_position
  ON wc_players (position);

CREATE INDEX IF NOT EXISTS idx_wc_players_dob
  ON wc_players (date_of_birth);
