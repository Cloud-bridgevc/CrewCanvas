import { addDays, diffDays, eachDay, fmt, weekday } from "@/lib/dates";
import type { Dependency, ISODate, WorkPackage } from "@/lib/types";
import type { ReadinessState } from "@/lib/engine";
import { ScrollTo } from "./ScrollTo";
import { STATE_STYLE } from "./ui";

interface Props {
  workPackages: WorkPackage[];
  dependencies: Dependency[];
  states: Record<string, ReadinessState>;
  asOf: ISODate;
  from?: ISODate;
  to?: ISODate;
  highlight?: string[];
  /** Projected finish dates for slipping packages. */
  projected?: Record<string, ISODate>;
  dayWidth?: number;
}

const ROW = 34;
// Labels render in an HTML column beside the chart so only the bars scroll.
const LABEL_W = 0;
const HEAD = 44;

export function Gantt({ workPackages, dependencies, states, asOf, from, to, highlight = [], projected = {}, dayWidth = 24 }: Props) {
  const rows = [...workPackages].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const earliest = addDays(rows.reduce((m, w) => (w.startDate < m ? w.startDate : m), rows[0].startDate), -2);
  // Default to a 10-day look-back so today and the look-ahead stay in view.
  const start = from ?? (earliest < addDays(asOf, -10) ? addDays(asOf, -10) : earliest);
  const end = to ?? addDays(rows.reduce((m, w) => (w.endDate > m ? w.endDate : m), rows[0].endDate), 3);
  const days = eachDay(start, end);
  const width = LABEL_W + days.length * dayWidth;
  const height = HEAD + rows.length * ROW + 8;
  const x = (d: ISODate) => LABEL_W + Math.max(0, Math.min(days.length, diffDays(start, d))) * dayWidth;
  const idx = new Map(rows.map((w, i) => [w.id, i]));
  const y = (i: number) => HEAD + i * ROW;

  return (
    <div className="flex">
      <div className="w-[132px] flex-none border-r border-char-100 sm:w-[240px]" style={{ paddingTop: HEAD }}>
        {rows.map((w) => (
          <div key={w.id} className={`flex flex-col justify-center border-b border-char-100 px-2.5 sm:px-3 ${highlight.includes(w.id) ? "bg-safety-50" : ""}`} style={{ height: ROW }}>
            <span className="truncate text-[11px] font-semibold leading-tight text-char-900 sm:text-xs" title={w.name}>{w.name}</span>
            <span className="truncate font-mono text-[9.5px] leading-tight text-char-400 sm:text-[10px]">{w.code}<span className="hidden sm:inline"> · {w.zone}</span></span>
          </div>
        ))}
      </div>
      <ScrollTo x={x(asOf)} className="min-w-0 flex-1 overflow-x-auto">
      <svg width={width} height={height} className="block font-sans" role="img" aria-label="Project timeline">
        {/* Day grid */}
        {days.map((d, i) => {
          const wd = weekday(d);
          return (
            <g key={d}>
              {(wd === 0 || wd === 6) && <rect x={LABEL_W + i * dayWidth} y={HEAD - 8} width={dayWidth} height={height - HEAD + 8} fill="#f6f7f8" />}
              <line x1={LABEL_W + i * dayWidth} x2={LABEL_W + i * dayWidth} y1={HEAD - 8} y2={height} stroke={wd === 1 ? "#d9dcdf" : "#eceef0"} />
              {wd === 1 && (
                <text x={LABEL_W + i * dayWidth + 3} y={16} fontSize="11" fontWeight="600" fill="#454b52">
                  {fmt(d)}
                </text>
              )}
              <text x={LABEL_W + i * dayWidth + dayWidth / 2} y={32} fontSize="9.5" fill="#8a9199" textAnchor="middle">
                {"SMTWTFS"[wd]}
              </text>
            </g>
          );
        })}

        {/* Rows */}
        {rows.map((w, i) => {
          const state = states[w.id] ?? "not_verified";
          const bx = x(w.startDate);
          const bw = Math.max(dayWidth * 0.6, x(addDays(w.endDate, 1)) - bx);
          const hl = highlight.includes(w.id);
          const proj = projected[w.id];
          return (
            <g key={w.id}>
              <rect x={0} y={y(i)} width={width} height={ROW} fill={hl ? "rgba(242,107,29,0.07)" : "transparent"} />
              <line x1={0} x2={width} y1={y(i) + ROW} y2={y(i) + ROW} stroke="#eceef0" />
              {proj && proj > w.endDate && (
                <rect x={bx} y={y(i) + 9} width={x(addDays(proj, 1)) - bx} height={16} rx={4} fill="none" stroke="#c23b3b" strokeDasharray="3 3" />
              )}
              <rect x={bx} y={y(i) + 9} width={bw} height={16} rx={4} fill={STATE_STYLE[state].bar} opacity={w.status === "complete" ? 0.55 : 1}>
                <title>{`${w.name} · ${fmt(w.startDate)}–${fmt(w.endDate)} · ${w.percentComplete}%${proj && proj > w.endDate ? ` · projected finish ${fmt(proj)}` : ""}`}</title>
              </rect>
              {w.percentComplete > 0 && w.percentComplete < 100 && <rect x={bx} y={y(i) + 21} width={(bw * w.percentComplete) / 100} height={4} rx={2} fill="rgba(255,255,255,0.75)" />}
              {hl && <rect x={bx - 2} y={y(i) + 7} width={bw + 4} height={20} rx={5} fill="none" stroke="#f26b1d" strokeWidth={2} />}
            </g>
          );
        })}

        {/* Finish-to-start connectors */}
        {dependencies.map((d) => {
          const pi = idx.get(d.predecessorId);
          const si = idx.get(d.successorId);
          if (pi === undefined || si === undefined) return null;
          const p = rows[pi];
          const s = rows[si];
          const x1 = x(addDays(p.endDate, 1));
          const y1 = y(pi) + 17;
          const x2 = x(s.startDate);
          const y2 = y(si) + 17;
          const mid = Math.max(x1 + 6, Math.min(x2 - 6, x1 + 10));
          return (
            <path key={d.id} d={`M${x1} ${y1} H${mid} V${y2} H${x2 - 1}`} fill="none" stroke="#8fa7bf" strokeWidth={1.2} markerEnd="url(#arrow)" />
          );
        })}
        <defs>
          <marker id="arrow" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0 0 L6 3 L0 6 Z" fill="#8fa7bf" />
          </marker>
        </defs>

        {/* Today */}
        <line x1={x(asOf)} x2={x(asOf)} y1={HEAD - 10} y2={height} stroke="#f26b1d" strokeWidth={2} />
        <rect x={x(asOf) - 22} y={HEAD - 14} width={44} height={14} rx={3} fill="#f26b1d" />
        <text x={x(asOf)} y={HEAD - 4} fontSize="9.5" fontWeight="700" fill="white" textAnchor="middle">
          TODAY
        </text>
      </svg>
      </ScrollTo>
    </div>
  );
}
