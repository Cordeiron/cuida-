import { useState } from 'react';
import { Award, Play, ShieldAlert, Trophy, Volume2, VolumeX } from 'lucide-react';
import type { DifficultyConfig, DifficultyId, GameBundle } from '../types/game';
import { soundEngine } from '../utils/soundEngine';

interface StoryScreenProps {
  bundle: GameBundle;
  selectedDifficulty: DifficultyId;
  onSelectDifficulty: (id: DifficultyId) => void;
  onStartGame: () => void;
  claimedNotice: boolean;
  muted: boolean;
  onToggleMute: () => void;
}

const DIFFICULTY_ACCENTS: Record<DifficultyId, string> = {
  calminho: 'bg-[#ECFDF5] border-[#10B981] text-[#065F46]',
  normal: 'bg-[#FEF3C7] border-[#F59E0B] text-[#78350F]',
  caos: 'bg-[#FFE4E8] border-[#F43F5E] text-[#881337]',
};

const ENDING_LABELS: Record<string, string> = {
  legendary: 'Final Lendário',
  perfect: 'Final Perfeito',
  chaotic: 'Final Caótico',
  tragic: 'Final Trágico',
};

export function StoryScreen({
  bundle,
  selectedDifficulty,
  onSelectDifficulty,
  onStartGame,
  claimedNotice,
  muted,
  onToggleMute,
}: StoryScreenProps) {
  const [choiceMade, setChoiceMade] = useState<'accept' | 'hesitate' | null>(null);
  const [avatarError, setAvatarError] = useState(false);

  function handleChoice(choice: 'accept' | 'hesitate') {
    soundEngine.playPop();
    setChoiceMade(choice);
  }

  function handleDifficultyPick(diff: DifficultyConfig) {
    soundEngine.playClick();
    onSelectDifficulty(diff.id);
  }

  return (
    <div className="min-h-screen w-full bg-[#FFFDF7] text-[#241F31]">
      {/* Clean 3-zone Top Header */}
      <header className="max-w-6xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between gap-8 border-b-2 border-[#241F31]/10">
        <span className="font-display text-lg sm:text-xl font-extrabold tracking-tight text-[#241F31] whitespace-nowrap shrink-0">
          Rebeca, Cuida do Meu Ovo!
        </span>

        <div className="hidden md:flex items-center gap-4 text-sm font-medium text-[#524863]">
          <span className="whitespace-nowrap">Recorde: <strong className="font-mono-nums text-[#241F31]">{bundle.scores.bestScore}</strong></span>
          <span aria-hidden="true">·</span>
          <span className="whitespace-nowrap">Missões: <strong className="font-mono-nums text-[#241F31]">{bundle.scores.totalRuns}</strong></span>
        </div>

        <button
          type="button"
          onClick={onToggleMute}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-white indie-btn text-sm font-semibold text-[#241F31] flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          <span>{muted ? 'Som Desligado' : 'Som Ligado'}</span>
        </button>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-10 space-y-8">
        {claimedNotice && (
          <div className="p-4 rounded-2xl bg-[#ECFDF5] border-2 border-[#241F31] text-sm font-medium text-[#065F46]">
            Senha secreta salva com segurança no servidor! Agora só a <strong>Rebeca</strong> consegue abrir este desafio.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          {/* Left Column: Mission Story Card */}
          <section className="lg:col-span-7 indie-card rounded-3xl p-6 sm:p-8 flex flex-col justify-between bg-white">
            <div>
              <div className="flex items-center gap-4 mb-6">
                {!avatarError ? (
                  <img
                    src="/src/assets/images/rebeca_owner_avatar_1795480737013.jpg"
                    alt="Dono preocupado segurando o celular"
                    referrerPolicy="no-referrer"
                    onError={() => setAvatarError(true)}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-[#241F31] shadow-[0_3px_0_#241F31] shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#FFE4E8] border-2 border-[#241F31] flex items-center justify-center text-3xl shrink-0">
                    😰
                  </div>
                )}
                <div>
                  <div className="text-xs font-semibold text-[#6B5E7A] mb-1">
                    Mensagem Urgente para Rebeca · Agora mesmo
                  </div>
                  <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#241F31] leading-tight text-balance">
                    {bundle.story.headline}
                  </h1>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#FFF7EB] border-2 border-[#241F31] mb-6">
                <p className="text-lg sm:text-xl font-semibold text-[#241F31] leading-relaxed">
                  &ldquo;{bundle.story.subheadline}&rdquo;
                </p>
              </div>

              {!choiceMade ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <button
                    type="button"
                    onClick={() => handleChoice('accept')}
                    className="min-h-[56px] px-5 py-3.5 rounded-2xl bg-[#FF6B8B] hover:bg-[#FF5579] text-white font-display text-lg font-extrabold indie-btn cursor-pointer"
                  >
                    {bundle.story.acceptLabel}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChoice('hesitate')}
                    className="min-h-[56px] px-5 py-3.5 rounded-2xl bg-[#F3F0FA] hover:bg-[#E7E0F7] text-[#241F31] font-display text-base font-bold indie-btn cursor-pointer"
                  >
                    {bundle.story.hesitateLabel}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-5 rounded-2xl bg-[#ECFDF5] border-2 border-[#241F31]">
                    <div className="text-xs font-bold text-[#047857] mb-1">
                      Resposta do Dono do Ovo · Online
                    </div>
                    <p className="text-base sm:text-lg font-semibold text-[#241F31]">
                      {choiceMade === 'accept' ? bundle.story.acceptReply : bundle.story.hesitateReply}
                    </p>
                  </div>

                  {/* Difficulty Selection */}
                  <div>
                    <h2 className="font-display text-lg font-extrabold text-[#241F31] mb-3">
                      Escolha o nível de sufoco, Rebeca:
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {bundle.difficulties.map((diff) => {
                        const active = selectedDifficulty === diff.id;
                        return (
                          <button
                            key={diff.id}
                            type="button"
                            onClick={() => handleDifficultyPick(diff)}
                            className={`p-3.5 rounded-2xl border-2 text-left transition-transform cursor-pointer ${
                              active
                                ? `${DIFFICULTY_ACCENTS[diff.id]} shadow-[0_3px_0_#241F31] -translate-y-0.5`
                                : 'bg-white border-[#241F31]/25 hover:border-[#241F31] text-[#241F31]'
                            }`}
                          >
                            <div className="font-display font-extrabold text-base mb-1">{diff.name}</div>
                            <div className="text-xs opacity-90 leading-snug">{diff.subtitle}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      onStartGame();
                    }}
                    className="w-full min-h-[60px] px-6 py-4 rounded-2xl bg-[#10B981] hover:bg-[#059669] text-white font-display text-xl font-extrabold indie-btn flex items-center justify-center gap-3 cursor-pointer"
                  >
                    <Play className="w-6 h-6 fill-current" />
                    <span>COMEÇAR MISSÃO DA REBECA! 🥚</span>
                  </button>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-[#241F31]/10 flex flex-wrap items-center gap-3 text-xs text-[#6B5E7A]">
              <span className="flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-[#F59E0B]" />
                <span>Clique rápido nos perigos antes que o ovo rache</span>
              </span>
              <span aria-hidden="true">·</span>
              <span>Faça carinho no ovo para ganhar pontos extras</span>
            </div>
          </section>

          {/* Right Column: Rebeca's Saved Score History */}
          <aside className="lg:col-span-5 indie-card-soft rounded-3xl p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display text-xl font-extrabold text-[#241F31] flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-[#F59E0B]" />
                  <span>Histórico da Rebeca</span>
                </h2>
                <span className="text-xs font-semibold text-[#6B5E7A]">Salvo no servidor</span>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="p-3 rounded-2xl bg-white border-2 border-[#241F31]">
                  <div className="text-xs text-[#6B5E7A] mb-0.5">Recorde</div>
                  <div className="font-mono-nums text-xl font-bold text-[#241F31]">{bundle.scores.bestScore}</div>
                </div>
                <div className="p-3 rounded-2xl bg-white border-2 border-[#241F31]">
                  <div className="text-xs text-[#6B5E7A] mb-0.5">Partidas</div>
                  <div className="font-mono-nums text-xl font-bold text-[#241F31]">{bundle.scores.totalRuns}</div>
                </div>
                <div className="p-3 rounded-2xl bg-white border-2 border-[#241F31]">
                  <div className="text-xs text-[#6B5E7A] mb-0.5">Lendários</div>
                  <div className="font-mono-nums text-xl font-bold text-[#F59E0B]">{bundle.scores.legendaryCount}</div>
                </div>
              </div>

              {bundle.scores.history.length === 0 ? (
                <div className="p-6 rounded-2xl bg-white/80 border-2 border-dashed border-[#241F31]/25 text-center text-sm text-[#524863]">
                  Nenhuma missão registrada ainda, Rebeca! Aceite o desafio ao lado para estrear o placar.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {bundle.scores.history.slice(0, 6).map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-white border border-[#241F31]/20 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-[#241F31] truncate">
                          {ENDING_LABELS[item.ending] || item.ending}
                        </div>
                        <div className="text-xs text-[#6B5E7A]">
                          {item.difficulty} · {item.hpRemaining}% vida · {item.eventsDefended} defesas
                        </div>
                      </div>
                      <div className="font-mono-nums text-base font-bold text-[#241F31] shrink-0 flex items-center gap-1">
                        <Award className="w-4 h-4 text-[#F59E0B]" />
                        <span>{item.score}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 text-xs text-[#6B5E7A]">
              Dica: Termine com 90%+ de vida e combo alto para desbloquear o <strong>Final Lendário</strong>!
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
