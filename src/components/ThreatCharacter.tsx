import type { ThreatKind } from '../types/game';

interface ThreatCharacterProps {
  kind: ThreatKind;
}

export function ThreatCharacter({ kind }: ThreatCharacterProps) {
  switch (kind) {
    case 'cat':
      return (
        <svg viewBox="0 0 120 120" className="w-20 h-20 sm:w-24 sm:h-24 animate-threat-bounce" aria-hidden="true">
          {/* Ears */}
          <polygon points="28,48 22,16 50,34" fill="#FDBA74" stroke="#241F31" strokeWidth="3.5" strokeLinejoin="round" />
          <polygon points="92,48 98,16 70,34" fill="#FDBA74" stroke="#241F31" strokeWidth="3.5" strokeLinejoin="round" />
          <polygon points="30,42 27,24 44,35" fill="#FDA4AF" />
          <polygon points="90,42 93,24 76,35" fill="#FDA4AF" />
          {/* Head */}
          <ellipse cx="60" cy="64" rx="38" ry="33" fill="#FED7AA" stroke="#241F31" strokeWidth="3.5" />
          {/* Mischievous eyes */}
          <circle cx="45" cy="60" r="6" fill="#241F31" />
          <circle cx="43" cy="58" r="2" fill="#FFFFFF" />
          <circle cx="75" cy="60" r="6" fill="#241F31" />
          <circle cx="73" cy="58" r="2" fill="#FFFFFF" />
          <path d="M36 49 L52 54" stroke="#241F31" strokeWidth="3" strokeLinecap="round" />
          <path d="M84 49 L68 54" stroke="#241F31" strokeWidth="3" strokeLinecap="round" />
          {/* Nose & whiskers */}
          <polygon points="56,68 64,68 60,74" fill="#FB7185" />
          <path d="M52 78 Q60 84 68 78" fill="none" stroke="#241F31" strokeWidth="3" strokeLinecap="round" />
          <line x1="16" y1="64" x2="34" y2="66" stroke="#241F31" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="16" y1="73" x2="34" y2="72" stroke="#241F31" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="104" y1="64" x2="86" y2="66" stroke="#241F31" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="104" y1="73" x2="86" y2="72" stroke="#241F31" strokeWidth="2.5" strokeLinecap="round" />
          {/* Paws */}
          <ellipse cx="42" cy="98" rx="10" ry="7" fill="#FED7AA" stroke="#241F31" strokeWidth="3" />
          <ellipse cx="78" cy="98" rx="10" ry="7" fill="#FED7AA" stroke="#241F31" strokeWidth="3" />
        </svg>
      );

    case 'dog':
      return (
        <svg viewBox="0 0 120 120" className="w-20 h-20 sm:w-24 sm:h-24 animate-threat-bounce" aria-hidden="true">
          {/* Floppy ears */}
          <ellipse cx="24" cy="58" rx="13" ry="25" transform="rotate(14 24 58)" fill="#D97706" stroke="#241F31" strokeWidth="3.5" />
          <ellipse cx="96" cy="58" rx="13" ry="25" transform="rotate(-14 96 58)" fill="#D97706" stroke="#241F31" strokeWidth="3.5" />
          {/* Head (Caramelo!) */}
          <ellipse cx="60" cy="60" rx="34" ry="33" fill="#FBBF24" stroke="#241F31" strokeWidth="3.5" />
          {/* Muzzle */}
          <ellipse cx="60" cy="74" rx="20" ry="15" fill="#FEF3C7" stroke="#241F31" strokeWidth="3" />
          <ellipse cx="60" cy="67" rx="8" ry="5" fill="#241F31" />
          {/* Happy goofy tongue */}
          <path d="M54 84 C54 98, 66 98, 66 84 Z" fill="#FB7185" stroke="#241F31" strokeWidth="2.5" />
          {/* Eyes */}
          <circle cx="46" cy="52" r="5.5" fill="#241F31" />
          <circle cx="44" cy="50" r="2" fill="#FFFFFF" />
          <circle cx="74" cy="52" r="5.5" fill="#241F31" />
          <circle cx="72" cy="50" r="2" fill="#FFFFFF" />
        </svg>
      );

    case 'rain':
      return (
        <svg viewBox="0 0 120 120" className="w-20 h-20 sm:w-24 sm:h-24 animate-threat-bounce" aria-hidden="true">
          <path
            d="M32 68 C16 68, 12 46, 28 40 C30 20, 58 14, 72 28 C88 22, 106 36, 98 54 C110 60, 102 68, 90 68 Z"
            fill="#93C5FD"
            stroke="#241F31"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          <path d="M46 46 Q52 40 58 46" fill="none" stroke="#241F31" strokeWidth="3" strokeLinecap="round" />
          <path d="M68 46 Q74 40 80 46" fill="none" stroke="#241F31" strokeWidth="3" strokeLinecap="round" />
          <line x1="36" y1="80" x2="30" y2="96" stroke="#38BDF8" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="58" y1="82" x2="52" y2="100" stroke="#0284C7" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="80" y1="80" x2="74" y2="96" stroke="#38BDF8" strokeWidth="4.5" strokeLinecap="round" />
        </svg>
      );

    case 'chicken':
      return (
        <svg viewBox="0 0 120 120" className="w-20 h-20 sm:w-24 sm:h-24 animate-threat-bounce" aria-hidden="true">
          {/* Comb */}
          <path d="M46 28 C44 12, 60 12, 60 24 C64 12, 78 14, 74 28 Z" fill="#F43F5E" stroke="#241F31" strokeWidth="3" />
          {/* Body/Head */}
          <circle cx="60" cy="60" r="34" fill="#FFFFFF" stroke="#241F31" strokeWidth="3.5" />
          {/* Angry eyebrows */}
          <path d="M36 46 L52 52" stroke="#241F31" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M84 46 L68 52" stroke="#241F31" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="46" cy="56" r="5" fill="#241F31" />
          <circle cx="74" cy="56" r="5" fill="#241F31" />
          {/* Beak */}
          <polygon points="52,62 68,62 60,76" fill="#F59E0B" stroke="#241F31" strokeWidth="3" strokeLinejoin="round" />
          {/* Wattle */}
          <ellipse cx="60" cy="82" rx="6" ry="8" fill="#F43F5E" stroke="#241F31" strokeWidth="2.5" />
        </svg>
      );

    case 'pigeon':
      return (
        <svg viewBox="0 0 120 120" className="w-20 h-20 sm:w-24 sm:h-24 animate-threat-bounce" aria-hidden="true">
          {/* Wings */}
          <path d="M22 60 C10 42, 34 32, 46 54" fill="#CBD5E1" stroke="#241F31" strokeWidth="3.5" />
          <path d="M98 60 C110 42, 86 32, 74 54" fill="#CBD5E1" stroke="#241F31" strokeWidth="3.5" />
          {/* Pigeon body */}
          <ellipse cx="60" cy="64" rx="28" ry="30" fill="#94A3B8" stroke="#241F31" strokeWidth="3.5" />
          {/* Iridescent neck */}
          <ellipse cx="60" cy="48" rx="18" ry="12" fill="#A7F3D0" opacity="0.8" />
          <circle cx="50" cy="50" r="5" fill="#F59E0B" stroke="#241F31" strokeWidth="2" />
          <circle cx="50" cy="50" r="2.2" fill="#241F31" />
          <circle cx="70" cy="50" r="5" fill="#F59E0B" stroke="#241F31" strokeWidth="2" />
          <circle cx="70" cy="50" r="2.2" fill="#241F31" />
          <polygon points="56,56 64,56 60,64" fill="#334155" stroke="#241F31" strokeWidth="2" />
        </svg>
      );

    case 'falling':
      return (
        <svg viewBox="0 0 120 120" className="w-20 h-20 sm:w-24 sm:h-24 animate-egg-panic" aria-hidden="true">
          <polygon
            points="60,12 72,38 100,26 86,52 110,66 82,78 96,104 66,90 54,112 44,86 16,96 30,70 10,54 38,44 26,18 52,34"
            fill="#FDE047"
            stroke="#241F31"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          <text x="60" y="70" textAnchor="middle" fill="#E11D48" fontWeight="900" fontSize="28">!</text>
        </svg>
      );

    case 'thief':
      return (
        <svg viewBox="0 0 120 120" className="w-20 h-20 sm:w-24 sm:h-24 animate-threat-bounce" aria-hidden="true">
          {/* Beanie */}
          <path d="M30 46 C30 20, 90 20, 90 46 Z" fill="#475569" stroke="#241F31" strokeWidth="3.5" />
          <circle cx="60" cy="64" r="30" fill="#FDE68A" stroke="#241F31" strokeWidth="3.5" />
          {/* Bandit mask */}
          <rect x="30" y="48" width="60" height="20" rx="10" fill="#1E293B" stroke="#241F31" strokeWidth="2.5" />
          <circle cx="46" cy="58" r="4" fill="#FFFFFF" />
          <circle cx="74" cy="58" r="4" fill="#FFFFFF" />
          {/* Sneaky grin */}
          <path d="M48 78 Q60 84 72 76" fill="none" stroke="#241F31" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'wind':
      return (
        <svg viewBox="0 0 120 120" className="w-20 h-20 sm:w-24 sm:h-24 animate-threat-bounce" aria-hidden="true">
          <path d="M16 44 H76 C88 44, 88 26, 74 26 C64 26, 62 34, 66 38" fill="none" stroke="#38BDF8" strokeWidth="5" strokeLinecap="round" />
          <path d="M12 64 H92 C104 64, 104 82, 90 82 C80 82, 78 74, 82 70" fill="none" stroke="#0EA5E9" strokeWidth="5" strokeLinecap="round" />
          <path d="M24 84 H62 C70 84, 70 96, 60 96" fill="none" stroke="#7DD3FC" strokeWidth="5" strokeLinecap="round" />
        </svg>
      );

    case 'mosquito':
      return (
        <svg viewBox="0 0 120 120" className="w-20 h-20 sm:w-24 sm:h-24 animate-egg-panic" aria-hidden="true">
          <ellipse cx="42" cy="40" rx="20" ry="10" transform="rotate(-30 42 40)" fill="#E0F2FE" stroke="#241F31" strokeWidth="3" />
          <ellipse cx="78" cy="40" rx="20" ry="10" transform="rotate(30 78 40)" fill="#E0F2FE" stroke="#241F31" strokeWidth="3" />
          <ellipse cx="60" cy="64" rx="16" ry="24" fill="#86EFAC" stroke="#241F31" strokeWidth="3.5" />
          <circle cx="54" cy="54" r="5" fill="#F43F5E" stroke="#241F31" strokeWidth="2" />
          <circle cx="66" cy="54" r="5" fill="#F43F5E" stroke="#241F31" strokeWidth="2" />
          <line x1="60" y1="86" x2="60" y2="108" stroke="#241F31" strokeWidth="3.5" strokeLinecap="round" />
        </svg>
      );

    case 'paparazzi':
      return (
        <svg viewBox="0 0 120 120" className="w-20 h-20 sm:w-24 sm:h-24 animate-threat-bounce" aria-hidden="true">
          <rect x="20" y="38" width="80" height="54" rx="12" fill="#C4B5FD" stroke="#241F31" strokeWidth="3.5" />
          <rect x="44" y="24" width="32" height="14" rx="4" fill="#FDE047" stroke="#241F31" strokeWidth="3" />
          <circle cx="60" cy="65" r="18" fill="#334155" stroke="#241F31" strokeWidth="3.5" />
          <circle cx="60" cy="65" r="9" fill="#38BDF8" />
          <circle cx="56" cy="61" r="3" fill="#FFFFFF" />
        </svg>
      );

    case 'ufo':
      return (
        <svg viewBox="0 0 120 120" className="w-20 h-20 sm:w-24 sm:h-24 animate-threat-bounce" aria-hidden="true">
          <polygon points="44,72 76,72 96,112 24,112" fill="#86EFAC" opacity="0.55" />
          <path d="M36 52 C36 28, 84 28, 84 52 Z" fill="#A5F3FC" stroke="#241F31" strokeWidth="3.5" />
          <ellipse cx="60" cy="58" rx="44" ry="15" fill="#C084FC" stroke="#241F31" strokeWidth="3.5" />
          <circle cx="38" cy="58" r="4" fill="#FDE047" />
          <circle cx="60" cy="61" r="4" fill="#FDE047" />
          <circle cx="82" cy="58" r="4" fill="#FDE047" />
        </svg>
      );

    case 'hunger':
      return (
        <svg viewBox="0 0 120 120" className="w-20 h-20 sm:w-24 sm:h-24 animate-threat-bounce" aria-hidden="true">
          {/* Frying pan */}
          <line x1="82" y1="78" x2="108" y2="104" stroke="#241F31" strokeWidth="9" strokeLinecap="round" />
          <circle cx="56" cy="56" r="34" fill="#475569" stroke="#241F31" strokeWidth="3.5" />
          <circle cx="56" cy="56" r="26" fill="#64748B" />
          <path d="M40 48 Q48 40 56 48 T72 48" fill="none" stroke="#FDA4AF" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="56" cy="60" r="10" fill="#FDE047" opacity="0.85" />
        </svg>
      );
  }
}
