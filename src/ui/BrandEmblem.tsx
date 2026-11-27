import React from 'react';

interface BrandEmblemProps {
  compact?: boolean;
}

export const BrandEmblem: React.FC<BrandEmblemProps> = ({ compact = false }) => {
  return (
    <svg
      viewBox="0 0 420 132"
      className={compact ? 'w-56 h-auto select-none' : 'w-72 sm:w-84 h-auto select-none'}
      role="img"
      aria-label="Dragon Ball Duty: Modern Combat"
    >
      <defs>
        <linearGradient id="dbdGoldGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="55%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <linearGradient id="dbdSteelGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="55%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
      </defs>

      {/* Dark angled tactical backing */}
      <polygon
        points="12,18 408,10 398,120 6,124"
        fill="#0f172a"
        fillOpacity="0.9"
        stroke="#f59e0b"
        strokeWidth="2.5"
      />

      {/* DRAGON BALL */}
      <text
        x="210"
        y="48"
        textAnchor="middle"
        fontFamily="Impact, Arial Black, sans-serif"
        fontSize="36"
        fontWeight="900"
        letterSpacing="1.5"
        fill="url(#dbdGoldGrad)"
        stroke="#090d16"
        strokeWidth="3"
        paintOrder="stroke"
      >
        DRAGON BALL
      </text>

      {/* Stylized Star Badge on right corner */}
      <circle cx="378" cy="36" r="14" fill="#f59e0b" stroke="#090d16" strokeWidth="2.5" />
      <polygon
        points="378,26 381,33 388,33 382.5,37.5 384.5,44.5 378,40 371.5,44.5 373.5,37.5 368,33 375,33"
        fill="#dc2626"
      />

      {/* DUTY */}
      <text
        x="210"
        y="90"
        textAnchor="middle"
        fontFamily="Impact, Arial Black, sans-serif"
        fontSize="44"
        fontWeight="900"
        letterSpacing="5"
        fill="url(#dbdSteelGrad)"
        stroke="#090d16"
        strokeWidth="3.5"
        paintOrder="stroke"
      >
        DUTY
      </text>

      {/* MODERN COMBAT bar */}
      <polygon points="56,99 364,99 356,118 48,118" fill="#1e293b" stroke="#eab308" strokeWidth="1.5" />
      <text
        x="206"
        y="113"
        textAnchor="middle"
        fontFamily="system-ui, sans-serif"
        fontSize="12"
        fontWeight="800"
        letterSpacing="4.5"
        fill="#facc15"
      >
        MODERN COMBAT
      </text>
    </svg>
  );
};
