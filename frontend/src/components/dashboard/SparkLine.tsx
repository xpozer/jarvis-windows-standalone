// frontend/src/components/dashboard/SparkLine.tsx
import { cn } from "@/lib/utils";

type SparkLineProps = {
  values: number[];
  width?: number;
  height?: number;
  label?: string;
  className?: string;
};

export function SparkLine({ values, width = 160, height = 42, label = "Verlauf", className }: SparkLineProps) {
  const points = toPoints(values, width, height);

  return (
    <svg
      className={cn("block text-primary", className)}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={label}
    >
      <polyline fill="none" stroke="currentColor" strokeWidth="1.5" points={points} vectorEffect="non-scaling-stroke" />
      {values.length ? <circle cx={width} cy={getLastY(values, height)} r="2" fill="currentColor" /> : null}
    </svg>
  );
}

function toPoints(values: number[], width: number, height: number) {
  if (values.length === 0) return "";
  if (values.length === 1) return `0 ${height / 2}, ${width} ${height / 2}`;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);

  return values
    .map((value, index) => {
      const x = index * step;
      const y = height - ((value - min) / range) * height;
      return `${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(", ");
}

function getLastY(values: number[], height: number) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const last = values[values.length - 1] ?? min;
  return height - ((last - min) / range) * height;
}
