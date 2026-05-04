export type UserRole = 'dm' | 'player';

export type DirectiveId =
  | 'MAXIMIZE_PROFIT'
  | 'LAY_LOW'
  | 'EXPAND'
  | 'INVEST_SECURITY'
  | 'BRIBE_FACTION'
  | 'RECRUIT_STAFF'
  | 'MAINTAIN';

export interface Directive {
  id: DirectiveId;
  label: string;
  icon: string;
  description: string;
  effects: {
    goldMultiplier?: number;
    goldFixed?: number;
    efficiencyDelta?: number;
    loyaltyDelta?: number;
    notorietyDelta?: number;
    eventRiskModifier?: number;
    nextCycleEfficiencyBonus?: number;
  };
}

export interface PendingEffect {
  id: string; // Add ID for DB
  sourceEventId: string;
  sourceEventName?: string;
  description: string;
  efficiencyDelta: number;
  loyaltyDelta: number;
  notorietyDelta: number;
  remainingCycles: number;
}

export interface Venture {
  id: string;
  campaign_id?: string; // DB mapping
  owner_user_id?: string; // DB mapping
  name: string;
  type: string; // e.g., "Forgia", "Tratta", "Spionaggio"
  partyMember: string; // Visual name of PC, can be derived or manual
  manager: string; // The NPC running daily operations
  description: string;
  baseIncome: number;
  baseCost: number;
  efficiency: number; // 0-100
  loyalty: number; // 0-100
  notoriety: number; // 0-100 (How much attention it attracts)
  factionAlignment: string; // e.g., "House Nasadra", "Independent"
  currentDirective: DirectiveId;
  directiveLocked: boolean;
  pendingEffects?: PendingEffect[];
}

export interface LoreDocument {
  id: string;
  name: string;
  content: string; // The extracted text
  type: 'pdf' | 'docx' | 'txt';
  size: number;
}

export interface VentureResult {
  ventureId: string;
  ventureName: string;
  economicResult: string; // Narrative text
  netGold: number;
  logisticsStatus: string; // Narrative text
  politicalImpact: string; // Narrative text
  eventName?: string;
  eventCategory?: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'CRITICAL';
}

export interface CycleReport {
  cycleNumber: number;
  date: string;
  totalGoldChange: number;
  ventureReports: VentureResult[];
  shadowReport: string;
  narrativeDilemma: string;
  fullRawText: string;
  diceRolls?: Record<string, number>; // { ventureId: roll }
}

export interface SimulationState {
  cycle: number;
  gold: number;
  partyLevel: number;
  ventures: Venture[];
  loreDocuments: LoreDocument[];
  history: CycleReport[];
  isSimulating: boolean;
  lastError: string | null;
}

export interface SimulationEvent {
  id: string;
  name: string;
  category: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'CRITICAL';
  baseWeight: number; // Or not needed if using d100 ranges, but keeping for reference
  effects: {
    goldMultiplier?: number;
    goldFixed?: number;
    efficiencyDelta?: number;
    loyaltyDelta?: number;
    notorietyDelta?: number;
    nextCyclePenalty?: {
      efficiencyDelta?: number;
      loyaltyDelta?: number;
      notorietyDelta?: number;
      remainingCycles: number;
      description?: string;
    };
  };
}

export interface CalculatedVentureResult {
  ventureId: string;
  ventureName: string;
  directive: DirectiveId;
  rawRoll: number;
  modifiedRoll: number;
  event: SimulationEvent;
  baseProfit: number;
  netGold: number;
  newEfficiency: number;
  newLoyalty: number;
  newNotoriety: number;
  pendingEffects: PendingEffect[];
}