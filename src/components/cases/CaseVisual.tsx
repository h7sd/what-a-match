interface CaseVisualProps {
  caseName: string;
  accentColor: string;
}

function StarterCaseVisual({ accent }: { accent: string }) {
  return (
    <svg viewBox="0 0 160 128" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="sc-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1a2a1a" />
          <stop offset="100%" stopColor="#0d1a0d" />
        </linearGradient>
        <linearGradient id="sc-lid" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#243824" />
          <stop offset="100%" stopColor="#162816" />
        </linearGradient>
        <filter id="sc-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <rect x="24" y="62" width="112" height="58" rx="8" fill="url(#sc-body)" stroke={accent} strokeWidth="1.5" strokeOpacity="0.6" />
      <rect x="24" y="44" width="112" height="24" rx="6" fill="url(#sc-lid)" stroke={accent} strokeWidth="1.5" strokeOpacity="0.6" />
      <rect x="24" y="62" width="112" height="5" fill={accent} fillOpacity="0.25" />
      <rect x="64" y="38" width="32" height="14" rx="4" fill={accent} fillOpacity="0.2" stroke={accent} strokeWidth="1" strokeOpacity="0.5" />
      <circle cx="80" cy="45" r="4" fill={accent} fillOpacity="0.8" />
      <line x1="42" y1="74" x2="118" y2="74" stroke={accent} strokeWidth="0.5" strokeOpacity="0.3" />
      <line x1="42" y1="84" x2="118" y2="84" stroke={accent} strokeWidth="0.5" strokeOpacity="0.3" />
      <line x1="42" y1="94" x2="118" y2="94" stroke={accent} strokeWidth="0.5" strokeOpacity="0.3" />
      <circle cx="48" cy="79" r="5" fill={accent} fillOpacity="0.15" stroke={accent} strokeWidth="0.8" strokeOpacity="0.4" />
      <circle cx="80" cy="91" r="5" fill={accent} fillOpacity="0.15" stroke={accent} strokeWidth="0.8" strokeOpacity="0.4" />
      <circle cx="112" cy="79" r="5" fill={accent} fillOpacity="0.15" stroke={accent} strokeWidth="0.8" strokeOpacity="0.4" />
      <rect x="74" y="107" width="12" height="8" rx="2" fill={accent} fillOpacity="0.5" />
      <text x="80" y="111" textAnchor="middle" fill={accent} fontSize="4" fontWeight="bold" opacity="0.9" dy="1">UC</text>
    </svg>
  );
}

function StandardCaseVisual({ accent }: { accent: string }) {
  return (
    <svg viewBox="0 0 160 128" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="stc-body" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#0d1b2e" />
          <stop offset="100%" stopColor="#1a3050" />
        </linearGradient>
        <linearGradient id="stc-lid" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#152540" />
          <stop offset="100%" stopColor="#1e3860" />
        </linearGradient>
      </defs>
      <rect x="20" y="60" width="120" height="60" rx="10" fill="url(#stc-body)" stroke={accent} strokeWidth="1.5" strokeOpacity="0.7" />
      <rect x="20" y="40" width="120" height="26" rx="7" fill="url(#stc-lid)" stroke={accent} strokeWidth="1.5" strokeOpacity="0.7" />
      <rect x="20" y="60" width="120" height="6" fill={accent} fillOpacity="0.2" />
      <rect x="60" y="34" width="40" height="16" rx="5" fill={accent} fillOpacity="0.15" stroke={accent} strokeWidth="1" strokeOpacity="0.5" />
      <circle cx="80" cy="42" r="5" fill={accent} fillOpacity="0.9" />
      <circle cx="80" cy="42" r="2.5" fill="#fff" fillOpacity="0.3" />
      <rect x="34" y="72" width="92" height="2" rx="1" fill={accent} fillOpacity="0.15" />
      <rect x="34" y="84" width="92" height="2" rx="1" fill={accent} fillOpacity="0.15" />
      <rect x="34" y="96" width="92" height="2" rx="1" fill={accent} fillOpacity="0.15" />
      <rect x="34" y="104" width="28" height="10" rx="3" fill={accent} fillOpacity="0.2" stroke={accent} strokeWidth="0.8" strokeOpacity="0.4" />
      <rect x="66" y="104" width="28" height="10" rx="3" fill={accent} fillOpacity="0.2" stroke={accent} strokeWidth="0.8" strokeOpacity="0.4" />
      <rect x="98" y="104" width="28" height="10" rx="3" fill={accent} fillOpacity="0.2" stroke={accent} strokeWidth="0.8" strokeOpacity="0.4" />
      <polygon points="80,68 83,76 92,76 85,81 87,89 80,84 73,89 75,81 68,76 77,76" fill={accent} fillOpacity="0.35" stroke={accent} strokeWidth="0.5" strokeOpacity="0.6" />
    </svg>
  );
}

function PremiumCaseVisual({ accent }: { accent: string }) {
  return (
    <svg viewBox="0 0 160 128" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="pc-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1a0d2e" />
          <stop offset="100%" stopColor="#2d1050" />
        </linearGradient>
        <linearGradient id="pc-lid" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22103a" />
          <stop offset="100%" stopColor="#3a1560" />
        </linearGradient>
        <linearGradient id="pc-gem" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.9" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.4" />
        </linearGradient>
      </defs>
      <rect x="18" y="58" width="124" height="62" rx="12" fill="url(#pc-body)" stroke={accent} strokeWidth="2" strokeOpacity="0.8" />
      <rect x="18" y="36" width="124" height="28" rx="9" fill="url(#pc-lid)" stroke={accent} strokeWidth="2" strokeOpacity="0.8" />
      <rect x="18" y="58" width="124" height="7" fill={accent} fillOpacity="0.25" />
      <rect x="56" y="28" width="48" height="18" rx="6" fill={accent} fillOpacity="0.12" stroke={accent} strokeWidth="1.2" strokeOpacity="0.6" />
      <polygon points="80,32 84,40 92,40 86,45 88,53 80,48 72,53 74,45 68,40 76,40" fill="url(#pc-gem)" />
      <rect x="28" y="70" width="104" height="1.5" rx="1" fill={accent} fillOpacity="0.3" />
      <rect x="28" y="82" width="104" height="1.5" rx="1" fill={accent} fillOpacity="0.3" />
      <rect x="28" y="94" width="104" height="1.5" rx="1" fill={accent} fillOpacity="0.3" />
      <circle cx="42" cy="76" r="6" fill={accent} fillOpacity="0.12" stroke={accent} strokeWidth="1" strokeOpacity="0.5" />
      <circle cx="80" cy="88" r="6" fill={accent} fillOpacity="0.12" stroke={accent} strokeWidth="1" strokeOpacity="0.5" />
      <circle cx="118" cy="76" r="6" fill={accent} fillOpacity="0.12" stroke={accent} strokeWidth="1" strokeOpacity="0.5" />
      <circle cx="42" cy="100" r="4" fill={accent} fillOpacity="0.2" />
      <circle cx="118" cy="100" r="4" fill={accent} fillOpacity="0.2" />
      <rect x="62" y="107" width="36" height="8" rx="3" fill={accent} fillOpacity="0.3" stroke={accent} strokeWidth="0.8" strokeOpacity="0.6" />
      <text x="80" y="113" textAnchor="middle" fill={accent} fontSize="4.5" fontWeight="bold" opacity="1">PREMIUM</text>
      <circle cx="28" cy="64" r="2" fill={accent} fillOpacity="0.6" />
      <circle cx="132" cy="64" r="2" fill={accent} fillOpacity="0.6" />
      <circle cx="28" cy="114" r="2" fill={accent} fillOpacity="0.6" />
      <circle cx="132" cy="114" r="2" fill={accent} fillOpacity="0.6" />
    </svg>
  );
}

function EliteCaseVisual({ accent }: { accent: string }) {
  return (
    <svg viewBox="0 0 160 128" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="ec-body" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#1a0a0a" />
          <stop offset="100%" stopColor="#2e1010" />
        </linearGradient>
        <linearGradient id="ec-lid" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#220d0d" />
          <stop offset="100%" stopColor="#3a1515" />
        </linearGradient>
      </defs>
      <path d="M22 58 L22 112 Q22 120 30 120 L130 120 Q138 120 138 112 L138 58 Z" fill="url(#ec-body)" stroke={accent} strokeWidth="2" strokeOpacity="0.9" />
      <path d="M22 36 L22 58 L138 58 L138 36 Q138 28 130 28 L30 28 Q22 28 22 36 Z" fill="url(#ec-lid)" stroke={accent} strokeWidth="2" strokeOpacity="0.9" />
      <rect x="22" y="56" width="116" height="8" fill={accent} fillOpacity="0.3" />
      <rect x="58" y="20" width="44" height="18" rx="5" fill={accent} fillOpacity="0.1" stroke={accent} strokeWidth="1.5" strokeOpacity="0.7" />
      <path d="M80 24 L84 32 L80 36 L76 32 Z" fill={accent} fillOpacity="0.8" />
      <circle cx="80" cy="30" r="3" fill="#fff" fillOpacity="0.25" />
      <path d="M32 72 L128 72" stroke={accent} strokeWidth="1" strokeOpacity="0.4" strokeDasharray="4 3" />
      <path d="M32 86 L128 86" stroke={accent} strokeWidth="1" strokeOpacity="0.4" strokeDasharray="4 3" />
      <path d="M32 100 L128 100" stroke={accent} strokeWidth="1" strokeOpacity="0.4" strokeDasharray="4 3" />
      <path d="M50 66 L50 114" stroke={accent} strokeWidth="0.8" strokeOpacity="0.25" />
      <path d="M110 66 L110 114" stroke={accent} strokeWidth="0.8" strokeOpacity="0.25" />
      <rect x="32" y="72" width="16" height="12" rx="2" fill={accent} fillOpacity="0.2" />
      <rect x="72" y="76" width="16" height="20" rx="2" fill={accent} fillOpacity="0.25" />
      <rect x="112" y="72" width="16" height="12" rx="2" fill={accent} fillOpacity="0.2" />
      <text x="80" y="116" textAnchor="middle" fill={accent} fontSize="5" fontWeight="bold" opacity="0.9">ELITE</text>
      <path d="M22 64 L16 64 L16 60 L22 60" stroke={accent} strokeWidth="1.2" strokeOpacity="0.7" fill="none" />
      <path d="M138 64 L144 64 L144 60 L138 60" stroke={accent} strokeWidth="1.2" strokeOpacity="0.7" fill="none" />
      <path d="M22 112 L16 112 L16 116 L22 116" stroke={accent} strokeWidth="1.2" strokeOpacity="0.7" fill="none" />
      <path d="M138 112 L144 112 L144 116 L138 116" stroke={accent} strokeWidth="1.2" strokeOpacity="0.7" fill="none" />
    </svg>
  );
}

function LegendaryCaseVisual({ accent }: { accent: string }) {
  return (
    <svg viewBox="0 0 160 128" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="lc-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0d1a0d" />
          <stop offset="50%" stopColor="#1a2800" />
          <stop offset="100%" stopColor="#0a120a" />
        </linearGradient>
        <linearGradient id="lc-lid" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#142014" />
          <stop offset="100%" stopColor="#1e3000" />
        </linearGradient>
        <radialGradient id="lc-glow" cx="50%" cy="50%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.3" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="80" cy="90" rx="60" ry="30" fill="url(#lc-glow)" />
      <path d="M20 56 L24 120 Q24 122 26 122 L134 122 Q136 122 136 120 L140 56 Z" fill="url(#lc-body)" stroke={accent} strokeWidth="2" strokeOpacity="0.9" />
      <path d="M16 34 Q16 28 22 28 L138 28 Q144 28 144 34 L140 56 L20 56 Z" fill="url(#lc-lid)" stroke={accent} strokeWidth="2" strokeOpacity="0.9" />
      <rect x="20" y="54" width="120" height="8" fill={accent} fillOpacity="0.35" />
      <rect x="60" y="20" width="40" height="18" rx="5" fill={accent} fillOpacity="0.12" stroke={accent} strokeWidth="1.5" strokeOpacity="0.7" />
      <path d="M80 22 L86 28 L84 36 L80 34 L76 36 L74 28 Z" fill={accent} fillOpacity="0.7" />
      <path d="M32 70 L128 70" stroke={accent} strokeWidth="0.8" strokeOpacity="0.25" />
      <path d="M34 82 L126 82" stroke={accent} strokeWidth="0.8" strokeOpacity="0.25" />
      <path d="M36 94 L124 94" stroke={accent} strokeWidth="0.8" strokeOpacity="0.25" />
      <path d="M38 106 L122 106" stroke={accent} strokeWidth="0.8" strokeOpacity="0.25" />
      <circle cx="44" cy="76" r="7" fill={accent} fillOpacity="0.15" stroke={accent} strokeWidth="1" strokeOpacity="0.6" />
      <circle cx="80" cy="90" r="9" fill={accent} fillOpacity="0.2" stroke={accent} strokeWidth="1.2" strokeOpacity="0.8" />
      <circle cx="116" cy="76" r="7" fill={accent} fillOpacity="0.15" stroke={accent} strokeWidth="1" strokeOpacity="0.6" />
      <circle cx="80" cy="90" r="4" fill={accent} fillOpacity="0.6" />
      <path d="M36 64 Q28 64 28 72 L28 78" stroke={accent} strokeWidth="1.5" strokeOpacity="0.6" fill="none" strokeLinecap="round" />
      <path d="M124 64 Q132 64 132 72 L132 78" stroke={accent} strokeWidth="1.5" strokeOpacity="0.6" fill="none" strokeLinecap="round" />
      <path d="M30 113 Q26 113 26 117" stroke={accent} strokeWidth="1.5" strokeOpacity="0.6" fill="none" strokeLinecap="round" />
      <path d="M130 113 Q134 113 134 117" stroke={accent} strokeWidth="1.5" strokeOpacity="0.6" fill="none" strokeLinecap="round" />
      <text x="80" y="117" textAnchor="middle" fill={accent} fontSize="4.5" fontWeight="bold" opacity="1" letterSpacing="1">LEGENDARY</text>
    </svg>
  );
}

const caseVisuals: Record<string, (props: { accent: string }) => JSX.Element> = {
  starter: StarterCaseVisual,
  standard: StandardCaseVisual,
  premium: PremiumCaseVisual,
  elite: EliteCaseVisual,
  legendary: LegendaryCaseVisual,
};

function getCaseKey(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('starter')) return 'starter';
  if (n.includes('standard')) return 'standard';
  if (n.includes('premium') || n.includes('subscription')) return 'premium';
  if (n.includes('elite')) return 'elite';
  if (n.includes('legendary')) return 'legendary';
  return 'starter';
}

export function CaseVisual({ caseName, accentColor }: CaseVisualProps) {
  const key = getCaseKey(caseName);
  const Visual = caseVisuals[key] || StarterCaseVisual;
  return (
    <div className="w-40 h-32 relative">
      <Visual accent={accentColor} />
    </div>
  );
}
