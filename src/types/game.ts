export type DifficultyId = 'calminho' | 'normal' | 'caos';

export type EndingId = 'legendary' | 'perfect' | 'chaotic' | 'tragic';

export type ThreatKind =
  | 'cat'
  | 'dog'
  | 'rain'
  | 'chicken'
  | 'pigeon'
  | 'falling'
  | 'thief'
  | 'wind'
  | 'mosquito'
  | 'paparazzi'
  | 'ufo'
  | 'hunger';

export type EggMood =
  | 'happy'
  | 'nervous'
  | 'terrified'
  | 'falling'
  | 'wet'
  | 'dizzy'
  | 'heroic'
  | 'cracked';

export interface DifficultyConfig {
  id: DifficultyId;
  name: string;
  subtitle: string;
  durationSeconds: number;
  spawnIntervalMs: number;
  maxConcurrent: number;
  baseDamage: number;
  scoreMultiplier: number;
}

export interface ThreatTemplate {
  kind: ThreatKind;
  emoji: string;
  title: string;
  description: string;
  actionLabel: string;
  tapsNeeded: number;
  timeoutMs: number;
  damage: number;
  points: number;
  eggMood: EggMood;
  successToast: string;
  failToast: string;
  whatsappTrigger?: {
    ownerMsg: string;
    rebecaReply?: string;
    ownerFollowUp?: string;
  };
}

export interface WhatsAppScript {
  id: string;
  sender: 'owner' | 'rebeca';
  text: string;
}

export interface EndingDefinition {
  id: EndingId;
  badge: string;
  title: string;
  subtitle: string;
  ownerQuote: string;
}

export interface ScoreRecord {
  id: string;
  difficulty: DifficultyId;
  score: number;
  hpRemaining: number;
  ending: EndingId;
  eventsDefended: number;
  maxCombo: number;
  durationSeconds: number;
  createdAt: string;
}

export interface ScoreStats {
  bestScore: number;
  totalRuns: number;
  legendaryCount: number;
  history: ScoreRecord[];
}

export interface GameBundle {
  playerName: string;
  story: {
    headline: string;
    subheadline: string;
    acceptLabel: string;
    hesitateLabel: string;
    acceptReply: string;
    hesitateReply: string;
  };
  difficulties: DifficultyConfig[];
  threats: ThreatTemplate[];
  ambientChats: WhatsAppScript[][];
  urgentChats: string[];
  endings: Record<EndingId, EndingDefinition>;
  scores: ScoreStats;
}
