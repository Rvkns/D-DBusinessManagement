export interface Venture {
  id: string;
  name: string;
  type: string; // e.g., "Forgia", "Tratta", "Spionaggio"
  partyMember: string; // The PC who owns/oversees it
  manager: string; // The NPC running daily operations
  description: string;
  baseIncome: number;
  baseCost: number;
  efficiency: number; // 0-100
  loyalty: number; // 0-100
  notoriety: number; // 0-100 (How much attention it attracts)
  factionAlignment: string; // e.g., "House Nasadra", "Independent"
}

export interface LoreDocument {
  id: string;
  name: string;
  content: string; // The extracted text
  type: 'pdf' | 'docx' | 'txt';
  size: number;
}

export interface CycleReport {
  cycleNumber: number;
  date: string;
  totalGoldChange: number;
  ventureReports: VentureResult[];
  shadowReport: string;
  narrativeDilemma: string;
  fullRawText: string;
}

export interface VentureResult {
  ventureId: string;
  ventureName: string;
  economicResult: string; // Narrative text
  netGold: number;
  logisticsStatus: string; // Narrative text
  politicalImpact: string; // Narrative text
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