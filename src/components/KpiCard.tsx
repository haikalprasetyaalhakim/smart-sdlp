import React from "react";

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
  icon?: string;
}

export function KpiCard({ label, value, sub, accent = "#143D32", icon }: KpiCardProps) {
  return (
    <div
      className="bg-white rounded-md border border-slate-200 shadow-xs p-3 sm:p-3.5 relative overflow-hidden flex flex-col justify-between transition hover:border-slate-300"
      style={{ borderTop: `3px solid ${accent}` }}
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] sm:text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider truncate mb-0.5">
            {label}
          </p>
          <p className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-tight">
            {value}
          </p>
          {sub && (
            <p className="text-[10.5px] text-slate-500 mt-1 font-medium flex items-center gap-1">
              {sub}
            </p>
          )}
        </div>
        {icon && (
          <div
            className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${accent}15`, color: accent }}
          >
            <svg
              width={16}
              height={16}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d={icon} />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

export function Badge({
  text,
  color,
}: {
  text: string;
  color: "green" | "gray" | "blue" | "gold" | "red";
}) {
  const styles: Record<string, string> = {
    green: "bg-emerald-50 text-emerald-800 border-emerald-200",
    gray: "bg-slate-100 text-slate-600 border-slate-200",
    blue: "bg-sky-50 text-sky-800 border-sky-200",
    gold: "bg-amber-50 text-amber-800 border-amber-200",
    red: "bg-rose-50 text-rose-800 border-rose-200",
  };
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-semibold border ${
        styles[color] || styles.gray
      } whitespace-nowrap`}
    >
      {text}
    </span>
  );
}

export function ProgressBar({
  value,
  color = "#143D32",
}: {
  value: number;
  color?: string;
}) {
  const val = Math.max(0, Math.min(value, 100));
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${val}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[11px] font-bold text-slate-800 min-w-[38px] text-right">
        {val.toFixed(1)}%
      </span>
    </div>
  );
}
