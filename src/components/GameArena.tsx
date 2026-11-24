import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Heart, Pause, Play, RotateCcw, Shield, Timer, Volume2, VolumeX, Zap } from 'lucide-react';
import type {
  DifficultyConfig,
  EggMood,
  EndingId,
  GameBundle,
  ThreatTemplate,
} from '../types/game';
import { soundEngine } from '../utils/soundEngine';
import { EggCharacter } from './EggCharacter';
import { ThreatCharacter } from './ThreatCharacter';
import { WhatsAppFeed, type ChatMessage } from './WhatsAppFeed';

export interface GameResultPayload {
  difficulty: DifficultyConfig['id'];
  score: number;
  hpRemaining: number;
  ending: EndingId;
  eventsDefended: number;
  maxCombo: number;
  durationSeconds: number;
}

interface GameArenaProps {
  bundle: GameBundle;
  difficulty: DifficultyConfig;
  muted: boolean;
  onToggleMute: () => void;
  onFinish: (result: GameResultPayload) => void;
  onAbortToStory: () => void;
}

interface ActiveThreat {
  instanceId: string;
  template: ThreatTemplate;
  tapsDone: number;
  tapsRequired: number;
  remainingMs: number;
  totalMs: number;
}

interface FloatingHeart {
  id: number;
  xOffset: number;
}

function formatNowTime(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export function GameArena({
  bundle,
  difficulty,
  muted,
  onToggleMute,
  onFinish,
  onAbortToStory,
}: GameArenaProps) {
  const totalMs = difficulty.durationSeconds * 1000;

  const [hp, setHp] = useState(100);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [eventsDefended, setEventsDefended] = useState(0);
  const [timeLeftMs, setTimeLeftMs] = useState(totalMs);
  const [activeThreats, setActiveThreats] = useState<ActiveThreat[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [shieldActive, setShieldActive] = useState(false);
  const [heroicMoment, setHeroicMoment] = useState(false);
  const [bgError, setBgError] = useState(false);
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);
  const [toast, setToast] = useState<{ id: number; text: string; tone: 'good' | 'bad' | 'info' }>({
    id: 0,
    text: 'Fica atenta, Rebeca! O ovo está contando com você!',
    tone: 'info',
  });

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'owner',
      text: 'Rebeca, acabei de sair! Cuida bem do meu ovo, por favor!',
      time: formatNowTime(),
    },
    {
      id: 'init-2',
      sender: 'rebeca',
      text: 'Pode deixar comigo! 🥚❤️',
      time: formatNowTime(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  // Mutable refs for accurate 50ms game loop without stale closures
  const hpRef = useRef(100);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const maxComboRef = useRef(0);
  const defendedRef = useRef(0);
  const timeLeftRef = useRef(totalMs);
  const threatsRef = useRef<ActiveThreat[]>([]);
  const spawnCooldownRef = useRef(1000);
  const ambientCooldownRef = useRef(7500);
  const finishedRef = useRef(false);
  const chatTimeoutsRef = useRef<number[]>([]);
  const lastTriggeredThreatChatRef = useRef<string | null>(null);

  const pushChatSequence = useCallback(
    (steps: Array<{ sender: 'owner' | 'rebeca'; text: string; delayMs: number }>) => {
      steps.forEach((step) => {
        const typingId = window.setTimeout(() => {
          if (finishedRef.current) return;
          if (step.sender === 'owner') setIsTyping(true);
        }, Math.max(0, step.delayMs - 450));

        const msgId = window.setTimeout(() => {
          if (finishedRef.current) return;
          setIsTyping(false);
          soundEngine.playPop();
          setMessages((prev) => [
            ...prev.slice(-24),
            {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              sender: step.sender,
              text: step.text,
              time: formatNowTime(),
            },
          ]);
        }, step.delayMs);

        chatTimeoutsRef.current.push(typingId, msgId);
      });
    },
    []
  );

  const triggerEndGame = useCallback(
    (finalHp: number) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      chatTimeoutsRef.current.forEach((id) => window.clearTimeout(id));

      let ending: EndingId = 'perfect';
      if (finalHp <= 0) {
        ending = 'tragic';
        soundEngine.playTragic();
      } else if (finalHp >= 90 && (defendedRef.current >= 8 || scoreRef.current >= 1200)) {
        ending = 'legendary';
        soundEngine.playVictory();
      } else if (finalHp >= 50) {
        ending = 'perfect';
        soundEngine.playVictory();
      } else {
        ending = 'chaotic';
        soundEngine.playVictory();
      }

      const elapsedSec = Math.max(
        1,
        Math.round((totalMs - Math.max(0, timeLeftRef.current)) / 1000)
      );

      onFinish({
        difficulty: difficulty.id,
        score: scoreRef.current,
        hpRemaining: Math.max(0, finalHp),
        ending,
        eventsDefended: defendedRef.current,
        maxCombo: maxComboRef.current,
        durationSeconds: elapsedSec,
      });
    },
    [difficulty.id, onFinish, totalMs]
  );

  // Main 50ms game tick loop
  useEffect(() => {
    if (isPaused || finishedRef.current) return;

    const TICK_MS = 50;
    const intervalId = window.setInterval(() => {
      if (finishedRef.current) return;

      // 1. Update mission countdown
      timeLeftRef.current = Math.max(0, timeLeftRef.current - TICK_MS);
      setTimeLeftMs(timeLeftRef.current);

      if (timeLeftRef.current <= 0) {
        triggerEndGame(hpRef.current);
        return;
      }

      // 2. Update active threats timers
      const surviving: ActiveThreat[] = [];
      let damagedNow = false;

      for (const threat of threatsRef.current) {
        const nextRem = threat.remainingMs - TICK_MS;
        if (nextRem <= 0) {
          damagedNow = true;
          const dmg = Math.round(threat.template.damage * (difficulty.baseDamage / 18));
          hpRef.current = Math.max(0, hpRef.current - dmg);
          comboRef.current = 0;

          setHp(hpRef.current);
          setCombo(0);
          setToast({
            id: Date.now() + Math.random(),
            text: `${threat.template.failToast} (-${dmg} vida)`,
            tone: 'bad',
          });

          if (hpRef.current <= 0) {
            soundEngine.playCrack();
            threatsRef.current = [];
            setActiveThreats([]);
            triggerEndGame(0);
            return;
          } else {
            soundEngine.playDamage();
          }
        } else {
          surviving.push({ ...threat, remainingMs: nextRem });
        }
      }

      if (damagedNow) {
        const urgentPool = bundle.urgentChats;
        const urgentLine = urgentPool[Math.floor(Math.random() * urgentPool.length)];
        pushChatSequence([{ sender: 'owner', text: urgentLine, delayMs: 250 }]);
      }

      // 3. Spawn new threats
      spawnCooldownRef.current -= TICK_MS;
      if (spawnCooldownRef.current <= 0 && surviving.length < difficulty.maxConcurrent) {
        const activeKinds = new Set(surviving.map((t) => t.template.kind));
        const candidates = bundle.threats.filter((t) => !activeKinds.has(t.kind));
        const pool = candidates.length > 0 ? candidates : bundle.threats;
        const picked = pool[Math.floor(Math.random() * pool.length)];

        // Slight speed-up near the end of the round
        const progressRatio = 1 - timeLeftRef.current / totalMs;
        const speedFactor = 1 - progressRatio * 0.18;
        const threatDuration = Math.max(2400, Math.round(picked.timeoutMs * speedFactor));

        const newThreat: ActiveThreat = {
          instanceId: `${picked.kind}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          template: picked,
          tapsDone: 0,
          tapsRequired:
            difficulty.id === 'calminho'
              ? Math.max(1, picked.tapsNeeded - 1)
              : difficulty.id === 'caos'
                ? picked.tapsNeeded + 1
                : picked.tapsNeeded,
          remainingMs: threatDuration,
          totalMs: threatDuration,
        };

        surviving.push(newThreat);
        soundEngine.playAlert(picked.kind);

        // Trigger funny contextual WhatsApp script if available
        if (picked.whatsappTrigger && lastTriggeredThreatChatRef.current !== picked.kind) {
          lastTriggeredThreatChatRef.current = picked.kind;
          const seq: Array<{ sender: 'owner' | 'rebeca'; text: string; delayMs: number }> = [
            { sender: 'owner', text: picked.whatsappTrigger.ownerMsg, delayMs: 400 },
          ];
          if (picked.whatsappTrigger.rebecaReply) {
            seq.push({ sender: 'rebeca', text: picked.whatsappTrigger.rebecaReply, delayMs: 1300 });
          }
          if (picked.whatsappTrigger.ownerFollowUp) {
            seq.push({ sender: 'owner', text: picked.whatsappTrigger.ownerFollowUp, delayMs: 2200 });
          }
          pushChatSequence(seq);
        }

        const nextInterval = Math.max(1150, Math.round(difficulty.spawnIntervalMs * speedFactor));
        spawnCooldownRef.current = nextInterval;
      }

      // 4. Ambient funny chats
      ambientCooldownRef.current -= TICK_MS;
      if (ambientCooldownRef.current <= 0) {
        const script = bundle.ambientChats[Math.floor(Math.random() * bundle.ambientChats.length)];
        if (script && script.length > 0) {
          pushChatSequence(
            script.map((line, i) => ({
              sender: line.sender,
              text: line.text,
              delayMs: 350 + i * 1100,
            }))
          );
        }
        ambientCooldownRef.current = 11000;
      }

      threatsRef.current = surviving;
      setActiveThreats(surviving);
    }, TICK_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [bundle, difficulty, isPaused, pushChatSequence, totalMs, triggerEndGame]);

  // Clean up queued chat timeouts on unmount
  useEffect(() => {
    return () => {
      chatTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const handleThreatTap = useCallback(
    (instanceId: string) => {
      if (isPaused || finishedRef.current) return;

      const idx = threatsRef.current.findIndex((t) => t.instanceId === instanceId);
      if (idx === -1) return;

      const target = threatsRef.current[idx];
      const nextTaps = target.tapsDone + 1;

      if (nextTaps >= target.tapsRequired) {
        // Defeated!
        threatsRef.current = threatsRef.current.filter((t) => t.instanceId !== instanceId);
        setActiveThreats([...threatsRef.current]);

        defendedRef.current += 1;
        comboRef.current += 1;
        if (comboRef.current > maxComboRef.current) {
          maxComboRef.current = comboRef.current;
          setMaxCombo(maxComboRef.current);
        }

        const comboBonus = 1 + Math.min(comboRef.current - 1, 5) * 0.15;
        const gained = Math.round(target.template.points * difficulty.scoreMultiplier * comboBonus);
        scoreRef.current += gained;

        setEventsDefended(defendedRef.current);
        setCombo(comboRef.current);
        setScore(scoreRef.current);
        soundEngine.playSuccess();

        setToast({
          id: Date.now(),
          text: `${target.template.successToast} (+${gained} pts)`,
          tone: 'good',
        });

        if (target.template.kind === 'rain') {
          setShieldActive(true);
          window.setTimeout(() => setShieldActive(false), 1600);
        }

        setHeroicMoment(true);
        window.setTimeout(() => setHeroicMoment(false), 900);
      } else {
        soundEngine.playClick();
        const updated = [...threatsRef.current];
        updated[idx] = { ...target, tapsDone: nextTaps };
        threatsRef.current = updated;
        setActiveThreats(updated);
      }
    },
    [difficulty.scoreMultiplier, isPaused]
  );

  const handlePetEgg = useCallback(() => {
    if (isPaused || finishedRef.current) return;

    // If egg is falling, tapping the egg directly catches it!
    const fallingThreat = threatsRef.current.find((t) => t.template.kind === 'falling');
    if (fallingThreat) {
      handleThreatTap(fallingThreat.instanceId);
      return;
    }

    soundEngine.playPet();
    scoreRef.current += 5;
    setScore(scoreRef.current);

    const heartId = Date.now() + Math.random();
    const xOffset = Math.round((Math.random() - 0.5) * 60);
    setHearts((prev) => [...prev.slice(-6), { id: heartId, xOffset }]);
    window.setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h.id !== heartId));
    }, 850);
  }, [handleThreatTap, isPaused]);

  const currentMood: EggMood = useMemo(() => {
    if (hp <= 0) return 'cracked';
    if (activeThreats.length > 0) {
      return activeThreats[0].template.eggMood;
    }
    if (heroicMoment) return 'heroic';
    return 'happy';
  }, [activeThreats, heroicMoment, hp]);

  const isRaining = activeThreats.some((t) => t.template.kind === 'rain');

  const hpStatusLabel =
    hp >= 75 ? 'Intacto' : hp >= 45 ? 'Arranhado' : hp > 0 ? 'Por um fio!' : 'Quebrado';
  const hpBarColor =
    hp >= 65 ? 'bg-[#10B981]' : hp >= 35 ? 'bg-[#F59E0B]' : 'bg-[#F43F5E]';

  const secondsLeft = Math.ceil(timeLeftMs / 1000);
  const minsLeft = Math.floor(secondsLeft / 60);
  const secsRemainder = secondsLeft % 60;
  const formattedClock = `${String(minsLeft).padStart(2, '0')}:${String(secsRemainder).padStart(2, '0')}`;

  return (
    <div className="min-h-screen w-full bg-[#FFFDF7] text-[#241F31] flex flex-col">
      {/* Compact Top Game HUD */}
      <header className="w-full border-b-2 border-[#241F31] bg-white px-3 sm:px-6 py-2.5">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Brand & Difficulty */}
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-display text-base sm:text-lg font-extrabold text-[#241F31] whitespace-nowrap">
              Ovo da Rebeca
            </span>
            <span className="hidden sm:inline text-xs font-semibold text-[#6B5E7A] whitespace-nowrap">
              · {difficulty.name}
            </span>
          </div>

          {/* Live Telemetry Meters */}
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-1.5">
              <Timer className="w-4 h-4 text-[#6366F1]" aria-hidden="true" />
              <span className="font-mono-nums text-base sm:text-lg font-bold text-[#241F31]">
                {formattedClock}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[#F59E0B]" aria-hidden="true" />
              <span className="font-mono-nums text-base sm:text-lg font-bold text-[#241F31]">
                {score}
              </span>
              {combo >= 2 && (
                <span className="text-xs font-extrabold text-[#E11D48] font-mono-nums">
                  {combo}x
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onToggleMute}
                aria-label={muted ? 'Ativar som' : 'Silenciar som'}
                className="min-w-[40px] min-h-[40px] rounded-xl border-2 border-[#241F31] bg-[#FFF9EE] flex items-center justify-center hover:bg-[#FDE8C8] cursor-pointer"
              >
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => setIsPaused((p) => !p)}
                aria-label={isPaused ? 'Retomar jogo' : 'Pausar jogo'}
                className="min-w-[40px] min-h-[40px] rounded-xl border-2 border-[#241F31] bg-[#FFF9EE] flex items-center justify-center hover:bg-[#FDE8C8] cursor-pointer"
              >
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Egg Health Bar Row (non-hue-only: explicit count + status text) */}
        <div className="max-w-6xl mx-auto mt-2.5 flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#241F31] whitespace-nowrap shrink-0">
            <Heart className="w-4 h-4 text-[#FF6B8B] fill-[#FF6B8B]" aria-hidden="true" />
            <span>Vida do Ovo:</span>
            <span className="font-mono-nums">{hp}/100</span>
            <span className="text-[#6B5E7A] font-semibold">· {hpStatusLabel}</span>
          </div>
          <div className="flex-1 h-3.5 rounded-full bg-[#F3F0FA] border-2 border-[#241F31] overflow-hidden">
            <div
              className={`h-full transition-all duration-200 ${hpBarColor}`}
              style={{ width: `${Math.max(0, hp)}%` }}
            />
          </div>
        </div>
      </header>

      {/* Main Playable Arena + WhatsApp Sidebar */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Mobile WhatsApp Live Strip (compact, non-blocking) */}
        <div className="lg:hidden">
          <WhatsAppFeed messages={messages} isTyping={isTyping} />
        </div>

        {/* Center Game Stage */}
        <section className="lg:col-span-8 flex flex-col gap-4">
          {/* Illustrated Nest Arena */}
          <div className="relative indie-card rounded-3xl overflow-hidden min-h-[340px] sm:min-h-[390px] flex flex-col items-center justify-between p-4 sm:p-6 bg-[#EBF5EE]">
            {/* Background Illustrated Clearing */}
            {!bgError ? (
              <img
                src="/src/assets/images/arena_cozy_nest_1795480735441.jpg"
                alt="Ninho aconchegante no gramado"
                referrerPolicy="no-referrer"
                onError={() => setBgError(true)}
                className="absolute inset-0 w-full h-full object-cover opacity-55 pointer-events-none"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-b from-[#E0F2FE] via-[#ECFDF5] to-[#FEF3C7] pointer-events-none" />
            )}

            {/* Soft contrast scrim so egg & threats pop clearly */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/45 via-transparent to-white/60 pointer-events-none" />

            {/* Top Arena Feedback Toast */}
            <div className="relative z-10 w-full flex justify-center">
              <div
                key={toast.id}
                className={`px-4 py-2 rounded-2xl border-2 border-[#241F31] text-xs sm:text-sm font-bold text-center shadow-[0_2px_0_#241F31] max-w-md ${
                  toast.tone === 'bad'
                    ? 'bg-[#FFE4E8] text-[#9F1239]'
                    : toast.tone === 'good'
                      ? 'bg-[#ECFDF5] text-[#065F46]'
                      : 'bg-white text-[#241F31]'
                }`}
              >
                {toast.text}
              </div>
            </div>

            {/* Center Stage: Threats Flanking + Expressive Egg */}
            <div className="relative z-10 flex items-center justify-center w-full my-2">
              {/* Floating hearts from petting */}
              <div className="relative flex items-center justify-center">
                {hearts.map((h) => (
                  <span
                    key={h.id}
                    className="absolute -top-4 pointer-events-none z-30"
                    style={{ transform: `translateX(${h.xOffset}px)` }}
                  >
                    <span className="inline-block text-2xl animate-heart-pop">❤️</span>
                  </span>
                ))}

                <EggCharacter
                  hp={hp}
                  mood={currentMood}
                  isRaining={isRaining}
                  isShielded={shieldActive}
                  onPet={handlePetEgg}
                />
              </div>
            </div>

            {/* Active Threat Sprites Strip inside Arena */}
            <div className="relative z-10 w-full flex flex-wrap items-center justify-center gap-3 min-h-[84px]">
              {activeThreats.length === 0 ? (
                <div className="text-xs sm:text-sm font-semibold text-[#3B334B] bg-white/85 px-4 py-2 rounded-xl border border-[#241F31]/20">
                  Tudo calmo por 1 segundo... Clique no ovo para fazer carinho (+5 pts)
                </div>
              ) : (
                activeThreats.map((threat) => {
                  const pct = Math.max(0, Math.round((threat.remainingMs / threat.totalMs) * 100));
                  return (
                    <button
                      key={threat.instanceId}
                      type="button"
                      onClick={() => handleThreatTap(threat.instanceId)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-white/95 border-2 border-[#241F31] shadow-[0_3px_0_#241F31] cursor-pointer active:scale-95 transition-transform"
                    >
                      <ThreatCharacter kind={threat.template.kind} />
                      <div className="text-left max-w-[160px]">
                        <div className="font-display text-xs sm:text-sm font-extrabold text-[#E11D48] leading-tight">
                          {threat.template.title}
                        </div>
                        <div className="mt-1.5 h-2 w-28 rounded-full bg-slate-200 border border-[#241F31] overflow-hidden">
                          <div
                            className={`h-full ${pct < 35 ? 'bg-[#F43F5E]' : 'bg-[#F59E0B]'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Pause Overlay */}
            {isPaused && (
              <div className="absolute inset-0 z-30 bg-[#241F31]/65 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="indie-card rounded-3xl p-6 max-w-sm w-full text-center space-y-4">
                  <h2 className="font-display text-2xl font-extrabold text-[#241F31]">
                    Jogo Pausado 🥚
                  </h2>
                  <p className="text-sm text-[#524863]">
                    Respira fundo, Rebeca! O ovo tá esperando você voltar.
                  </p>
                  <div className="flex flex-col gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsPaused(false)}
                      className="min-h-[48px] px-5 py-3 rounded-xl bg-[#10B981] text-white font-display font-extrabold indie-btn cursor-pointer"
                    >
                      Continuar Protegendo!
                    </button>
                    <button
                      type="button"
                      onClick={onAbortToStory}
                      className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#F3F0FA] text-[#241F31] font-semibold indie-btn flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Voltar ao Início</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Thumb-Zone Action Deck (Huge Interactive Buttons for Mobile & Desktop) */}
          <div className="space-y-3">
            {activeThreats.length === 0 ? (
              <div className="indie-card-soft rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6 text-[#10B981] shrink-0" />
                  <div>
                    <div className="font-display font-bold text-sm sm:text-base text-[#241F31]">
                      Guarda da Rebeca Ativa
                    </div>
                    <div className="text-xs text-[#524863]">
                      Os botões de emergência aparecem aqui assim que surgir um perigo!
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handlePetEgg}
                  className="min-h-[48px] px-4 py-2 rounded-xl bg-[#FFE4E8] hover:bg-[#FECDD3] text-[#241F31] font-display font-bold text-sm indie-btn shrink-0 cursor-pointer whitespace-nowrap"
                >
                  Fazer Carinho ❤️
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeThreats.map((threat) => {
                  const pct = Math.max(0, Math.round((threat.remainingMs / threat.totalMs) * 100));
                  const tapsLeft = threat.tapsRequired - threat.tapsDone;
                  return (
                    <button
                      key={threat.instanceId}
                      type="button"
                      onClick={() => handleThreatTap(threat.instanceId)}
                      className="min-h-[76px] p-4 rounded-2xl bg-[#FF6B8B] hover:bg-[#FF5579] text-white indie-btn text-left flex flex-col justify-between gap-2 cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2 w-full">
                        <span className="font-display text-lg sm:text-xl font-extrabold tracking-tight leading-none">
                          {threat.template.emoji} {threat.template.actionLabel}
                        </span>
                        <span className="font-mono-nums text-xs font-extrabold bg-[#241F31] text-white px-2.5 py-1 rounded-lg shrink-0">
                          {tapsLeft === 1 ? '1 clique!' : `${tapsLeft} cliques`}
                        </span>
                      </div>
                      <div className="text-xs text-rose-50 font-medium leading-snug">
                        {threat.template.description}
                      </div>
                      <div className="w-full h-2 rounded-full bg-black/20 overflow-hidden">
                        <div
                          className="h-full bg-[#FDE047] transition-[width] duration-75"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Desktop Live WhatsApp Conversation Column */}
        <div className="hidden lg:block lg:col-span-4">
          <WhatsAppFeed messages={messages} isTyping={isTyping} />
        </div>
      </main>
    </div>
  );
}
