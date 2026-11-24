import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';

interface GateScreenProps {
  configured: boolean;
  onUnlocked: (token: string, claimedNow: boolean) => void;
}

export function GateScreen({ configured, onUnlocked }: GateScreenProps) {
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = passcode.trim();
    if (trimmed.length < 3) {
      setError('Digite uma senha secreta com pelo menos 3 caracteres.');
      soundEngine.playDamage();
      return;
    }

    setSubmitting(true);
    soundEngine.playClick();

    try {
      const res = await fetch('/api/auth/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passcode: trimmed,
          confirmIdentity: true,
        }),
      });

      const data = (await res.json()) as {
        authenticated?: boolean;
        claimedNow?: boolean;
        token?: string;
        error?: string;
      };

      if (!res.ok || !data.authenticated || !data.token) {
        setError(data.error || 'Acesso negado! Apenas a Rebeca pode entrar.');
        soundEngine.playDamage();
        return;
      }

      soundEngine.playSuccess();
      onUnlocked(data.token, Boolean(data.claimedNow));
    } catch {
      setError('Erro de conexão com o servidor. Tente novamente.');
      soundEngine.playDamage();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#FFFDF7] flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-lg indie-card rounded-3xl p-6 sm:p-10 bg-white">
        <div className="flex flex-col items-center text-center">
          {/* Locked Exclusive Egg Emblem */}
          <div className="w-24 h-24 rounded-2xl bg-[#FFF0F3] border-2 border-[#241F31] shadow-[0_3px_0_#241F31] flex items-center justify-center mb-6">
            <svg viewBox="0 0 100 110" className="w-16 h-16" aria-hidden="true">
              <path
                d="M50 10 C72 10, 84 46, 84 70 C84 92, 69 102, 50 102 C31 102, 16 92, 16 70 C16 46, 28 10, 50 10 Z"
                fill="#FFF7EB"
                stroke="#241F31"
                strokeWidth="4"
              />
              <circle cx="40" cy="56" r="4" fill="#241F31" />
              <circle cx="60" cy="56" r="4" fill="#241F31" />
              <path d="M44 66 Q50 72 56 66" fill="none" stroke="#241F31" strokeWidth="3" strokeLinecap="round" />
              <path
                d="M50 82 C47 78, 42 79, 42 84 C42 88, 50 93, 50 93 C50 93, 58 88, 58 84 C58 79, 53 78, 50 82 Z"
                fill="#FF6B8B"
                stroke="#241F31"
                strokeWidth="2"
              />
            </svg>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-[#6B5E7A] mb-2">
            <Lock className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Acesso Exclusivo</span>
            <span aria-hidden="true">·</span>
            <span>Área Protegida</span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#241F31] tracking-tight text-balance leading-tight mb-3">
            OPA! ESSE OVO TEM DONA! 🥚
          </h1>

          <p className="text-base sm:text-lg text-[#524863] leading-relaxed mb-6 max-w-md">
            Este desafio foi preparado especialmente para a <strong className="text-[#241F31]">Rebeca</strong>.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#F7F3FF] border-2 border-[#241F31]/15 text-sm text-[#423852]">
            {configured ? (
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[#7C3AED] shrink-0 mt-0.5" aria-hidden="true" />
                <p>
                  Área trancada por senha individual. Digite sua senha secreta abaixo para comprovar que você é a{' '}
                  <strong className="text-[#241F31]">Rebeca</strong>.
                </p>
              </div>
            ) : (
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[#7C3AED] shrink-0 mt-0.5" aria-hidden="true" />
                <p>
                  <strong>Primeiro acesso:</strong> defina abaixo a senha secreta da Rebeca (mínimo 3 caracteres) para
                  trancar o jogo no servidor antes de entrar.
                </p>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="rebeca-passcode" className="block text-sm font-semibold text-[#241F31] mb-1.5">
              {configured ? 'Senha secreta da Rebeca' : 'Criar senha secreta da Rebeca'}
            </label>
            <div className="relative">
              <input
                id="rebeca-passcode"
                type={showPasscode ? 'text' : 'password'}
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder={configured ? 'Digite sua senha secreta...' : 'Ex: ovo2026 ou sua palavra secreta'}
                autoComplete="current-password"
                required
                minLength={3}
                maxLength={64}
                className="w-full min-h-[48px] px-4 pr-12 rounded-xl bg-white border-2 border-[#241F31] text-[#241F31] placeholder:text-[#8E83A1] focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-200 font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPasscode((prev) => !prev)}
                aria-label={showPasscode ? 'Ocultar senha' : 'Mostrar senha'}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-[#524863] hover:text-[#241F31] hover:bg-slate-100"
              >
                {showPasscode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-[#FFE4E8] border-2 border-[#E11D48] text-sm font-semibold text-[#9F1239]"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full min-h-[56px] px-6 py-3.5 rounded-2xl bg-[#FF6B8B] hover:bg-[#FF5579] text-white font-display text-lg font-extrabold tracking-wide indie-btn flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 whitespace-nowrap"
          >
            <span>{submitting ? 'Verificando...' : 'SOU A REBECA ❤️'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
