import { useCallback, useEffect, useState } from 'react';
import { GateScreen } from './components/GateScreen';
import { GameArena, type GameResultPayload } from './components/GameArena';
import { ResultScreen } from './components/ResultScreen';
import { StoryScreen } from './components/StoryScreen';
import type { DifficultyId, GameBundle, ScoreStats } from './types/game';
import { soundEngine } from './utils/soundEngine';

type AppStage = 'LOADING_AUTH' | 'GATE' | 'LOADING_BUNDLE' | 'STORY' | 'PLAYING' | 'RESULT';

export default function App() {
  const [stage, setStage] = useState<AppStage>('LOADING_AUTH');
  const [configured, setConfigured] = useState(true);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [claimedNotice, setClaimedNotice] = useState(false);

  const [bundle, setBundle] = useState<GameBundle | null>(null);
  const [bundleError, setBundleError] = useState<string | null>(null);

  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyId>('normal');
  const [lastResult, setLastResult] = useState<GameResultPayload | null>(null);
  const [scores, setScores] = useState<ScoreStats | null>(null);
  const [savingScore, setSavingScore] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [gameKey, setGameKey] = useState(0);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/auth/status')
      .then((res) => res.json())
      .then((data: { configured?: boolean }) => {
        if (!active) return;
        setConfigured(Boolean(data.configured));
        setStage('GATE');
      })
      .catch(() => {
        if (!active) return;
        setConfigured(false);
        setStage('GATE');
      });
    return () => {
      active = false;
    };
  }, []);

  const loadProtectedBundle = useCallback(async (token: string) => {
    setStage('LOADING_BUNDLE');
    setBundleError(null);
    try {
      const res = await fetch('/api/game/bundle', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setAuthToken(null);
        setStage('GATE');
        return;
      }
      const data = (await res.json()) as GameBundle;
      setBundle(data);
      setScores(data.scores);
      setStage('STORY');
    } catch {
      setBundleError('Não foi possível carregar os dados do desafio.');
      setStage('GATE');
    }
  }, []);

  const handleUnlocked = useCallback(
    (token: string, claimedNow: boolean) => {
      setAuthToken(token);
      setClaimedNotice(claimedNow);
      void loadProtectedBundle(token);
    },
    [loadProtectedBundle]
  );

  const handleToggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      soundEngine.setMuted(next);
      return next;
    });
  }, []);

  const handleStartGame = useCallback(() => {
    setGameKey((k) => k + 1);
    setStage('PLAYING');
  }, []);

  const handleFinishGame = useCallback(
    async (result: GameResultPayload) => {
      setLastResult(result);
      setStage('RESULT');
      setSaveError(null);

      if (!authToken) return;
      setSavingScore(true);
      try {
        const res = await fetch('/api/scores', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(result),
        });
        if (!res.ok) {
          setSaveError('Não foi possível salvar a pontuação no servidor.');
          return;
        }
        const data = (await res.json()) as { stats: ScoreStats };
        setScores(data.stats);
        setBundle((prev) => (prev ? { ...prev, scores: data.stats } : prev));
      } catch {
        setSaveError('Erro de rede ao salvar a pontuação.');
      } finally {
        setSavingScore(false);
      }
    },
    [authToken]
  );

  if (stage === 'LOADING_AUTH' || stage === 'LOADING_BUNDLE') {
    return (
      <div className="min-h-screen w-full bg-[#FFFDF7] flex items-center justify-center p-6">
        <div className="indie-card rounded-3xl px-8 py-6 text-center">
          <div className="text-4xl mb-2 animate-egg-float">🥚</div>
          <p className="font-display font-bold text-lg text-[#241F31]">
            {stage === 'LOADING_AUTH' ? 'Verificando exclusividade...' : 'Preparando o ovo da Rebeca...'}
          </p>
        </div>
      </div>
    );
  }

  if (stage === 'GATE' || !authToken || !bundle) {
    return (
      <div>
        {bundleError && (
          <div className="max-w-lg mx-auto mt-4 px-4">
            <div className="p-3 rounded-xl bg-[#FFE4E8] border-2 border-[#E11D48] text-sm font-semibold text-[#9F1239] text-center">
              {bundleError}
            </div>
          </div>
        )}
        <GateScreen configured={configured} onUnlocked={handleUnlocked} />
      </div>
    );
  }

  const activeDifficulty =
    bundle.difficulties.find((d) => d.id === selectedDifficulty) || bundle.difficulties[1];

  if (stage === 'STORY') {
    return (
      <StoryScreen
        bundle={bundle}
        selectedDifficulty={selectedDifficulty}
        onSelectDifficulty={setSelectedDifficulty}
        onStartGame={handleStartGame}
        claimedNotice={claimedNotice}
        muted={muted}
        onToggleMute={handleToggleMute}
      />
    );
  }

  if (stage === 'PLAYING') {
    return (
      <GameArena
        key={gameKey}
        bundle={bundle}
        difficulty={activeDifficulty}
        muted={muted}
        onToggleMute={handleToggleMute}
        onFinish={handleFinishGame}
        onAbortToStory={() => setStage('STORY')}
      />
    );
  }

  if (stage === 'RESULT' && lastResult && scores) {
    return (
      <ResultScreen
        bundle={bundle}
        result={lastResult}
        scores={scores}
        saving={savingScore}
        saveError={saveError}
        onPlayAgain={handleStartGame}
        onBackToStory={() => setStage('STORY')}
      />
    );
  }

  return null;
}
