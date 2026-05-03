-- ============================================================
-- D&D BUSINESS MANAGEMENT — SUPABASE SCHEMA
-- Esegui questo script nell'SQL Editor di Supabase
-- ============================================================

-- Abilita UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABELLA: user_profiles
-- Estende auth.users con ruolo e nome personaggio
-- ============================================================
CREATE TABLE public.user_profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role          TEXT NOT NULL DEFAULT 'player' CHECK (role IN ('dm', 'player')),
  display_name  TEXT,
  character_name TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABELLA: campaigns
-- ============================================================
CREATE TABLE public.campaigns (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  dm_user_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cycle       INTEGER DEFAULT 1,
  gold        INTEGER DEFAULT 1000,
  party_level INTEGER DEFAULT 3,
  gm_notes    TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABELLA: ventures
-- ============================================================
CREATE TABLE public.ventures (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id        UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  owner_user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name               TEXT NOT NULL,
  type               TEXT DEFAULT 'Generico',
  manager            TEXT DEFAULT 'Sconosciuto',
  description        TEXT DEFAULT '',
  base_income        INTEGER DEFAULT 0,
  base_cost          INTEGER DEFAULT 0,
  efficiency         INTEGER DEFAULT 50 CHECK (efficiency BETWEEN 0 AND 100),
  loyalty            INTEGER DEFAULT 50 CHECK (loyalty BETWEEN 0 AND 100),
  notoriety          INTEGER DEFAULT 10 CHECK (notoriety BETWEEN 0 AND 100),
  faction_alignment  TEXT DEFAULT 'Independent',
  current_directive  TEXT DEFAULT 'MAINTAIN',
  directive_locked   BOOLEAN DEFAULT false,
  created_at         TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABELLA: pending_effects
-- Effetti che persistono per N cicli futuri
-- ============================================================
CREATE TABLE public.pending_effects (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venture_id       UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  source_event_id  TEXT NOT NULL,
  description      TEXT NOT NULL,
  efficiency_delta INTEGER DEFAULT 0,
  loyalty_delta    INTEGER DEFAULT 0,
  notoriety_delta  INTEGER DEFAULT 0,
  remaining_cycles INTEGER DEFAULT 1,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABELLA: cycle_reports
-- ============================================================
CREATE TABLE public.cycle_reports (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id       UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  cycle_number      INTEGER NOT NULL,
  total_gold_change INTEGER DEFAULT 0,
  venture_reports   JSONB NOT NULL DEFAULT '[]',
  dice_rolls        JSONB NOT NULL DEFAULT '{}',
  shadow_report     TEXT DEFAULT '',
  narrative_dilemma TEXT DEFAULT '',
  full_raw_text     TEXT DEFAULT '',
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABELLA: lore_documents
-- Spostato da localStorage a DB
-- ============================================================
CREATE TABLE public.lore_documents (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  type        TEXT CHECK (type IN ('pdf', 'docx', 'txt')),
  content     TEXT NOT NULL,
  size        INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.user_profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventures         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_effects  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cycle_reports    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lore_documents   ENABLE ROW LEVEL SECURITY;


-- Helper function: avoids recursive RLS chains when checking DM ownership
CREATE OR REPLACE FUNCTION public.is_dm_of_campaign(campaign_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.campaigns c
    WHERE c.id = campaign_uuid
      AND c.dm_user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_dm_of_campaign(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_dm_of_campaign(UUID) TO authenticated;

-- user_profiles: ognuno vede il proprio profilo
CREATE POLICY "user_own_profile" ON user_profiles
  FOR ALL USING (id = auth.uid());

-- campaigns: il DM vede le proprie, i player vedono quelle a cui sono associati
CREATE POLICY "dm_own_campaigns" ON campaigns
  FOR ALL USING (dm_user_id = auth.uid());

CREATE POLICY "player_view_campaigns" ON campaigns
  FOR SELECT USING (
    id IN (SELECT campaign_id FROM ventures WHERE owner_user_id = auth.uid())
  );

-- ventures: DM vede tutte nella sua campagna, Player solo le sue
CREATE POLICY "dm_full_ventures" ON ventures
  FOR ALL USING (public.is_dm_of_campaign(campaign_id));

CREATE POLICY "player_own_ventures" ON ventures
  FOR SELECT USING (owner_user_id = auth.uid());

CREATE POLICY "player_update_directive" ON ventures
  FOR UPDATE USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

-- pending_effects: segue le regole della venture parent
CREATE POLICY "dm_pending_effects" ON pending_effects
  FOR ALL USING (
    venture_id IN (SELECT v.id FROM ventures v WHERE public.is_dm_of_campaign(v.campaign_id))
  );

CREATE POLICY "player_view_pending_effects" ON pending_effects
  FOR SELECT USING (
    venture_id IN (SELECT id FROM ventures WHERE owner_user_id = auth.uid())
  );

-- cycle_reports: DM può creare/leggere, Player può solo leggere
CREATE POLICY "dm_manage_reports" ON cycle_reports
  FOR ALL USING (public.is_dm_of_campaign(campaign_id));

CREATE POLICY "player_view_reports" ON cycle_reports
  FOR SELECT USING (
    campaign_id IN (SELECT campaign_id FROM ventures WHERE owner_user_id = auth.uid())
  );

-- lore_documents: solo DM
CREATE POLICY "dm_lore_documents" ON lore_documents
  FOR ALL USING (public.is_dm_of_campaign(campaign_id));

-- ============================================================
-- FUNZIONE: auto-crea profilo utente dopo registrazione
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
