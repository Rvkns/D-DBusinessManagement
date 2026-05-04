import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check .env.local');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================================
// Database Types (mirror dello schema SQL)
// ============================================================

export interface DbUserProfile {
  id: string;
  role: 'dm' | 'player';
  display_name: string;
  email?: string;
  character_name?: string;
  created_at: string;
}

export interface DbCampaign {
  id: string;
  name: string;
  dm_user_id: string;
  cycle: number;
  gold: number;
  party_level: number;
  gm_notes: string;
  created_at: string;
  updated_at: string;
}

export interface DbVenture {
  id: string;
  campaign_id: string;
  owner_user_id: string | null;
  name: string;
  type: string;
  manager: string;
  description: string;
  base_income: number;
  base_cost: number;
  efficiency: number;
  loyalty: number;
  notoriety: number;
  faction_alignment: string;
  current_directive: string;
  directive_locked: boolean;
  created_at: string;
}

export interface DbPendingEffect {
  id: string;
  venture_id: string;
  source_event_id: string;
  description: string;
  efficiency_delta: number;
  loyalty_delta: number;
  notoriety_delta: number;
  remaining_cycles: number;
  created_at: string;
}

export interface DbCycleReport {
  id: string;
  campaign_id: string;
  cycle_number: number;
  total_gold_change: number;
  venture_reports: any[];
  dice_rolls: Record<string, number>;
  shadow_report: string;
  narrative_dilemma: string;
  full_raw_text: string;
  created_at: string;
}

export interface DbLoreDocument {
  id: string;
  campaign_id: string;
  name: string;
  type: 'pdf' | 'docx' | 'txt';
  content: string;
  size: number;
  created_at: string;
}
