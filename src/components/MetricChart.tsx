"use client";

interface DataPoint {
  timestamp: string;
  value: number;
}

interface MetricChartProps {
  label: string;
  data: DataPoint[];
  unit?: string;
  color?: string;
  dangerThreshold?: number;
}

/**
 * Lightweight SVG sparkline for CloudWatch metrics.
 * Shows a miniature line chart with optional danger threshold line.
 */
export default function MetricChart({
  label,
  data,
  unit = "",
  color = "var(--color-accent)",
  dangerThreshold,
}: MetricChartProps) {
  if (!data.length) return null;

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values) || 1;
  const latest = values[values.length - 1];
  const isAboveDanger = dangerThreshold != null && latest > dangerThreshold;

  const width = 200;
  const height = 48;
  const padding = 2;

  const points = values
    .map((v, i) => {
      const x = padding + (i / (values.length - 1)) * (width - padding * 2);
      const y = height - padding - ((v - min) / (max - min || 1)) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  const thresholdY = dangerThreshold != null
    ? height - padding - ((dangerThreshold - min) / (max - min || 1)) * (height - padding * 2)
    : null;

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-[var(--color-text-dim)] uppercase tracking-wider">{label}</span>
        <span
          className="text-sm font-mono font-medium"
          style={{ color: isAboveDanger ? "var(--color-danger)" : color }}
        >
          {Math.round(latest)}{unit}
        </span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-12">
        {/* Danger threshold line */}
        {thresholdY != null && (
          <line
            x1={padding}
            y1={thresholdY}
            x2={width - padding}
            y2={thresholdY}
            stroke="var(--color-danger)"
            strokeWidth="0.5"
            strokeDasharray="4 2"
            opacity={0.5}
          />
        )}
        {/* Area fill */}
        <polygon
          points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`}
          fill={isAboveDanger ? "var(--color-danger)" : color}
          opacity={0.08}
        />
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke={isAboveDanger ? "var(--color-danger)" : color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Current value dot */}
        {values.length > 0 && (
          <circle
            cx={width - padding}
            cy={height - padding - ((latest - min) / (max - min || 1)) * (height - padding * 2)}
            r="2.5"
            fill={isAboveDanger ? "var(--color-danger)" : color}
          />
        )}
      </svg>
    </div>
  );
}
