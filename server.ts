import express from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import type {
  DifficultyConfig,
  DifficultyId,
  EndingDefinition,
  EndingId,
  GameBundle,
  ScoreRecord,
  ScoreStats,
  ThreatTemplate,
  WhatsAppScript,
} from './src/types/game.ts';

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.resolve(process.cwd(), '.data');
const AUTH_FILE = path.join(DATA_DIR, 'auth.json');
const SCORES_FILE = path.join(DATA_DIR, 'scores.json');

// Signing secret stays strictly in server memory / env
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

interface StoredAuth {
  salt: string;
  hash: string;
  createdAt: string;
}

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readStoredAuth(): StoredAuth | null {
  try {
    if (!fs.existsSync(AUTH_FILE)) return null;
    const raw = fs.readFileSync(AUTH_FILE, 'utf8');
    const parsed = JSON.parse(raw) as StoredAuth;
    if (typeof parsed.salt === 'string' && typeof parsed.hash === 'string') {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function writeStoredAuth(auth: StoredAuth): void {
  ensureDataDir();
  fs.writeFileSync(AUTH_FILE, JSON.stringify(auth, null, 2), { encoding: 'utf8', mode: 0o600 });
}

function readScores(): ScoreRecord[] {
  try {
    if (!fs.existsSync(SCORES_FILE)) return [];
    const raw = fs.readFileSync(SCORES_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ScoreRecord[]) : [];
  } catch {
    return [];
  }
}

function writeScores(records: ScoreRecord[]): void {
  ensureDataDir();
  fs.writeFileSync(SCORES_FILE, JSON.stringify(records, null, 2), 'utf8');
}

function buildScoreStats(): ScoreStats {
  const history = readScores();
  let bestScore = 0;
  let legendaryCount = 0;
  for (const r of history) {
    if (r.score > bestScore) bestScore = r.score;
    if (r.ending === 'legendary') legendaryCount += 1;
  }
  return {
    bestScore,
    totalRuns: history.length,
    legendaryCount,
    history: history.slice(0, 15),
  };
}

function sha256Digest(value: string): Buffer {
  return crypto.createHash('sha256').update(value, 'utf8').digest();
}

function verifyPasscode(candidate: string): { ok: boolean; claimedNow: boolean } {
  const clean = candidate.trim();
  const envPasscode = process.env.REBECA_PASSCODE?.trim();

  if (envPasscode && envPasscode.length > 0) {
    const a = sha256Digest(clean);
    const b = sha256Digest(envPasscode);
    return { ok: crypto.timingSafeEqual(a, b), claimedNow: false };
  }

  const stored = readStoredAuth();
  if (stored) {
    const derived = crypto.scryptSync(clean, stored.salt, 64);
    const expected = Buffer.from(stored.hash, 'hex');
    if (derived.length !== expected.length) return { ok: false, claimedNow: false };
    return { ok: crypto.timingSafeEqual(derived, expected), claimedNow: false };
  }

  // First-run atomic bootstrap: claim & hash Rebeca's personal passcode
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(clean, salt, 64).toString('hex');
  writeStoredAuth({
    salt,
    hash,
    createdAt: new Date().toISOString(),
  });
  return { ok: true, claimedNow: true };
}

function isPasscodeConfigured(): boolean {
  const envPasscode = process.env.REBECA_PASSCODE?.trim();
  if (envPasscode && envPasscode.length > 0) return true;
  return readStoredAuth() !== null;
}

function signSessionToken(): string {
  const payload = {
    sub: 'rebeca',
    iat: Date.now(),
    exp: Date.now() + TOKEN_TTL_MS,
    nonce: crypto.randomBytes(8).toString('hex'),
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encodedPayload)
    .digest('base64url');
  return `${encodedPayload}.${sig}`;
}

function verifySessionToken(token: string | undefined): boolean {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [encodedPayload, sig] = parts;
  if (!encodedPayload || !sig) return false;

  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encodedPayload)
    .digest('base64url');

  const sigBuf = Buffer.from(sig, 'utf8');
  const expectedBuf = Buffer.from(expectedSig, 'utf8');
  if (sigBuf.length !== expectedBuf.length) return false;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return false;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as {
      sub?: string;
      exp?: number;
    };
    if (payload.sub !== 'rebeca') return false;
    if (typeof payload.exp !== 'number' || Date.now() > payload.exp) return false;
    return true;
  } catch {
    return false;
  }
}

function extractBearerToken(req: express.Request): string | undefined {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return undefined;
  return header.slice(7).trim();
}

function requireRebecaAuth(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  const token = extractBearerToken(req);
  if (!verifySessionToken(token)) {
    res.status(401).json({ error: 'Acesso exclusivo da Rebeca. Autenticação necessária.' });
    return;
  }
  next();
}

const DIFFICULTIES: DifficultyConfig[] = [
  {
    id: 'calminho',
    name: 'Fui na Padaria',
    subtitle: '45s · Eventos tranquilos para aquecer',
    durationSeconds: 45,
    spawnIntervalMs: 3200,
    maxConcurrent: 1,
    baseDamage: 14,
    scoreMultiplier: 1,
  },
  {
    id: 'normal',
    name: 'Fui Resolver um BO',
    subtitle: '60s · Caos equilibrado e sustos reais',
    durationSeconds: 60,
    spawnIntervalMs: 2400,
    maxConcurrent: 2,
    baseDamage: 18,
    scoreMultiplier: 1.5,
  },
  {
    id: 'caos',
    name: 'Sumi no Mundo',
    subtitle: '75s · Perigos duplos e desespero puro',
    durationSeconds: 75,
    spawnIntervalMs: 1750,
    maxConcurrent: 3,
    baseDamage: 22,
    scoreMultiplier: 2.2,
  },
];

const THREATS: ThreatTemplate[] = [
  {
    kind: 'cat',
    emoji: '🐱',
    title: 'UM GATO ESTÁ CHEGANDO!',
    description: 'Ele acha que o ovo é uma bolinha de lã cara!',
    actionLabel: 'ESPANTAR O GATO!',
    tapsNeeded: 2,
    timeoutMs: 4200,
    damage: 18,
    points: 120,
    eggMood: 'terrified',
    successToast: 'Xô, bichano! Rebeca salvou a casca!',
    failToast: 'Miau! O gato deu uma patada no ovo!',
    whatsappTrigger: {
      ownerMsg: 'Rebeca, tá tudo bem com meu ovo?',
      rebecaReply: 'Tá sim kkkkk',
      ownerFollowUp: 'Você tem certeza? Por que tem um gato perto dele???',
    },
  },
  {
    kind: 'dog',
    emoji: '🐶',
    title: 'O CACHORRO QUER O OVO!',
    description: 'Um caramelo faminto tá olhando com cara de quem vai abocanhar!',
    actionLabel: 'DISTRAIR O CACHORRO!',
    tapsNeeded: 2,
    timeoutMs: 4300,
    damage: 20,
    points: 130,
    eggMood: 'nervous',
    successToast: 'Boa, Rebeca! Ele foi atrás do graveto!',
    failToast: 'Au! O cachorro deu uma lambida suspeita no ovo!',
    whatsappTrigger: {
      ownerMsg: 'REBECA, OUVI UM LATIDO NO ÁUDIO!!',
      rebecaReply: 'É o cachorro do vizinho... eu acho 😅',
      ownerFollowUp: 'NÃO DEIXA ELE PEGAR MEU OVO!',
    },
  },
  {
    kind: 'rain',
    emoji: '🌧️',
    title: 'COMEÇOU A CHOVER!',
    description: 'Tempestade do nada! O ovo vai pegar friagem!',
    actionLabel: 'PROTEGER DA CHUVA!',
    tapsNeeded: 2,
    timeoutMs: 4500,
    damage: 15,
    points: 110,
    eggMood: 'wet',
    successToast: 'Guarda-chuva aberto a tempo! Ovo sequinho!',
    failToast: 'Splash! O ovo encharcou inteiro!',
    whatsappTrigger: {
      ownerMsg: 'Tá chovendo aí, Rebeca??',
      rebecaReply: 'Só uma garoa bem leve...',
      ownerFollowUp: 'PROTEGE MEU OVO DA CHUVA, REBECA!',
    },
  },
  {
    kind: 'chicken',
    emoji: '🐔',
    title: 'UMA GALINHA APARECEU!',
    description: 'Ela jurou que esse ovo é dela e quer a guarda na justiça!',
    actionLabel: 'AFASTAR A GALINHA!',
    tapsNeeded: 3,
    timeoutMs: 4700,
    damage: 19,
    points: 150,
    eggMood: 'terrified',
    successToast: 'Rebeca venceu o processo contra a galinha!',
    failToast: 'Có-có-có! A galinha deu uma bicada!',
    whatsappTrigger: {
      ownerMsg: 'Rebeca, por que tem uma galinha gritando aí?',
      rebecaReply: 'Longa história kkkk já resolvi',
    },
  },
  {
    kind: 'pigeon',
    emoji: '🐦',
    title: 'UM POMBO ESTÁ SE APROXIMANDO!',
    description: 'Pombo de praça não tem medo de nada nem de ninguém!',
    actionLabel: 'ESPANTAR O POMBO!',
    tapsNeeded: 2,
    timeoutMs: 3900,
    damage: 16,
    points: 115,
    eggMood: 'nervous',
    successToast: 'Pruuu! Pombo decolou assustado!',
    failToast: 'O pombo pousou bem em cima da cabeça do ovo!',
  },
  {
    kind: 'falling',
    emoji: '💥',
    title: 'O OVO ESTÁ CAINDO!',
    description: 'Escorregou do ninho! Segura antes que vire omelete!',
    actionLabel: 'SEGURAR O OVO!',
    tapsNeeded: 1,
    timeoutMs: 3200,
    damage: 26,
    points: 180,
    eggMood: 'falling',
    successToast: 'REFLEXO DE GOLEIRA, REBECA! Pegou no ar!',
    failToast: 'CRACK! Bateu no chão com tudo!',
    whatsappTrigger: {
      ownerMsg: 'CADÊ MEU OVO?! OUVI UM BARULHO!',
      rebecaReply: 'ELE TÁ VOANDO MAS EU PEGUEI!!',
      ownerFollowUp: 'REBECA, PELO AMOR DE DEUS!',
    },
  },
  {
    kind: 'thief',
    emoji: '🕵️',
    title: 'ALGUÉM QUER ROUBAR O OVO!',
    description: 'Um ladrão de luva preta e capa tá dando o bote!',
    actionLabel: 'IMPEDIR O LADRÃO!',
    tapsNeeded: 3,
    timeoutMs: 4500,
    damage: 24,
    points: 170,
    eggMood: 'terrified',
    successToast: 'Ladrão nocauteado pela Rebeca!',
    failToast: 'O ladrão quase levou o ovo na sacola!',
    whatsappTrigger: {
      ownerMsg: 'TÔ VENDO PELA CÂMERA DO VIZINHO!! QUEM É ESSE CARA?!',
      rebecaReply: 'Já botei pra correr 💅',
    },
  },
  {
    kind: 'wind',
    emoji: '🌬️',
    title: 'VENTANIA MALUCA!',
    description: 'Pé de vento tentando rolar o ovo ladeira abaixo!',
    actionLabel: 'SEGURAR NO NINHO!',
    tapsNeeded: 2,
    timeoutMs: 4000,
    damage: 17,
    points: 125,
    eggMood: 'dizzy',
    successToast: 'Ventania controlada! Ovo firme e forte!',
    failToast: 'O ovo saiu girando igual pião!',
  },
  {
    kind: 'mosquito',
    emoji: '🦟',
    title: 'PERNILONGO GIGANTE!',
    description: 'Um mosquito mutante zumbindo bem na orelha do ovo!',
    actionLabel: 'DAR RAQUETADA!',
    tapsNeeded: 2,
    timeoutMs: 3800,
    damage: 14,
    points: 120,
    eggMood: 'nervous',
    successToast: 'PLÁFT! Mosquito neutralizado!',
    failToast: 'Zzzzz! O ovo ficou todo estressado!',
  },
  {
    kind: 'paparazzi',
    emoji: '📸',
    title: 'PAPARAZZI DO OVO!',
    description: 'Repórter querendo furo de reportagem sobre o ovo da Rebeca!',
    actionLabel: 'BLOQUEAR CÂMERA!',
    tapsNeeded: 2,
    timeoutMs: 4200,
    damage: 14,
    points: 135,
    eggMood: 'dizzy',
    successToast: 'Sem fotos hoje! Privacidade do ovo garantida!',
    failToast: 'Flash na cara! O ovo ficou tonto!',
  },
  {
    kind: 'ufo',
    emoji: '🛸',
    title: 'OVNI QUER ABDUZIR O OVO!',
    description: 'Aliens descobriram que esse ovo é valioso demais!',
    actionLabel: 'CORTAR RAIO TRATOR!',
    tapsNeeded: 3,
    timeoutMs: 4600,
    damage: 22,
    points: 200,
    eggMood: 'falling',
    successToast: 'Nem os ETs vencem a Rebeca!',
    failToast: 'O ovo bateu a cabeça no disco voador!',
    whatsappTrigger: {
      ownerMsg: 'Rebeca... por que tem uma luz verde saindo da sua casa?',
      rebecaReply: 'É só a luminária nova, confia 😂',
    },
  },
  {
    kind: 'hunger',
    emoji: '🍳',
    title: 'REBECA FICOU COM FOME!',
    description: 'Bateu vontade de fazer ovo mexido... NÃO OLHA PRA FRIGIDEIRA!',
    actionLabel: 'RESISTIR À TENTAÇÃO!',
    tapsNeeded: 2,
    timeoutMs: 4100,
    damage: 20,
    points: 160,
    eggMood: 'terrified',
    successToast: 'Pede um lanche, Rebeca! O ovo agradece!',
    failToast: 'Você chegou muito perto da frigideira, Rebeca!!',
    whatsappTrigger: {
      ownerMsg: 'REBECA, LARGA ESSA FRIGIDEIRA AGORA!!',
      rebecaReply: 'EU SÓ IA FAZER UM MIOJO 😭',
    },
  },
];

const AMBIENT_CHATS: WhatsAppScript[][] = [
  [
    { id: 'a1', sender: 'owner', text: 'Rebeca, não me decepcione!' },
    { id: 'a2', sender: 'rebeca', text: 'Relaxa, tá tudo sob controle por aqui 😎' },
  ],
  [
    { id: 'a3', sender: 'owner', text: 'EU CONFIEI EM VOCÊ, REBECA!' },
    { id: 'a4', sender: 'owner', text: 'Ele ainda tá inteiro né??' },
    { id: 'a5', sender: 'rebeca', text: 'Inteiríssimo! (quase)' },
  ],
  [
    { id: 'a6', sender: 'owner', text: 'CADÊ MEU OVO?' },
    { id: 'a7', sender: 'rebeca', text: 'Aqui no ninho bem quentinho 🥚❤️' },
  ],
  [
    { id: 'a8', sender: 'owner', text: 'Rebeca, se esse ovo quebrar eu vou contar pra todo mundo!' },
    { id: 'a9', sender: 'rebeca', text: 'Calmaaa, sou profissional nisso!' },
  ],
];

const URGENT_CHATS: string[] = [
  'REBECA, NÃO ME DECEPCIONE!',
  'EU CONFIEI EM VOCÊ!',
  'CADÊ MEU OVO?',
  'NÃO DEIXA ELE QUEBRAR!',
  'REBECA, PELO AMOR DE DEUS!',
  'TÔ CHEGANDO AÍ, SEGURA AS PONTAS REBECA!!',
];

const ENDINGS: Record<EndingId, EndingDefinition> = {
  legendary: {
    id: 'legendary',
    badge: 'FINAL LENDÁRIO',
    title: 'Rebeca é oficialmente a melhor cuidadora de ovos do mundo! 👑',
    subtitle:
      'Nem gato, nem cachorro, nem galinha nem disco voador conseguiram arranhar esse ovo. A casca brilha mais que diamante!',
    ownerQuote:
      'REBECA DO CÉU! O ovo voltou melhor do que quando eu deixei! Você é uma lenda viva!! 🏆🥚❤️',
  },
  perfect: {
    id: 'perfect',
    badge: 'FINAL PERFEITO',
    title: 'Rebeca protegeu o ovo com honra e glória! ✨',
    subtitle:
      'Alguns sustos no caminho, coração acelerado, mas o ovo sobreviveu intacto sob os cuidados exclusivos da Rebeca.',
    ownerQuote:
      'Ufa!! Sabia que eu podia confiar em você, Rebeca! Muito obrigado por cuidar do meu ovo! ❤️',
  },
  chaotic: {
    id: 'chaotic',
    badge: 'FINAL CAÓTICO',
    title: 'O ovo sobreviveu... por um fio de casca! 😅',
    subtitle:
      'Teve gato, teve queda, teve band-aid improvisado, mas tecnicamente o ovo ainda conta como inteiro!',
    ownerQuote:
      'Rebeca... por que meu ovo tá suando e com três curativos?! Mas ok, tá vivo, você venceu por pouco!! 😂🥚',
  },
  tragic: {
    id: 'tragic',
    badge: 'FINAL TRÁGICO',
    title: 'REBECA... EU CONFIEI EM VOCÊ. 💔',
    subtitle: 'O ovo quebrou e Rebeca decepcionou o dono. Só sobrou a gema no chão.',
    ownerQuote:
      'Eu saí por UM MINUTO, Rebeca... UM MINUTO! Meu ovo virou omelete de drama! 😭🍳💔',
  },
};

function buildGameBundle(): GameBundle {
  return {
    playerName: 'Rebeca',
    story: {
      headline: 'REBECA, PRECISO TE PEDIR UMA COISA...',
      subheadline: 'Você pode cuidar do meu ovo rapidinho? Prometo que não vou demorar!',
      acceptLabel: 'CLARO! ❤️',
      hesitateLabel: 'NÃO SEI SE É UMA BOA IDEIA...',
      acceptReply:
        'Sabia que podia contar com você, Rebeca! Seguinte: não tira o olho dele por NADA. Já volto! 🏃‍♂️💨',
      hesitateReply:
        'Tarde demais, Rebeca! Já coloquei o ovo no seu colo e saí correndo! Boa sorte, confio em você! 🏃‍♂️💨',
    },
    difficulties: DIFFICULTIES,
    threats: THREATS,
    ambientChats: AMBIENT_CHATS,
    urgentChats: URGENT_CHATS,
    endings: ENDINGS,
    scores: buildScoreStats(),
  };
}

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '64kb' }));

  // Auth status endpoint (never leaks game content)
  app.get('/api/auth/status', (req, res) => {
    const token = extractBearerToken(req);
    res.json({
      configured: isPasscodeConfigured(),
      authenticated: verifySessionToken(token),
    });
  });

  // Exclusive Rebeca gate verification
  app.post('/api/auth/unlock', (req, res) => {
    const body = req.body as { passcode?: unknown; confirmIdentity?: unknown };
    if (body?.confirmIdentity !== true) {
      res.status(400).json({ error: 'Confirme que você é a Rebeca antes de entrar!' });
      return;
    }
    if (typeof body?.passcode !== 'string' || body.passcode.trim().length < 3 || body.passcode.trim().length > 64) {
      res.status(400).json({ error: 'Digite uma senha secreta entre 3 e 64 caracteres.' });
      return;
    }

    const result = verifyPasscode(body.passcode);
    if (!result.ok) {
      res.status(401).json({
        error: 'Ei! Você não parece a Rebeca... Senha incorreta! 🕵️‍♂️',
      });
      return;
    }

    const token = signSessionToken();
    res.json({
      authenticated: true,
      claimedNow: result.claimedNow,
      token,
    });
  });

  // Protected game data bundle (only accessible after passing exclusive gate)
  app.get('/api/game/bundle', requireRebecaAuth, (_req, res) => {
    res.json(buildGameBundle());
  });

  // Protected scores read
  app.get('/api/scores', requireRebecaAuth, (_req, res) => {
    res.json(buildScoreStats());
  });

  // Protected score save with strict input validation
  app.post('/api/scores', requireRebecaAuth, (req, res) => {
    const body = req.body as Record<string, unknown>;
    const validDifficulties = new Set<string>(['calminho', 'normal', 'caos']);
    const validEndings = new Set<string>(['legendary', 'perfect', 'chaotic', 'tragic']);

    const difficulty = typeof body.difficulty === 'string' && validDifficulties.has(body.difficulty)
      ? (body.difficulty as DifficultyId)
      : null;
    const ending = typeof body.ending === 'string' && validEndings.has(body.ending)
      ? (body.ending as EndingId)
      : null;

    const score = typeof body.score === 'number' && Number.isFinite(body.score)
      ? Math.max(0, Math.min(999999, Math.round(body.score)))
      : null;
    const hpRemaining = typeof body.hpRemaining === 'number' && Number.isFinite(body.hpRemaining)
      ? Math.max(0, Math.min(100, Math.round(body.hpRemaining)))
      : null;
    const eventsDefended = typeof body.eventsDefended === 'number' && Number.isFinite(body.eventsDefended)
      ? Math.max(0, Math.min(500, Math.round(body.eventsDefended)))
      : null;
    const maxCombo = typeof body.maxCombo === 'number' && Number.isFinite(body.maxCombo)
      ? Math.max(0, Math.min(500, Math.round(body.maxCombo)))
      : null;
    const durationSeconds = typeof body.durationSeconds === 'number' && Number.isFinite(body.durationSeconds)
      ? Math.max(1, Math.min(300, Math.round(body.durationSeconds)))
      : null;

    if (
      !difficulty ||
      !ending ||
      score === null ||
      hpRemaining === null ||
      eventsDefended === null ||
      maxCombo === null ||
      durationSeconds === null
    ) {
      res.status(400).json({ error: 'Dados da partida inválidos.' });
      return;
    }

    const existing = readScores();
    const record: ScoreRecord = {
      id: crypto.randomUUID(),
      difficulty,
      score,
      hpRemaining,
      ending,
      eventsDefended,
      maxCombo,
      durationSeconds,
      createdAt: new Date().toISOString(),
    };

    const updated = [record, ...existing].slice(0, 50);
    writeScores(updated);

    res.status(201).json({
      saved: record,
      stats: buildScoreStats(),
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
