import { useState } from 'react';
import { Award, CheckCircle2, RotateCcw, SlidersHorizontal, Trophy } from 'lucide-react';
import type { EndingDefinition, GameBundle, ScoreStats } from '../types/game';
import { soundEngine } from '../utils/soundEngine';
import { EggCharacter } from './EggCharacter';
import type { GameResultPayload } from './GameArena';

interface ResultScreenProps {
  bundle: GameBundle;
  result: GameResultPayload;
  scores: ScoreStats;
  saving: boolean;
  saveError: string | null;
  onPlayAgain: () => void;
  onBackToStory: () => void;
}

const ENDING_BG: Record<EndingDefinition['id'], string> = {
  legendary: 'bg-[#FEF3C7]',
  perfect: 'bg-[#ECFDF5]',
  chaotic: 'bg-[#FFF7EB]',
  tragic: 'bg-[#FFE4E8]',
};

export function ResultScreen({
  bundle,
  result,
  scores,
  saving,
  saveError,
  onPlayAgain,
  onBackToStory,
}: ResultScreenProps) {
  const [trophyError, setTrophyError] = useState(false);
  const ending = bundle.endings[result.ending];
  const isTragic = result.ending === 'tragic';
  const isLegendary = result.ending === 'legendary';

  return (
    <div
      className={`min-h-screen w-full py-8 px-4 sm:px-8 flex items-center justify-center ${
        isTragic ? 'bg-[#2A1B24] text-[#FFFDF7]' : 'bg-[#FFFDF7] text-[#241F31]'
      }`}
    >
      <div className="w-full max-w-4xl space-y-6">
        <div
          className={`indie-card rounded-3xl p-6 sm:p-10 text-[#241F31] ${
            isTragic ? 'bg-[#FFF5F7]' : 'bg-white'
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Visual Mascot / Trophy / Broken Egg */}
            <div className="md:col-span-5 flex flex-col items-center justify-center">
              <div
                className={`w-full max-w-[260px] aspect-square rounded-3xl border-2 border-[#241F31] shadow-[0_4px_0_#241F31] flex items-center justify-center overflow-hidden p-4 ${ENDING_BG[result.ending]}`}
              >
                {isLegendary && !trophyError ? (
                  <img
                    src="/src/assets/images/trophy_legendary_egg_1795480736160.jpg"
                    alt="Ovo Lendário com Coroa Dourada"
                    referrerPolicy="no-referrer"
                    onError={() => setTrophyError(true)}
                    className="w-full h-full object-cover rounded-2xl"
                  />
                ) : (
                  <EggCharacter
                    hp={result.hpRemaining}
                    mood={
                      isTragic
                        ? 'cracked'
                        : result.ending === 'chaotic'
                          ? 'nervous'
                          : 'heroic'
                    }
                    size="lg"
                  />
                )}
              </div>
            </div>

            {/* Ending Narrative & Metrics */}
            <div className="md:col-span-7 space-y-4">
              <div className="text-xs font-extrabold tracking-wide text-[#6B5E7A]">
                {ending.badge} · Resultado da Rebeca
              </div>

              <h1
                className={`font-display text-3xl sm:text-4xl font-extrabold leading-tight text-balance ${
                  isTragic ? 'text-[#BE123C]' : 'text-[#241F31]'
                }`}
              >
                {ending.title}
              </h1>

              <p className="text-base text-[#423852] leading-relaxed">{ending.subtitle}</p>

              <div className="p-4 rounded-2xl bg-[#F3F0FA] border-2 border-[#241F31] text-sm font-semibold text-[#241F31]">
                <div className="text-xs font-bold text-[#6B5E7A] mb-1">Mensagem do Dono do Ovo:</div>
                &ldquo;{ending.ownerQuote}&rdquo;
              </div>

              {/* Tabular Run Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-[#FFF9EE] border-2 border-[#241F31]">
                  <div className="text-xs text-[#6B5E7A]">Pontuação</div>
                  <div className="font-mono-nums text-xl font-bold text-[#241F31]">{result.score}</div>
                </div>
                <div className="p-3 rounded-xl bg-[#FFF9EE] border-2 border-[#241F31]">
                  <div className="text-xs text-[#6B5E7A]">Vida Final</div>
                  <div className="font-mono-nums text-xl font-bold text-[#241F31]">{result.hpRemaining}%</div>
                </div>
                <div className="p-3 rounded-xl bg-[#FFF9EE] border-2 border-[#241F31]">
                  <div className="text-xs text-[#6B5E7A]">Defesas</div>
                  <div className="font-mono-nums text-xl font-bold text-[#241F31]">{result.eventsDefended}</div>
                </div>
                <div className="p-3 rounded-xl bg-[#FFF9EE] border-2 border-[#241F31]">
                  <div className="text-xs text-[#6B5E7A]">Max Combo</div>
                  <div className="font-mono-nums text-xl font-bold text-[#241F31]">{result.maxCombo}x</div>
                </div>
              </div>

              {/* Save status */}
              <div className="text-xs font-semibold flex items-center gap-1.5 text-[#524863]">
                {saving ? (
                  <span>Salvando pontuação da Rebeca...</span>
                ) : saveError ? (
                  <span className="text-[#E11D48]">{saveError}</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                    <span>Pontuação salva! Recorde pessoal da Rebeca: <strong className="font-mono-nums">{scores.bestScore}</strong></span>
                  </>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    onPlayAgain();
                  }}
                  className="flex-1 min-h-[54px] px-5 py-3 rounded-2xl bg-[#FF6B8B] hover:bg-[#FF5579] text-white font-display text-lg font-extrabold indie-btn flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span>{isTragic ? 'Tentar Redimir a Rebeca!' : 'Jogar Novamente!'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    onBackToStory();
                  }}
                  className="min-h-[54px] px-5 py-3 rounded-2xl bg-[#F3F0FA] hover:bg-[#E7E0F7] text-[#241F31] font-display text-base font-bold indie-btn flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Mudar Dificuldade</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Compact Recent Scores Table */}
        <div className="indie-card rounded-3xl p-5 sm:p-6 bg-white text-[#241F31]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-extrabold flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#F59E0B]" />
              <span>Melhores Tentativas da Rebeca</span>
            </h2>
            <span className="text-xs font-semibold text-[#6B5E7A] font-mono-nums">
              {scores.totalRuns} partidas registradas
            </span>
          </div>

          {scores.history.length === 0 ? (
            <div className="p-4 rounded-2xl bg-[#FFF9EE] border border-dashed border-[#241F31]/25 text-sm text-[#524863] text-center">
              Nenhuma partida anterior salva ainda.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {scores.history.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-[#FFF9EE] border border-[#241F31]/20 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-bold truncate">{bundle.endings[item.ending]?.badge || item.ending}</div>
                    <div className="text-xs text-[#6B5E7A]">
                      {item.difficulty} · {item.hpRemaining}% vida
                    </div>
                  </div>
                  <div className="font-mono-nums font-bold text-base flex items-center gap-1 shrink-0">
                    <Award className="w-4 h-4 text-[#F59E0B]" />
                    <span>{item.score}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
