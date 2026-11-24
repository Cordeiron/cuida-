import type { EggMood } from '../types/game';

interface EggCharacterProps {
  hp: number;
  mood: EggMood;
  isRaining?: boolean;
  isShielded?: boolean;
  onPet?: () => void;
  size?: 'md' | 'lg';
}

export function EggCharacter({
  hp,
  mood,
  isRaining = false,
  isShielded = false,
  onPet,
  size = 'lg',
}: EggCharacterProps) {
  const isBroken = hp <= 0 || mood === 'cracked';
  const showMinorCracks = hp < 75 && hp > 0;
  const showMajorCracks = hp < 40 && hp > 0;
  const showBandAid = hp > 0 && hp < 50;

  const animClass = isBroken
    ? ''
    : mood === 'falling'
      ? 'animate-egg-fall'
      : mood === 'terrified' || mood === 'dizzy'
        ? 'animate-egg-panic'
        : 'animate-egg-float';

  const dimensions = size === 'lg' ? 'w-44 h-52 sm:w-52 sm:h-60' : 'w-36 h-44';

  if (isBroken) {
    return (
      <div className={`relative flex items-center justify-center ${dimensions} select-none`} aria-label="Ovo quebrado">
        <svg viewBox="0 0 220 220" className="w-full h-full drop-shadow-sm">
          {/* Spilled yolk puddle */}
          <ellipse cx="110" cy="178" rx="76" ry="20" fill="#FDE047" stroke="#241F31" strokeWidth="3.5" />
          <ellipse cx="110" cy="175" rx="34" ry="12" fill="#F59E0B" stroke="#241F31" strokeWidth="3" />
          <ellipse cx="100" cy="171" rx="8" ry="3.5" fill="#FEF9C3" />

          {/* Left broken shell half */}
          <path
            d="M42 162 C36 125, 58 95, 86 96 L94 114 L82 130 L96 146 L88 168 Z"
            fill="#FFF7EB"
            stroke="#241F31"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          {/* Right broken shell half */}
          <path
            d="M178 162 C184 125, 162 95, 134 96 L126 116 L138 132 L124 148 L132 168 Z"
            fill="#FFF7EB"
            stroke="#241F31"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          {/* Sad dizzy X eyes on spilled yolk */}
          <path d="M96 168 L103 175 M103 168 L96 175" stroke="#241F31" strokeWidth="2.8" strokeLinecap="round" />
          <path d="M117 168 L124 175 M124 168 L117 175" stroke="#241F31" strokeWidth="2.8" strokeLinecap="round" />
          {/* Broken heart */}
          <path
            d="M110 56 C100 42, 78 46, 78 64 C78 80, 110 96, 110 96 C110 96, 142 80, 142 64 C142 46, 120 42, 110 56 Z"
            fill="#FB7185"
            stroke="#241F31"
            strokeWidth="3.5"
          />
          <path d="M112 56 L105 70 L114 78 L107 92" fill="none" stroke="#FFFDF7" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onPet}
      className={`relative flex items-center justify-center ${dimensions} cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-300 rounded-full select-none group`}
      aria-label="Fazer carinho no ovo da Rebeca"
    >
      {/* Rain umbrella shield if protected or rain drops if wet */}
      {isShielded && (
        <svg viewBox="0 0 180 70" className="absolute -top-8 w-44 h-20 pointer-events-none z-20">
          <path
            d="M18 52 C26 14, 154 14, 162 52 Q138 42 114 52 Q90 42 66 52 Q42 42 18 52 Z"
            fill="#FF8FAB"
            stroke="#241F31"
            strokeWidth="3.5"
          />
          <line x1="90" y1="50" x2="90" y2="68" stroke="#241F31" strokeWidth="4" strokeLinecap="round" />
        </svg>
      )}

      {isRaining && !isShielded && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
          <div className="absolute left-6 top-2 w-1 h-4 bg-sky-400 rounded-full animate-rain-streak" />
          <div className="absolute left-16 top-0 w-1 h-4 bg-sky-500 rounded-full animate-rain-streak" style={{ animationDelay: '0.2s' }} />
          <div className="absolute right-10 top-1 w-1 h-4 bg-sky-400 rounded-full animate-rain-streak" style={{ animationDelay: '0.4s' }} />
        </div>
      )}

      <svg
        viewBox="0 0 200 230"
        className={`w-full h-full drop-shadow-md transition-transform duration-150 group-active:scale-95 ${animClass}`}
      >
        {/* Cozy shadow underneath */}
        <ellipse cx="100" cy="208" rx="54" ry="12" fill="rgba(36,31,49,0.16)" />

        {/* Egg Body */}
        <path
          d="M100 20 C145 20, 168 92, 168 140 C168 184, 138 206, 100 206 C62 206, 32 184, 32 140 C32 92, 55 20, 100 20 Z"
          fill="#FFF7EB"
          stroke="#241F31"
          strokeWidth="4.5"
        />

        {/* Soft pastel shell shading */}
        <path
          d="M136 44 C156 76, 160 120, 156 146 C152 174, 134 196, 102 200 C128 192, 142 170, 144 138 C146 105, 142 70, 136 44 Z"
          fill="#FDE8C8"
          opacity="0.7"
        />
        {/* Glossy shell highlight */}
        <ellipse cx="72" cy="64" rx="11" ry="22" transform="rotate(-22 72 64)" fill="#FFFFFF" opacity="0.85" />

        {/* Little pink cheeks */}
        <ellipse cx="64" cy="132" rx="10" ry="6" fill="#FFB3C6" opacity="0.8" />
        <ellipse cx="136" cy="132" rx="10" ry="6" fill="#FFB3C6" opacity="0.8" />

        {/* Tiny ribbon / heart pin showing Rebeca owns it */}
        <path
          d="M100 174 C95 168, 86 170, 86 177 C86 184, 100 192, 100 192 C100 192, 114 184, 114 177 C114 170, 105 168, 100 174 Z"
          fill="#FF6B8B"
          stroke="#241F31"
          strokeWidth="2.5"
        />

        {/* Shell Cracks based on HP */}
        {showMinorCracks && (
          <path
            d="M138 72 L124 84 L132 95 L118 106"
            fill="none"
            stroke="#241F31"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {showMajorCracks && (
          <path
            d="M44 128 L60 136 L52 150 L68 158"
            fill="none"
            stroke="#241F31"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Cute Band-aid when HP < 50 */}
        {showBandAid && (
          <g transform="translate(114, 144) rotate(-20)">
            <rect x="0" y="0" width="34" height="14" rx="6" fill="#FBCFE8" stroke="#241F31" strokeWidth="2.5" />
            <line x1="12" y1="3" x2="12" y2="11" stroke="#241F31" strokeWidth="1.5" />
            <line x1="22" y1="3" x2="22" y2="11" stroke="#241F31" strokeWidth="1.5" />
          </g>
        )}

        {/* Facial Expressions */}
        {mood === 'happy' && (
          <g>
            {/* Happy sparkling eyes */}
            <circle cx="78" cy="112" r="8.5" fill="#241F31" />
            <circle cx="75" cy="109" r="3" fill="#FFFFFF" />
            <circle cx="122" cy="112" r="8.5" fill="#241F31" />
            <circle cx="119" cy="109" r="3" fill="#FFFFFF" />
            {/* Cute smile */}
            <path d="M88 128 Q100 142 112 128" fill="none" stroke="#241F31" strokeWidth="4" strokeLinecap="round" />
          </g>
        )}

        {mood === 'heroic' && (
          <g>
            {/* Cool sunglasses */}
            <rect x="58" y="101" width="36" height="20" rx="5" fill="#241F31" />
            <rect x="106" y="101" width="36" height="20" rx="5" fill="#241F31" />
            <line x1="94" y1="108" x2="106" y2="108" stroke="#241F31" strokeWidth="4" />
            <line x1="64" y1="106" x2="74" y2="116" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="112" y1="106" x2="122" y2="116" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M88 134 Q102 145 114 131" fill="none" stroke="#241F31" strokeWidth="4" strokeLinecap="round" />
          </g>
        )}

        {mood === 'nervous' && (
          <g>
            {/* Wide nervous eyes */}
            <circle cx="78" cy="112" r="10" fill="#FFFFFF" stroke="#241F31" strokeWidth="3.5" />
            <circle cx="79" cy="112" r="4" fill="#241F31" />
            <circle cx="122" cy="112" r="10" fill="#FFFFFF" stroke="#241F31" strokeWidth="3.5" />
            <circle cx="123" cy="112" r="4" fill="#241F31" />
            {/* Worried eyebrows */}
            <path d="M68 96 L86 101" stroke="#241F31" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M132 96 L114 101" stroke="#241F31" strokeWidth="3.5" strokeLinecap="round" />
            {/* Wavy mouth */}
            <path d="M86 134 Q93 128 100 134 T114 134" fill="none" stroke="#241F31" strokeWidth="3.5" strokeLinecap="round" />
            {/* Sweat drop */}
            <path d="M148 84 C154 94, 154 102, 148 102 C142 102, 142 94, 148 84 Z" fill="#7DD3FC" stroke="#241F31" strokeWidth="2" />
          </g>
        )}

        {(mood === 'terrified' || mood === 'falling') && (
          <g>
            {/* Screaming wide eyes */}
            <circle cx="77" cy="108" r="12" fill="#FFFFFF" stroke="#241F31" strokeWidth="3.5" />
            <circle cx="77" cy="108" r="3.5" fill="#241F31" />
            <circle cx="123" cy="108" r="12" fill="#FFFFFF" stroke="#241F31" strokeWidth="3.5" />
            <circle cx="123" cy="108" r="3.5" fill="#241F31" />
            {/* Screaming open mouth */}
            <ellipse cx="100" cy="139" rx="13" ry="15" fill="#FB7185" stroke="#241F31" strokeWidth="3.5" />
            <ellipse cx="100" cy="147" rx="7" ry="4" fill="#FDA4AF" />
            {/* Sweat drops */}
            <path d="M52 78 C58 88, 58 96, 52 96 C46 96, 46 88, 52 78 Z" fill="#7DD3FC" stroke="#241F31" strokeWidth="2" />
            <path d="M148 82 C154 92, 154 100, 148 100 C142 100, 142 92, 148 82 Z" fill="#7DD3FC" stroke="#241F31" strokeWidth="2" />
          </g>
        )}

        {mood === 'wet' && (
          <g>
            {/* Shivering eyes */}
            <path d="M68 112 L84 106 L68 100" fill="none" stroke="#241F31" strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M132 112 L116 106 L132 100" fill="none" stroke="#241F31" strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" />
            {/* Shivering mouth */}
            <path d="M84 134 L90 130 L96 136 L102 130 L108 136 L114 131" fill="none" stroke="#241F31" strokeWidth="3.5" strokeLinecap="round" />
          </g>
        )}

        {mood === 'dizzy' && (
          <g>
            {/* Spiral / dizzy eyes */}
            <circle cx="77" cy="110" r="10" fill="none" stroke="#241F31" strokeWidth="3.5" />
            <circle cx="77" cy="110" r="3" fill="#241F31" />
            <circle cx="123" cy="110" r="10" fill="none" stroke="#241F31" strokeWidth="3.5" />
            <circle cx="123" cy="110" r="3" fill="#241F31" />
            <ellipse cx="100" cy="136" rx="8" ry="6" fill="#241F31" />
          </g>
        )}
      </svg>
    </button>
  );
}
