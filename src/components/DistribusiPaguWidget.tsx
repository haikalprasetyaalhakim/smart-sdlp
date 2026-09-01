import React, { useState, useMemo } from "react";
import { DonutChart } from "@/components/ui/donut-chart";
import { motion, AnimatePresence } from "framer-motion";
import { fmtRupiah, fmtMiliar } from "@/utils/formatters";
import { cn } from "@/lib/utils";
import { Activity } from "@/types";
import { allKegiatan } from "@/data/mockData";
import { aggregateProgramPagu } from "@/utils/programCategorization";
import { ProgramDetailModal } from "./ProgramDetailModal";

interface DistribusiPaguWidgetProps {
  activities?: Activity[];
  onNavigate?: (menu: string) => void;
}

export function DistribusiPaguWidget({
  activities = allKegiatan,
  onNavigate,
}: DistribusiPaguWidgetProps) {
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<{
    name: string;
    color: string;
    value: number;
  } | null>(null);

  const programPaguData = useMemo(() => {
    return aggregateProgramPagu(activities);
  }, [activities]);

  const totalPaguValue = useMemo(() => {
    return programPaguData.reduce((sum, d) => sum + d.value, 0);
  }, [programPaguData]);

  const activeSegment = programPaguData.find(
    (segment) => segment.label === hoveredLabel
  );

  const displayLabel = activeSegment?.label ?? "Total Pagu (DIPA)";
  const displayValueNominal = activeSegment?.value ?? totalPaguValue;
  const displayPercentage =
    activeSegment && totalPaguValue > 0
      ? (activeSegment.value / totalPaguValue) * 100
      : 100;

  const handleProgramClick = (label: string) => {
    const target = programPaguData.find((p) => p.label === label);
    if (target) {
      setSelectedProgram({
        name: target.label,
        color: target.color,
        value: target.value,
      });
    }
  };

  return (
    <div className="bg-slate-50/70 rounded-xl p-5 sm:p-6 border border-slate-200 flex flex-col justify-between h-full min-h-[440px]">
      <div>
        <div className="flex items-center justify-between mb-1">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase block mb-0.5">
              ALOKASI ANGGARAN
            </span>
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              DISTRIBUSI PAGU PER PROGRAM
            </h4>
          </div>
          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            TA 2026
          </span>
        </div>
        <p className="text-xs text-slate-500 mb-2">
          Proporsi alokasi anggaran Instansi · <span className="text-emerald-700 font-medium">Klik segmen/legend untuk rincian</span>
        </p>
      </div>

      <div className="py-2 flex items-center justify-center">
        <DonutChart
          data={programPaguData}
          size={210}
          strokeWidth={24}
          animationDuration={1.1}
          animationDelayPerSegment={0.06}
          highlightOnHover={true}
          activeSegmentLabel={hoveredLabel}
          onSegmentHover={(seg) => setHoveredLabel(seg?.label || null)}
          onSegmentClick={(seg) => handleProgramClick(seg.label)}
          centerContent={
            <AnimatePresence mode="wait">
              <motion.div
                key={displayLabel}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="flex flex-col items-center justify-center text-center max-w-[130px] cursor-pointer"
                onClick={() => {
                  if (activeSegment) {
                    handleProgramClick(activeSegment.label);
                  }
                }}
              >
                <p
                  className="text-[10px] font-semibold text-slate-500 truncate w-full"
                  title={displayLabel}
                >
                  {displayLabel}
                </p>
                <p className="text-base sm:text-lg font-bold text-slate-900 leading-tight mt-0.5">
                  {fmtMiliar(displayValueNominal)}
                </p>
                {activeSegment ? (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded mt-0.5 flex items-center gap-1">
                    [{displayPercentage.toFixed(1)}%] <span>↗</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                    {programPaguData.length} Program
                  </span>
                )}
              </motion.div>
            </AnimatePresence>
          }
        />
      </div>

      <div className="space-y-1.5 text-xs border-t border-slate-200/80 pt-3 mt-1">
        {programPaguData.map((d, index) => {
          const isHovered = hoveredLabel === d.label;
          const pct = ((d.value / totalPaguValue) * 100).toFixed(1);

          return (
            <motion.div
              key={d.label}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.05, duration: 0.3 }}
              onMouseEnter={() => setHoveredLabel(d.label)}
              onMouseLeave={() => setHoveredLabel(null)}
              onClick={() => handleProgramClick(d.label)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleProgramClick(d.label);
                }
              }}
              className={cn(
                "group flex items-center justify-between p-2 rounded-lg transition-all duration-150 cursor-pointer select-none",
                isHovered
                  ? "bg-slate-100/90 shadow-2xs border border-slate-300/80 scale-[1.02]"
                  : "hover:bg-slate-100/70 border border-transparent"
              )}
            >
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <span
                  className={cn(
                    "w-2.5 h-2.5 rounded-full flex-shrink-0 transition-transform duration-150",
                    isHovered ? "scale-125 shadow-xs" : ""
                  )}
                  style={{ backgroundColor: d.color }}
                />
                <span
                  className={cn(
                    "text-xs truncate transition-colors",
                    isHovered ? "font-bold text-slate-900" : "text-slate-600"
                  )}
                  title={d.label}
                >
                  {d.label}
                </span>
                <span className="text-[10.5px] text-slate-400 font-medium">
                  ({pct}%)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "text-xs whitespace-nowrap transition-colors",
                    isHovered ? "font-bold text-slate-900" : "font-semibold text-slate-700"
                  )}
                >
                  {fmtRupiah(d.value)}
                </span>
                <span className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity text-[11px]">
                  ↗
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <ProgramDetailModal
        isOpen={Boolean(selectedProgram)}
        onClose={() => setSelectedProgram(null)}
        programName={selectedProgram?.name || null}
        programColor={selectedProgram?.color}
        programPagu={selectedProgram?.value}
        activities={activities}
        onNavigate={onNavigate}
      />
    </div>
  );
}
