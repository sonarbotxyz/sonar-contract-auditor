"use client";

interface ScoreRingProps {
  score: number;
  size?: number;
}

function getScoreColor(score: number): string {
  if (score >= 90) return "#22c55e";
  if (score >= 70) return "#84cc16";
  if (score >= 50) return "#eab308";
  if (score >= 30) return "#f97316";
  return "#ef4444";
}

function getScoreLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Fair";
  if (score >= 30) return "Poor";
  return "Critical";
}

export function ScoreRing({ score, size = 160 }: ScoreRingProps) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className="-rotate-90"
        >
          {/* Background ring */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#1A1A25"
            strokeWidth="8"
          />
          {/* Score ring */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="animate-score-fill"
            style={{ "--score-offset": offset } as React.CSSProperties}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-4xl font-bold"
            style={{ color }}
          >
            {score}
          </span>
          <span className="text-xs text-gray-500">/100</span>
        </div>
      </div>
      <span
        className="text-sm font-semibold"
        style={{ color }}
      >
        {getScoreLabel(score)}
      </span>
    </div>
  );
}
