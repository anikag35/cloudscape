"use client";

interface ScoreGaugeProps {
  score: number; // 0-100
  label: string;
  size?: number;
}

/**
 * Circular gauge showing a confidence or health score.
 * Green >70, Yellow 40-70, Red <40.
 */
export default function ScoreGauge({ score, label, size = 80 }: ScoreGaugeProps) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (score / 100) * circumference;
  const gap = circumference - filled;

  const color =
    score >= 70 ? "var(--color-success)" :
    score >= 40 ? "var(--color-warning)" :
    "var(--color-danger)";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth="4"
          />
          {/* Filled arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${gap}`}
            style={{ transition: "stroke-dasharray 0.6s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold font-mono" style={{ color }}>
            {score}
          </span>
        </div>
      </div>
      <span className="text-xs text-[var(--color-text-dim)]">{label}</span>
    </div>
  );
}
