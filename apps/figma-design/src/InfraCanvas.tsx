import { useState } from "react";
import type { JourneyStep } from "./scenario";
import { DEMAND_HISTORY, BILLING_HISTORY, OFFER } from "./scenario";

interface InfraCanvasProps {
  journeyStep: JourneyStep;
  selectedId: string | null;
  onSelectServer: (id: string) => void;
  onSelectService: (serverId: string, serviceId: string) => void;
  onAddServer: () => void;
}

/* ─── Helpers ──────────────────────────────────────────────────────── */
function ResBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div style={{ marginBottom: 5 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontSize: 8, fontWeight: 700, color, letterSpacing: ".08em" }}>{label}</span>
        <span style={{ fontSize: 8, fontFamily: "var(--font-mono)", color }}>{pct}%</span>
      </div>
      <div style={{ height: 3, borderRadius: 2, background: "var(--bg-5)" }}>
        <div style={{ height: "100%", borderRadius: 2, background: color, width: `${pct}%`, transition: "width .4s" }} />
      </div>
    </div>
  );
}

function SvcPill({
  shortName, state, progress, selected, onClick,
}: {
  shortName: string; state: string; progress?: number;
  selected: boolean; onClick: (e: React.MouseEvent) => void;
}) {
  const lampCls =
    state === "running"   ? "lamp lamp-g"
    : state === "installing" || state === "queued" ? "lamp lamp-s pulse"
    : state === "failed"  ? "lamp lamp-r"
    : state === "configured" ? "lamp lamp-a"
    : "lamp lamp-x";

  const stateLabel =
    state === "running"    ? "Running"
    : state === "installing" ? "Installing…"
    : state === "queued"   ? "Queued"
    : state === "failed"   ? "Failed"
    : state === "configured" ? "Ready"
    : "Stopped";

  return (
    <button
      onClick={onClick}
      style={{
        width: 116, padding: "7px 10px",
        borderRadius: 5,
        border: `1px solid ${selected ? "var(--green-dim)" : "var(--border-1)"}`,
        background: selected ? "var(--green-surf)" : "var(--bg-3)",
        cursor: "pointer", textAlign: "left",
        transition: "all .12s", position: "relative", overflow: "hidden",
      }}
    >
      {state === "installing" && progress !== undefined && (
        <div className="prog-pulse" style={{
          position: "absolute", bottom: 0, left: 0,
          height: 2, width: `${progress}%`,
          background: "var(--sky)", borderRadius: "0 1px 0 0",
        }} />
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
        <div className={lampCls} />
        <span style={{ fontSize: 10, fontWeight: 700, color: selected ? "var(--green-hi)" : "var(--txt-0)", fontFamily: "var(--font-mono)" }}>
          {shortName}
        </span>
      </div>
      <div style={{ fontSize: 9, color: "var(--txt-2)" }}>{stateLabel}</div>
    </button>
  );
}

/* ─── Server Rack card ─────────────────────────────────────────────── */
function ServerRack({
  selected, selectedServiceId, services, cpu, ram, disk, net, journeyStep, onSelect, onSelectService,
}: {
  selected: boolean; selectedServiceId: string | null;
  services: Array<{ id: string; shortName: string; state: string; progress?: number }>;
  cpu: number; ram: number; disk: number; net: number;
  journeyStep: JourneyStep;
  onSelect: () => void;
  onSelectService: (id: string) => void;
}) {
  const isLive = ["live", "live-degraded", "live-incident"].includes(journeyStep);
  const serverState = journeyStep === "live-incident" ? "failed" : "healthy";
  const lampCls = serverState === "healthy" ? "lamp lamp-g" : "lamp lamp-r";

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      style={{
        background: "var(--bg-2)",
        border: `1px solid ${selected ? "var(--border-2)" : "var(--border-0)"}`,
        borderRadius: 8,
        padding: "10px 12px",
        minWidth: 260, maxWidth: 320,
        cursor: "pointer",
        transition: "border-color .12s",
        boxShadow: selected ? "0 0 0 1px var(--border-2)" : "none",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div className={lampCls} />
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--txt-0)" }}>Server A</span>
        <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 3, background: "var(--bg-4)", color: "var(--txt-2)", fontFamily: "var(--font-mono)" }}>
          general-small
        </span>
        <span style={{ marginLeft: "auto", fontSize: 9, padding: "1px 6px", borderRadius: 3, background: "var(--bg-4)", color: "var(--txt-2)" }}>
          owned
        </span>
      </div>

      {/* Service slots */}
      <div style={{
        background: "var(--bg-0)", border: "1px solid var(--border-0)",
        borderRadius: 5, padding: "7px", minHeight: 60,
        display: "flex", flexWrap: "wrap", gap: 5, alignContent: "flex-start",
        marginBottom: 8,
      }}>
        {services.length === 0 ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--txt-2)", fontSize: 10 }}>
            No services installed
          </div>
        ) : services.map((s) => (
          <SvcPill
            key={s.id} shortName={s.shortName} state={s.state}
            progress={s.progress}
            selected={selectedServiceId === s.id}
            onClick={(e) => { e.stopPropagation(); onSelectService(s.id); }}
          />
        ))}
      </div>

      {/* Resource bars */}
      {isLive ? (
        <div style={{ paddingTop: 4 }}>
          <ResBar label="CPU"  pct={cpu}  color="var(--sky)" />
          <ResBar label="RAM"  pct={ram}  color="var(--green)" />
          <ResBar label="DISK" pct={disk} color="var(--amber)" />
          <ResBar label="NET"  pct={net}  color="var(--txt-m)" />
        </div>
      ) : journeyStep !== "server-acquired" ? (
        <div style={{ paddingTop: 4 }}>
          <ResBar label="CPU" pct={0} color="var(--sky)" />
          <ResBar label="RAM" pct={0} color="var(--green)" />
        </div>
      ) : (
        <div style={{ fontSize: 9, color: "var(--txt-2)" }}>No data · no services running</div>
      )}
    </div>
  );
}

/* ─── Add server slot ──────────────────────────────────────────────── */
function AddServerSlot({ onAdd }: { onAdd: () => void }) {
  return (
    <button
      onClick={onAdd}
      style={{
        minWidth: 180, height: 130, borderRadius: 8,
        border: "1px dashed var(--border-1)", background: "transparent",
        cursor: "pointer", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 7,
        color: "var(--txt-2)", transition: "all .12s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-2)"; e.currentTarget.style.color = "var(--txt-1)"; e.currentTarget.style.background = "var(--bg-2)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-1)"; e.currentTarget.style.color = "var(--txt-2)"; e.currentTarget.style.background = "transparent"; }}
    >
      <span style={{ fontSize: 24, opacity: .4 }}>+</span>
      <span style={{ fontSize: 11, fontWeight: 600 }}>Add server</span>
      <span style={{ fontSize: 9, opacity: .6, textAlign: "center", maxWidth: 130, lineHeight: 1.4 }}>
        Buy or lease compatible hardware
      </span>
    </button>
  );
}

/* ─── Section wrapper — collapsible full-width secondary header ─────── */
function Section({ title, accent, sub, flush, defaultOpen = true, children }: {
  title: string; accent?: string; sub?: string; flush?: boolean; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          padding: "7px 20px",
          display: "flex", alignItems: "center", gap: 8,
          background: "var(--bg-2)",
          flexShrink: 0, width: "100%", cursor: "pointer",
          outline: "none",
          borderTop: "1px solid var(--border-0)",
          borderBottom: "1px solid var(--border-0)",
          borderLeft: "none", borderRight: "none",
          textAlign: "left",
        }}
      >
        <div
          className="sec-dot"
          style={accent ? { background: accent, boxShadow: `0 0 5px ${accent}` } : undefined}
        />
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".08em", color: "var(--txt-0)", textTransform: "uppercase" }}>
          {title}
        </span>
        {sub && (
          <span style={{ fontSize: 9, color: "var(--txt-2)", fontFamily: "var(--font-mono)", marginLeft: "auto", marginRight: 6 }}>{sub}</span>
        )}
        <span style={{ fontSize: 9, color: "var(--txt-2)", marginLeft: sub ? 0 : "auto", lineHeight: 1 }}>
          {open ? "▾" : "▸"}
        </span>
      </button>
      {open && (
        <div style={flush ? undefined : { padding: "16px 20px" }}>
          {children}
        </div>
      )}
    </div>
  );
}

/* ─── Setup checklist ──────────────────────────────────────────────── */
function SetupChecklist({ journeyStep }: { journeyStep: JourneyStep }) {
  const appDone = !["server-acquired", "app-installing"].includes(journeyStep);
  const dbDone  = !["server-acquired", "app-installing", "db-installing"].includes(journeyStep);
  const cfgDone = ["ready-to-start", "live", "live-degraded", "live-incident"].includes(journeyStep);

  const elapsed = journeyStep === "ready-to-start" ? "5h" : cfgDone ? "7h" : "2h";

  const items = [
    {
      label: "Acquire server hardware", done: true,
      installing: false, progress: undefined,
      note: "Server A · general-small",
    },
    {
      label: "Install Application Runtime", done: appDone,
      installing: journeyStep === "app-installing",
      progress: journeyStep === "app-installing" ? 55 : undefined,
      note: "2h install time",
    },
    {
      label: "Install Relational Database", done: dbDone,
      installing: journeyStep === "db-installing",
      progress: journeyStep === "db-installing" ? 30 : undefined,
      note: "2h install time",
    },
    {
      label: "Configure DB connection", done: cfgDone,
      installing: journeyStep === "configuring",
      progress: journeyStep === "configuring" ? 70 : undefined,
      note: "1h configuration work",
    },
  ];

  return (
    <div>
      <div style={{ fontSize: 9, color: "var(--txt-2)", fontFamily: "var(--font-mono)", marginBottom: 12 }}>
        Elapsed {elapsed}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map((item) => {
          const borderColor = item.done ? "var(--green-dim)" : item.installing ? "var(--border-2)" : "var(--border-0)";
          const bg = item.done ? "var(--green-surf)" : item.installing ? "var(--bg-3)" : "var(--bg-2)";
          return (
            <div
              key={item.label}
              style={{
                display: "flex", gap: 10, padding: "8px 10px",
                borderRadius: 5, background: bg, border: `1px solid ${borderColor}`,
              }}
            >
              {/* Check circle */}
              <div style={{
                width: 17, height: 17, borderRadius: "50%", flexShrink: 0,
                border: `1.5px solid ${item.done ? "var(--green)" : item.installing ? "var(--sky)" : "var(--border-2)"}`,
                background: item.done ? "var(--green)" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginTop: 1, fontSize: 9,
                color: item.done ? "#000" : item.installing ? "var(--sky)" : "var(--txt-2)",
              }}>
                {item.done ? "✓" : item.installing ? "…" : ""}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 11, fontWeight: 600,
                  color: item.done ? "var(--green-hi)" : item.installing ? "var(--txt-0)" : "var(--txt-1)",
                }}>
                  {item.label}
                </div>
                {item.installing && item.progress !== undefined && (
                  <div className="rbar" style={{ marginTop: 5 }}>
                    <div className="rbar-fill prog-pulse" style={{ width: `${item.progress}%`, background: "var(--sky)" }} />
                  </div>
                )}
                <div style={{ fontSize: 9, color: "var(--txt-2)", marginTop: 3 }}>{item.note}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Chart + stat primitives ──────────────────────────────────────── */

// Extra mock data derived from scenario context
const SLA_DAILY = [97.2, 98.1, 95.6, 96.8, 94.3, 96.1, 95.2]; // 7 days
const SLA_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SLA_HOURLY: number[] = [
  96,97,98,97,96,95,97,98,99,98,97,96,95,94,96,97,98,97,96,95,
  74,72,76,75,78,92,95,96,97,98,97,96,95,94,96,95,97,98,
  71,69,73,77,82,88,93,95,96,97,98,97,96,95,97,98,96,94,
  93,95,97,98,99,98,97,96,95,96,97,98,97,
];
const CPU_HISTORY = [3,4,3,3,4,8,15,22,28,30,29,28,26,25,24,28,30,29,18,12,6,4,3,3];
const RAM_HISTORY = [35,35,36,35,36,37,40,44,46,47,47,46,45,45,44,46,47,47,43,41,39,37,36,35];
// rootMix: 80% reads, 20% writes
const READS_HISTORY  = DEMAND_HISTORY.map((v) => Math.round(v * 0.8));
const WRITES_HISTORY = DEMAND_HISTORY.map((v) => Math.round(v * 0.2));
const WEEKLY_EARNED = [0, 80, 40]; // W-1, W1, current half-week
const WEEKLY_COSTS  = [0, 17.77, 8.9];
const WEEKLY_LABELS = ["W-1", "Week 1", "Week 2½"];

function Sparkline({ data, color, refLine }: { data: number[]; color: string; refLine?: number }) {
  const max = Math.max(...data, refLine ?? 0);
  const min = Math.min(...data);
  const range = max - min || 1;
  const W = 400, H = 48;
  const px = (v: number) => H - ((v - min) / range) * (H - 3) - 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * W},${px(v)}`);
  const path = "M " + pts.join(" L ");
  const refY = refLine !== undefined ? px(refLine) : null;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block", width: "100%" }}>
      <path d={`${path} L ${W},${H} L 0,${H} Z`} fill={color} opacity={0.07} />
      <path d={path} stroke={color} fill="none" strokeWidth={1.5} />
      {refY !== null && (
        <>
          <line x1={0} y1={refY} x2={W} y2={refY} stroke="var(--amber)" strokeWidth={1} strokeDasharray="4 3" opacity={0.7} />
          <text x={W - 2} y={refY - 3} textAnchor="end" fontSize={8} fill="var(--amber)" fontFamily="monospace">target</text>
        </>
      )}
    </svg>
  );
}

function BarChart({
  values, labels, refLine,
}: {
  values: number[]; labels: string[]; refLine?: number;
}) {
  const max = Math.max(...values, refLine ?? 0) * 1.08 || 1;
  const H = 52;
  const n = values.length;
  const BAR_W = 8;
  const GAP = 3;
  const W = n * (BAR_W + GAP) - GAP;

  return (
    <svg viewBox={`0 0 ${W} ${H + 14}`} style={{ display: "block", width: "100%", overflow: "visible" }}>
      {/* target line */}
      {refLine !== undefined && (() => {
        const y = H - (refLine / max) * H;
        return (
          <line x1={0} y1={y} x2={W} y2={y}
            stroke="var(--amber)" strokeWidth={1} strokeDasharray="3 2" opacity={0.65} />
        );
      })()}
      {values.map((v, i) => {
        const barH = Math.max(2, (v / max) * H);
        const x = i * (BAR_W + GAP);
        const ok = refLine === undefined || v >= refLine;
        const fill = ok ? "var(--green)" : "var(--red)";
        return (
          <g key={i}>
            <rect x={x} y={H - barH} width={BAR_W} height={barH} rx={1} fill={fill} opacity={0.85} />
            <text x={x + BAR_W / 2} y={H + 11} textAnchor="middle" fontSize={7}
              fill="var(--txt-2)" fontFamily="monospace">{labels[i]}</text>
          </g>
        );
      })}
    </svg>
  );
}

function MultiLineChart({
  series, yLabels,
}: {
  series: { data: number[]; color: string; label: string }[];
  yLabels?: [string, string];
}) {
  const allVals = series.flatMap((s) => s.data);
  const max = Math.max(...allVals) * 1.08 || 1;
  const min = Math.min(0, Math.min(...allVals));
  const range = max - min || 1;
  const W = 400, H = 60;
  const px = (v: number, i: number, len: number) =>
    `${(i / (len - 1)) * W},${H - ((v - min) / range) * (H - 3) - 1}`;

  return (
    <div>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block", width: "100%" }}>
        {series.map(({ data, color }) => {
          const pts = data.map((v, i) => px(v, i, data.length));
          return <path key={color} d={"M " + pts.join(" L ")} stroke={color} fill="none" strokeWidth={1.5} />;
        })}
      </svg>
      {/* Legend */}
      <div style={{ display: "flex", gap: 14, marginTop: 8 }}>
        {series.map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 18, height: 2, borderRadius: 1, background: color }} />
            <span style={{ fontSize: 8, color: "var(--txt-2)", fontFamily: "var(--font-mono)" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChartCard({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: "var(--txt-2)", letterSpacing: ".08em", textTransform: "uppercase" }}>{label}</span>
        {sub && <span style={{ fontSize: 9, color: "var(--txt-2)", fontFamily: "var(--font-mono)" }}>{sub}</span>}
      </div>
      <div style={{ background: "var(--bg-0)", border: "1px solid var(--border-0)", borderRadius: 5, padding: "10px 12px" }}>
        {children}
      </div>
    </div>
  );
}

function StatCell({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ padding: "8px 10px", borderRadius: 5, background: "var(--bg-2)", border: "1px solid var(--border-0)" }}>
      <div style={{ fontSize: 9, color: "var(--txt-2)", fontWeight: 700, letterSpacing: ".06em", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "var(--font-mono)", color: color ?? "var(--txt-0)" }}>{value}</div>
    </div>
  );
}

function DataRow({ label, value, color, mono = true }: { label: string; value: string; color?: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border-0)", fontSize: 11 }}>
      <span style={{ color: "var(--txt-2)" }}>{label}</span>
      <span style={{ color: color ?? "var(--txt-0)", fontWeight: 700, fontFamily: mono ? "var(--font-mono)" : undefined }}>{value}</span>
    </div>
  );
}

/* ─── Status tab ─────────────────────────────────────────────────────── */
function LiveStatusTab({ journeyStep }: { journeyStep: JourneyStep }) {
  const degraded = journeyStep === "live-degraded";
  const incident = journeyStep === "live-incident";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Alert banner */}
      {(degraded || incident) && (
        <div style={{
          padding: "8px 12px", borderRadius: 5, fontSize: 11, lineHeight: 1.5,
          border: `1px solid ${incident ? "var(--red-dim)" : "var(--amber-dim)"}`,
          background: incident ? "var(--red-surf)" : "var(--amber-surf)",
          color: incident ? "var(--red-hi)" : "var(--amber-hi)",
        }}>
          {incident
            ? "Application Runtime has failed. Service is not accepting requests."
            : "CPU utilisation at 82% — approaching warning threshold."}
        </div>
      )}

      {/* SLA bars — thin vertical columns, full width */}
      <svg viewBox={`0 0 ${SLA_HOURLY.length * 6} 40`} style={{ display: "block", width: "100%", height: 40 }}>
        {SLA_HOURLY.map((v, i) => {
          const barH = Math.max(2, ((v - 60) / 40) * 40);
          return (
            <rect
              key={i}
              x={i * 6} y={40 - barH}
              width={4} height={barH}
              rx={1}
              fill={v >= 80 ? "var(--green)" : "var(--red)"}
              opacity={0.9}
            />
          );
        })}
      </svg>

      {/* Data rows */}
      <div>
        <DataRow label="SLA (now)"              value="95.2%" color="var(--green)" />
        <DataRow label="SLA target"             value="80.0%" />
        <DataRow label="Failures this hour"     value="6/h"   color={incident ? "var(--red)" : "var(--txt-2)"} />
        <DataRow label="Uptime this period"     value="95.2%" color="var(--green)" />
        <DataRow label="Allowed failure budget" value="20.0%" />
        <DataRow label="Budget consumed"        value="24.1%" color="var(--amber)" />
        <DataRow label="Services healthy"       value="2 / 2" color="var(--green)" />
      </div>
    </div>
  );
}

/* ─── Performance tab — demand by type + server supply ─────────────── */
function LivePerformanceTab() {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {/* Demand breakdown */}
      <ChartCard label="Page reads — last 24h" sub="80% of traffic · ~96/h avg">
        <Sparkline data={READS_HISTORY} color="var(--sky)" />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          <span style={{ fontSize: 8, color: "var(--txt-2)", fontFamily: "var(--font-mono)" }}>00:00</span>
          <span style={{ fontSize: 8, color: "var(--txt-2)", fontFamily: "var(--font-mono)" }}>now</span>
        </div>
      </ChartCard>

      <ChartCard label="Record writes — last 24h" sub="20% of traffic · ~24/h avg">
        <Sparkline data={WRITES_HISTORY} color="var(--amber)" />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          <span style={{ fontSize: 8, color: "var(--txt-2)", fontFamily: "var(--font-mono)" }}>00:00</span>
          <span style={{ fontSize: 8, color: "var(--txt-2)", fontFamily: "var(--font-mono)" }}>now</span>
        </div>
      </ChartCard>

      {/* Server supply */}
      <ChartCard label="Server A — CPU utilisation" sub="2 vCPU · 7% now">
        <Sparkline data={CPU_HISTORY} color="var(--sky)" />
      </ChartCard>

      <ChartCard label="Server A — RAM utilisation" sub="2 GiB · 41% now">
        <Sparkline data={RAM_HISTORY} color="var(--green)" />
      </ChartCard>
    </div>
  );
}

/* ─── Finances tab — multi-line revenue/costs/net chart ─────────────── */
function LiveFinancesTab() {
  const WEEKLY_NET = WEEKLY_EARNED.map((e, i) => parseFloat((e - WEEKLY_COSTS[i]).toFixed(2)));

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {/* Single multi-line chart */}
      <ChartCard label="Revenue · costs · net — by period">
        <MultiLineChart series={[
          { data: WEEKLY_EARNED, color: "var(--green)", label: "Earned" },
          { data: WEEKLY_COSTS,  color: "var(--red)",   label: "Costs" },
          { data: WEEKLY_NET,    color: "var(--txt-m)", label: "Net" },
        ]} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
          {WEEKLY_LABELS.map((l) => (
            <span key={l} style={{ fontSize: 7, color: "var(--txt-2)", fontFamily: "monospace" }}>{l}</span>
          ))}
        </div>
      </ChartCard>

      {/* Detailed breakdown */}
      <DataRow label="Advance received"          value="♦80.00"  color="var(--green)" />
      <DataRow label="Fixed fee W1 (full)"       value="♦80.00"  color="var(--green)" />
      <DataRow label="Fixed fee W2 (half)"       value="♦40.00"  color="var(--green)" />
      <DataRow label="Server A opex (W1)"        value="−♦17.77" color="var(--red)" />
      <DataRow label="Server A opex (W2 half)"   value="−♦8.90"  color="var(--red)" />
      <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 4px", fontSize: 13 }}>
        <span style={{ color: "var(--txt-1)", fontWeight: 600 }}>Net contribution</span>
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 800, color: "var(--green)" }}>♦173.33</span>
      </div>
    </div>
  );
}

function LiveTabs({ journeyStep }: { journeyStep: JourneyStep }) {
  const [tab, setTab] = useState<"status" | "performance" | "finances">("status");
  const tabs = [
    { id: "status" as const,      label: "Status" },
    { id: "performance" as const, label: "Performance" },
    { id: "finances" as const,    label: "Finances" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {/* Flat full-width tab strip — flush, no padding */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border-0)" }}>
        {tabs.map((t, i) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, height: 32,
              border: "none",
              borderBottom: tab === t.id ? "2px solid var(--green)" : "2px solid transparent",
              borderRight: i < tabs.length - 1 ? "1px solid var(--border-0)" : "none",
              background: tab === t.id ? "var(--bg-3)" : "transparent",
              color: tab === t.id ? "var(--txt-0)" : "var(--txt-2)",
              cursor: "pointer", fontSize: 9, fontWeight: 700,
              letterSpacing: ".07em", textTransform: "uppercase",
              transition: "all .1s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      {/* Tab content with padding */}
      <div style={{ padding: "16px 20px" }}>
        {tab === "status"      && <LiveStatusTab journeyStep={journeyStep} />}
        {tab === "performance" && <LivePerformanceTab />}
        {tab === "finances"    && <LiveFinancesTab />}
      </div>
    </div>
  );
}

/* ─── Main Canvas ──────────────────────────────────────────────────── */
export default function InfraCanvas({
  journeyStep, selectedId, onSelectServer, onSelectService, onAddServer,
}: InfraCanvasProps) {
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  const hasServer = !["empty", "offer-list", "contract-review", "accepted-no-server", "acquiring"].includes(journeyStep);
  const isLive    = ["live", "live-degraded", "live-incident"].includes(journeyStep);
  const isSetup   = hasServer && !isLive;

  const appState =
    journeyStep === "server-acquired" ? "absent"
    : journeyStep === "app-installing" ? "installing"
    : ["db-installing", "configuring", "ready-to-start"].includes(journeyStep) ? "stopped"
    : isLive ? "running" : "absent";

  const dbState =
    ["server-acquired", "app-installing"].includes(journeyStep) ? "absent"
    : journeyStep === "db-installing" ? "installing"
    : journeyStep === "configuring" ? "stopped"
    : journeyStep === "ready-to-start" ? "configured"
    : isLive ? "running" : "absent";

  const services = hasServer ? [
    appState !== "absent" && { id: "svc-app", shortName: "App Runtime", state: appState, progress: journeyStep === "app-installing" ? 55 : undefined },
    dbState  !== "absent" && { id: "svc-db",  shortName: "Rel. DB",     state: dbState,  progress: journeyStep === "db-installing"  ? 30 : undefined },
  ].filter(Boolean) as Array<{ id: string; shortName: string; state: string; progress?: number }> : [];

  return (
    <div
      style={{ flex: 1, display: "flex", flexDirection: "column", gap: 0, overflowY: "auto", minHeight: 0 }}
      onClick={() => { onSelectServer(""); setSelectedServiceId(null); }}
    >
      {/* ── Section 0: Contract ── */}
      {hasServer && (
        <Section title="Contract" sub={OFFER.customer} defaultOpen={false}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 32px" }}>
            {/* Left col */}
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: "var(--txt-2)", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 8 }}>Service obligations</div>
              <DataRow label="Availability (SLA)"    value={`${OFFER.sla}%`} color="var(--txt-0)" />
              <DataRow label="Measurement period"    value="Per 168h billing week" mono={false} />
              <DataRow label="Setup allowance"       value={`${OFFER.setupAllowanceHours}h from acceptance`} mono={false} />
              <DataRow label="Demand"                value={`${OFFER.demandPerHour} req/h · office hours`} mono={false} />
              <DataRow label="Demand mix"            value={OFFER.rootMix} mono={false} />

              <div style={{ fontSize: 9, fontWeight: 700, color: "var(--txt-2)", letterSpacing: ".08em", textTransform: "uppercase", marginTop: 16, marginBottom: 8 }}>Refund schedule — missed SLA</div>
              {OFFER.refundBands.map((b) => (
                <DataRow key={b.label} label={b.label} value={`${b.pct}% of fee`}
                  color={b.pct >= 50 ? "var(--red)" : "var(--amber)"} />
              ))}
              <DataRow label="All demand missed" value="100% of fee" color="var(--red)" />
            </div>

            {/* Right col */}
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: "var(--txt-2)", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 8 }}>Payment</div>
              <DataRow label="Advance on acceptance" value={`♦${OFFER.advance}`}   color="var(--green)" />
              <DataRow label="Weekly fixed fee"      value={`♦${OFFER.weeklyFee}`} color="var(--green)" />
              <DataRow label="Usage fee"             value="None" />

              <div style={{ fontSize: 9, fontWeight: 700, color: "var(--txt-2)", letterSpacing: ".08em", textTransform: "uppercase", marginTop: 16, marginBottom: 8 }}>Required technologies</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", paddingBottom: 12 }}>
                {OFFER.requiredTechnologies.map((t) => (
                  <span key={t} style={{
                    fontSize: 10, padding: "3px 9px", borderRadius: 20,
                    background: "var(--green-surf)", border: "1px solid var(--green-dim)", color: "var(--green)",
                  }}>{t}</span>
                ))}
              </div>

              <div style={{ fontSize: 9, fontWeight: 700, color: "var(--txt-2)", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 8 }}>Cancellation</div>
              <div style={{ fontSize: 11, color: "var(--txt-1)", lineHeight: 1.7 }}>
                {OFFER.cancellationTerms}
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* ── Section 1: Infrastructure ── */}
      {(hasServer || journeyStep === "accepted-no-server" || journeyStep === "acquiring") && (
        <Section title="Infrastructure">
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Demand node */}
            <div style={{
              padding: "10px 12px", borderRadius: 6, flexShrink: 0,
              border: "1px solid var(--border-0)", background: "var(--bg-2)",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            }}>
              <div style={{ fontSize: 16, color: isLive ? "var(--sky)" : "var(--txt-2)" }}>↓</div>
              <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: isLive ? "var(--sky)" : "var(--txt-2)" }}>
                {isLive ? "112" : "0"}/h
              </div>
              <div style={{ fontSize: 8, color: "var(--txt-2)", letterSpacing: ".05em" }}>DEMAND</div>
            </div>

            {/* Arrow */}
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ width: 20, height: 1, background: isLive ? "var(--green)" : "var(--border-1)" }} />
              <div style={{ width: 0, height: 0, borderTop: "4px solid transparent", borderBottom: "4px solid transparent", borderLeft: `6px solid ${isLive ? "var(--green)" : "var(--border-1)"}` }} />
            </div>

            {hasServer ? (
              <ServerRack
                selected={selectedId === "server-a"}
                selectedServiceId={selectedServiceId}
                services={services}
                cpu={isLive ? 7 : 0} ram={isLive ? 41 : 0} disk={isLive ? 18 : 0} net={isLive ? 2 : 0}
                journeyStep={journeyStep}
                onSelect={() => { onSelectServer("server-a"); setSelectedServiceId(null); }}
                onSelectService={(id) => { setSelectedServiceId(id); onSelectServer("server-a"); onSelectService("server-a", id); }}
              />
            ) : (
              <AddServerSlot onAdd={onAddServer} />
            )}
          </div>
        </Section>
      )}

      {/* ── Section 2: Setup checklist ── */}
      {isSetup && (
        <Section title="Setup checklist" accent="var(--sky)" sub="Allowance 24h">
          <SetupChecklist journeyStep={journeyStep} />
        </Section>
      )}

      {/* ── Section 2: Live project status ── */}
      {isLive && (
        <Section title="Project status" accent="var(--green)" flush>
          <LiveTabs journeyStep={journeyStep} />
        </Section>
      )}

      {/* ── Empty / no project ── */}
      {!hasServer && journeyStep !== "accepted-no-server" && journeyStep !== "acquiring" && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10, color: "var(--txt-2)", padding: 32 }}>
          <div style={{ fontSize: 40, opacity: .1 }}>⬡</div>
          <div style={{ fontSize: 13, color: "var(--txt-1)" }}>Infrastructure canvas</div>
          <div style={{ fontSize: 11, opacity: .6 }}>Accept a project to begin setup</div>
        </div>
      )}
    </div>
  );
}
