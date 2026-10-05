import React from 'react';

export interface MatchScoreProps {
  score: number; // 0 to 100
  grade?: 'Excellent Match' | 'Good Match' | 'Needs Improvement';
  size?: 'md' | 'lg' | 'hero';
  showGradeBadge?: boolean;
  className?: string;
}

export const MatchScore: React.FC<MatchScoreProps> = ({
  score,
  grade,
  size = 'lg',
  showGradeBadge = true,
  className = ''
}) => {
  // Determine automatic grade if not supplied
  const effectiveGrade =
    grade ||
    (score >= 85
      ? 'Excellent Match'
      : score >= 70
      ? 'Good Match'
      : 'Needs Improvement');

  const dimension = size === 'hero' ? 200 : size === 'lg' ? 160 : 110;
  const strokeWidth = size === 'hero' ? 12 : size === 'lg' ? 10 : 8;
  const radius = (dimension - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.min(100, Math.max(0, score));
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  let gradientId = 'matchGradExcellent';
  let strokeStart = '#6366f1';
  let strokeEnd = '#10b981';
  let badgeColor = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
  let glowColor = 'rgba(16, 185, 129, 0.25)';

  if (effectiveGrade === 'Good Match') {
    gradientId = 'matchGradGood';
    strokeStart = '#6366f1';
    strokeEnd = '#3b82f6';
    badgeColor = 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
    glowColor = 'rgba(99, 102, 241, 0.25)';
  } else if (effectiveGrade === 'Needs Improvement') {
    gradientId = 'matchGradImprove';
    strokeStart = '#f59e0b';
    strokeEnd = '#f43f5e';
    badgeColor = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    glowColor = 'rgba(245, 158, 11, 0.25)';
  }

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className="relative flex items-center justify-center rounded-full p-2 transition-transform duration-500"
        style={{
          boxShadow: `0 0 45px -5px ${glowColor}`
        }}
      >
        <svg
          width={dimension}
          height={dimension}
          viewBox={`0 0 ${dimension} ${dimension}`}
          className="transform -rotate-90"
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={strokeStart} />
              <stop offset="100%" stopColor={strokeEnd} />
            </linearGradient>
          </defs>

          {/* Background Track */}
          <circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-800/80"
            fill="transparent"
          />

          {/* Animated Value Stroke */}
          <circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span
            className={`font-black tracking-tight text-white ${
              size === 'hero' ? 'text-5xl' : size === 'lg' ? 'text-4xl' : 'text-2xl'
            }`}
          >
            {clampedScore}%
          </span>
          <span
            className={`text-slate-400 font-medium tracking-wide uppercase ${
              size === 'hero' ? 'text-xs' : 'text-[10px]'
            }`}
          >
            Match Score
          </span>
        </div>
      </div>

      {showGradeBadge && (
        <div
          className={`mt-4 inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold tracking-wide border ${badgeColor}`}
        >
          <span className="w-2 h-2 rounded-full bg-current animate-ping" />
          <span>{effectiveGrade}</span>
        </div>
      )}
    </div>
  );
};
