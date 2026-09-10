import type { JourneyStep, WorkspaceTab } from "./scenario";
import { DEMAND_HISTORY, BILLING_HISTORY } from "./scenario";

interface InspectorPanelProps {
  journeyStep: JourneyStep;
  selectedId: string | null;
  selectedServiceId: string | null;
  tab: WorkspaceTab;
  onTabChange: (t: WorkspaceTab) => void;
  onAdvanceJourney: () => void;
  isMobile?: boolean;
  onClose?: () => void;
}

/* ─── Sparkline ─────────────────────────────────────────────────── */
function Sparkline({ data, color, height = 40 }: { data: number[]; color: string; height?: number }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 200, h = height;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  });
  const path = "M " + pts.join(" L ");
  const area = `${path} L ${w},${h} L 0,${h} Z`;

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="sparkline"
      style={{ display: "block", width: "100%" }}
      preserveAspectRatio="none"
    >
      <path d={area} fill={color} opacity={0.12} />
      <path d={path} stroke={color} fill="none" strokeWidth={1.5} />
    </svg>
  );
}

/* ─── Status tab ─────────────────────────────────────────────────── */
function StatusTab({ journeyStep }: { journeyStep: JourneyStep }) {
  const isLive = journeyStep === "live" || journeyStep === "live-degraded" || journeyStep === "live-incident";

  if (!isLive) {
    return (
      <div style={{ padding: "16px", color: "var(--text-muted)", fontSize: 12 }}>
        <div style={{ fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>Service not active</div>
        <div style={{ lineHeight: 1.6 }}>
          {journeyStep === "ready-to-start"
            ? "All requirements met. Start service to begin serving demand."
            : "Complete installation and configuration, then start service."}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "16px" }}>
      {/* State row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 14,
        }}
      >
        <div className="lamp lamp-green" />
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Live</span>
        {journeyStep === "live-degraded" && (
          <span
            style={{
              marginLeft: 4,
              fontSize: 10,
              padding: "2px 8px",
              borderRadius: 20,
              background: "rgba(245,158,11,0.1)",
              color: "var(--amber-main)",
              border: "1px solid var(--amber-dim)",
            }}
          >
            Capacity pressure
          </span>
        )}
      </div>

      {/* Demand chart */}
      <div style={{ marginBottom: 14 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 6,
          }}
        >
          <span style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 500 }}>Demand — last 24h</span>
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            requests/hour
          </span>
        </div>
        <div
          style={{
            background: "var(--navy-950)",
            borderRadius: 6,
            padding: "8px",
            border: "1px solid var(--navy-700)",
          }}
        >
          <Sparkline data={DEMAND_HISTORY} color="var(--sky-main)" height={48} />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 4,
            }}
          >
            <span style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>00:00</span>
            <span style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>now</span>
          </div>
        </div>
      </div>

      {/* Quick metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
        <Metric label="Current demand" value="112/h" unit="req" />
        <Metric label="SLA this week" value="95.2%" color="var(--green-main)" />
        <Metric label="SLA target" value="80.0%" />
        <Metric label="Completed" value="96.6%" />
      </div>

      {/* No warnings */}
      <div
        style={{
          fontSize: 11,
          color: "var(--text-muted)",
          background: "var(--navy-800)",
          borderRadius: 6,
          padding: "8px 10px",
          lineHeight: 1.5,
        }}
      >
        {journeyStep === "live-degraded"
          ? "CPU utilization at 82% — approaching warning threshold. Consider adding an instance."
          : "No active alerts. Server health and service state are normal."}
      </div>
    </div>
  );
}

/* ─── Performance tab ─────────────────────────────────────────────── */
function PerformanceTab({ journeyStep }: { journeyStep: JourneyStep }) {
  const isLive = journeyStep === "live" || journeyStep === "live-degraded" || journeyStep === "live-incident";

  if (!isLive) {
    return <NoDataTab message="Performance history available once service is live." />;
  }

  return (
    <div style={{ padding: "16px" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {["Current period", "Previous period"].map((label, i) => (
          <button
            key={label}
            style={{
              padding: "4px 10px",
              borderRadius: 6,
              border: "1px solid",
              fontSize: 11,
              cursor: "pointer",
              borderColor: i === 0 ? "var(--navy-300)" : "var(--navy-600)",
              background: i === 0 ? "var(--navy-700)" : "transparent",
              color: i === 0 ? "var(--text-primary)" : "var(--text-muted)",
              transition: "all 0.15s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {BILLING_HISTORY.map((period, i) => (
        <div
          key={i}
          style={{
            marginBottom: 16,
            padding: "12px",
            background: "var(--navy-800)",
            borderRadius: 8,
            border: "1px solid var(--navy-700)",
            display: i === 0 ? "block" : "none",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{period.label}</span>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Week 1</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <Metric label="SLA actual" value={`${period.slaActual}%`} color="var(--green-main)" />
            <Metric label="SLA target" value={`${period.slaTarget}%`} />
            <Metric label="Fixed fee earned" value={`♦${period.earned}`} />
            <Metric label="Operating costs" value={`♦${period.costs.toFixed(2)}`} />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              paddingTop: 8,
              borderTop: "1px solid var(--navy-700)",
            }}
          >
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Net this period</span>
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: period.balance >= 0 ? "var(--green-main)" : "var(--red-main)",
                fontFamily: "var(--font-mono)",
              }}
            >
              ♦{period.balance.toFixed(2)}
            </span>
          </div>
        </div>
      ))}

      <div
        style={{
          fontSize: 11,
          color: "var(--text-muted)",
          lineHeight: 1.6,
          padding: "8px 0",
        }}
      >
        No compensation applies this period. SLA is within contractual bounds.
      </div>
    </div>
  );
}

/* ─── Finances tab ─────────────────────────────────────────────────── */
function FinancesTab({ journeyStep }: { journeyStep: JourneyStep }) {
  const isLive = journeyStep === "live" || journeyStep === "live-degraded" || journeyStep === "live-incident";

  return (
    <div style={{ padding: "16px" }}>
      <div style={{ marginBottom: 14 }}>
        <Label>Cash received</Label>
        <FinRow label="Advance payment (Week 0)" value="♦80.00" note="on acceptance" />
        <FinRow label="Fixed fee earned (Week 1, first half)" value="♦40.00" note="accrued" />
        <FinRow label="Unearned advance (remaining)" value="♦40.00" note="held" muted />
      </div>

      <div style={{ marginBottom: 14 }}>
        <Label>Operating costs</Label>
        <FinRow label="Server A — maintenance & power" value="−♦8.90" note="7 days" />
        <FinRow label="Total costs to date" value="−♦8.90" />
      </div>

      <div
        style={{
          background: "var(--navy-800)",
          borderRadius: 8,
          padding: "10px 12px",
          border: "1px solid var(--navy-700)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Net project contribution</span>
        <span style={{ fontSize: 16, fontWeight: 700, color: "var(--green-main)", fontFamily: "var(--font-mono)" }}>
          ♦{isLive ? "31.10" : "—"}
        </span>
      </div>

      <div
        style={{
          fontSize: 11,
          color: "var(--text-muted)",
          lineHeight: 1.5,
        }}
      >
        The advance of ♦80 is cash received; only the earned portion (♦40 at week midpoint) counts as revenue.
        Remaining ♦40 is an obligation until the billing period closes.
      </div>
    </div>
  );
}

/* ─── Server inspector ─────────────────────────────────────────────── */
function ServerInspector({
  journeyStep, onAdvanceJourney,
}: {
  journeyStep: JourneyStep;
  onAdvanceJourney: () => void;
}) {
  const isSetup = !["live", "live-degraded", "live-incident"].includes(journeyStep);

  return (
    <div style={{ padding: "16px" }}>
      {/* Identity */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <div className="lamp lamp-green" />
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Server A</span>
          <span
            style={{
              fontSize: 9,
              padding: "2px 6px",
              borderRadius: 4,
              background: "var(--navy-650)",
              color: "var(--text-muted)",
              fontFamily: "var(--font-mono)",
            }}
          >
            general-small
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {[
            ["Cores", "2"],
            ["RAM", "2 GiB"],
            ["Disk", "64 GiB"],
            ["Network", "100 Mbps"],
            ["Ownership", "owned"],
            ["Cost/h", "♦0.08–0.14"],
          ].map(([k, v]) => (
            <div key={k}>
              <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 1 }}>{k}</div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: 1, background: "var(--navy-700)", marginBottom: 12 }} />

      {/* Primary action based on state */}
      {journeyStep === "server-acquired" && (
        <ActionGroup>
          <PrimaryAction label="Add service" onClick={onAdvanceJourney} />
          <SecondaryAction label="Power off" />
          <SecondaryAction label="Review sale — ♦192" destructive />
        </ActionGroup>
      )}

      {journeyStep === "app-installing" && (
        <ActionGroup>
          <div
            style={{
              padding: "10px 12px",
              background: "var(--navy-750)",
              borderRadius: 8,
              border: "1px solid var(--navy-500)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div className="lamp lamp-blue progress-pulse" />
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>
                Installing Application Runtime
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                ~1h remaining · View task
              </div>
            </div>
          </div>
          <SecondaryAction label="Inspect hosted services" />
        </ActionGroup>
      )}

      {(journeyStep === "db-installing" || journeyStep === "configuring") && (
        <ActionGroup>
          <div
            style={{
              padding: "10px 12px",
              background: "var(--navy-750)",
              borderRadius: 8,
              border: "1px solid var(--navy-500)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div className="lamp lamp-blue progress-pulse" />
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>
                {journeyStep === "db-installing" ? "Installing Relational Database" : "Configuring connection"}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                {journeyStep === "db-installing" ? "~2h remaining" : "~30m remaining"} · View task
              </div>
            </div>
          </div>
        </ActionGroup>
      )}

      {(journeyStep === "ready-to-start" || journeyStep === "live" || journeyStep === "live-degraded") && (
        <ActionGroup>
          <SecondaryAction label="Inspect hosted services" />
          <SecondaryAction label="Open in Inventory" />
          <SecondaryAction label="Add service" />
          <SecondaryAction label="Review sale — ♦192" destructive />
        </ActionGroup>
      )}
    </div>
  );
}

/* ─── Service inspector ─────────────────────────────────────────────── */
function ServiceInspector({
  serviceId, journeyStep, onAdvanceJourney,
}: {
  serviceId: string;
  journeyStep: JourneyStep;
  onAdvanceJourney: () => void;
}) {
  const isApp = serviceId === "svc-app";
  const name = isApp ? "Application Runtime" : "Relational Database";
  const type = isApp ? "app-runtime" : "relational-db";

  const state =
    (isApp && journeyStep === "app-installing") || (!isApp && journeyStep === "db-installing")
      ? "installing"
      : journeyStep === "configuring" && isApp
      ? "stopped"
      : journeyStep === "ready-to-start"
      ? "configured"
      : journeyStep === "live" || journeyStep === "live-degraded"
      ? "running"
      : journeyStep === "live-incident" && isApp
      ? "failed"
      : "installing";

  const stateColor =
    state === "running" ? "var(--green-main)"
    : state === "installing" ? "var(--sky-main)"
    : state === "failed" ? "var(--red-main)"
    : state === "configured" ? "var(--amber-main)"
    : "var(--text-muted)";

  const stateLabel =
    state === "running" ? "Running"
    : state === "installing" ? "Installing"
    : state === "failed" ? "Failed"
    : state === "configured" ? "Ready — stopped"
    : "Unknown";

  return (
    <div style={{ padding: "16px" }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <div
            className={`lamp ${state === "running" ? "lamp-green" : state === "installing" ? "lamp-blue progress-pulse" : state === "failed" ? "lamp-red" : "lamp-amber"}`}
          />
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{name}</span>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Tag color={stateColor} label={stateLabel} />
          <Tag color="var(--text-muted)" label="Maya's Appointments" />
          <Tag color="var(--text-muted)" label="Server A" />
        </div>
      </div>

      <div style={{ height: 1, background: "var(--navy-700)", marginBottom: 12 }} />

      {/* Configuration */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
          Configuration
        </div>
        {isApp ? (
          <>
            <ConfigRow label="Project" value="Maya's Appointments" />
            <ConfigRow label="DB connection" value={state === "running" || state === "configured" ? "Connected" : "Pending setup"} />
          </>
        ) : (
          <>
            <ConfigRow label="Engine" value="Relational Database" />
            <ConfigRow label="Connections" value={state === "running" ? "active" : "—"} />
          </>
        )}
      </div>

      <div style={{ height: 1, background: "var(--navy-700)", marginBottom: 12 }} />

      {/* Actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {state === "installing" && (
          <>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", padding: "8px", background: "var(--navy-800)", borderRadius: 6 }}>
              Installation in progress. No additional actions available.
            </div>
            <SecondaryAction label="View task in queue" />
          </>
        )}

        {(state === "configured" || state === "stopped") && (
          <>
            <PrimaryAction label="Start service" onClick={onAdvanceJourney} />
            <SecondaryAction label="Configure" />
            <SecondaryAction label="Uninstall" destructive />
          </>
        )}

        {state === "running" && (
          <>
            <SecondaryAction label="Configure" />
            <SecondaryAction label="Stop service" />
            {isApp && <SecondaryAction label="Add instance" />}
            <SecondaryAction label="Uninstall" destructive />
          </>
        )}

        {state === "failed" && (
          <>
            <div
              style={{
                padding: "10px",
                background: "var(--red-surface)",
                border: "1px solid var(--red-dim)",
                borderRadius: 8,
                fontSize: 12,
                color: "var(--red-bright)",
                lineHeight: 1.5,
              }}
            >
              Service failed. Cause not yet diagnosed. Monitoring coverage is required for detailed diagnosis.
            </div>
            <PrimaryAction label="Restart service (1h work)" onClick={() => {}} />
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Requirements checklist ─────────────────────────────────────────── */
function SetupChecklist({ journeyStep }: { journeyStep: JourneyStep }) {
  const appDone = !["server-acquired", "app-installing"].includes(journeyStep);
  const dbDone = !["server-acquired", "app-installing", "db-installing"].includes(journeyStep);
  const cfgDone = journeyStep === "ready-to-start" || journeyStep === "live";

  const items = [
    { label: "Acquire server hardware", done: journeyStep !== "accepted-no-server", note: journeyStep !== "accepted-no-server" ? "Server A (general-small)" : "Buy or lease compatible hardware" },
    { label: "Install Application Runtime", done: appDone, installing: journeyStep === "app-installing", note: "2h install", progress: journeyStep === "app-installing" ? 55 : undefined },
    { label: "Install Relational Database", done: dbDone, installing: journeyStep === "db-installing", note: "2h install", progress: journeyStep === "db-installing" ? 30 : undefined },
    { label: "Configure database connection", done: cfgDone, installing: journeyStep === "configuring", note: "1h work", progress: journeyStep === "configuring" ? 70 : undefined },
  ];

  return (
    <div style={{ padding: "16px" }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 12 }}>
        Setup requirements
      </div>
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 14, lineHeight: 1.5 }}>
        Setup allowance: 24h from acceptance · Elapsed: {journeyStep === "ready-to-start" || journeyStep === "live" ? "5h" : "2h"}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((item) => (
          <div
            key={item.label}
            style={{
              display: "flex",
              gap: 10,
              padding: "8px 10px",
              borderRadius: 6,
              background: item.done ? "rgba(22,163,74,0.06)" : "var(--navy-800)",
              border: `1px solid ${item.done ? "var(--green-surface)" : item.installing ? "var(--navy-500)" : "var(--navy-700)"}`,
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                flexShrink: 0,
                border: `1px solid ${item.done ? "var(--green-muted)" : "var(--navy-500)"}`,
                background: item.done ? "var(--green-muted)" : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginTop: 1,
                fontSize: 9,
                color: item.done ? "#fff" : item.installing ? "var(--sky-main)" : "var(--text-muted)",
              }}
            >
              {item.done ? "✓" : item.installing ? "…" : ""}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: item.done ? "var(--green-bright)" : item.installing ? "var(--text-primary)" : "var(--text-secondary)",
                }}
              >
                {item.label}
              </div>
              {item.installing && item.progress !== undefined && (
                <div className="res-bar" style={{ marginTop: 4, width: "100%" }}>
                  <div
                    className="res-bar-fill progress-pulse"
                    style={{ width: `${item.progress}%`, background: "var(--sky-main)" }}
                  />
                </div>
              )}
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
                {item.note}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Shared helpers ─────────────────────────────────────────────────── */
function NoDataTab({ message }: { message: string }) {
  return (
    <div style={{ padding: "16px", color: "var(--text-muted)", fontSize: 12, lineHeight: 1.6 }}>{message}</div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
      {children}
    </div>
  );
}

function FinRow({ label, value, note, muted }: { label: string; value: string; note?: string; muted?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        padding: "5px 0",
        borderBottom: "1px solid rgba(26,50,85,0.4)",
        fontSize: 11,
        gap: 12,
      }}
    >
      <div>
        <div style={{ color: "var(--text-secondary)" }}>{label}</div>
        {note && <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 1 }}>{note}</div>}
      </div>
      <span style={{ fontFamily: "var(--font-mono)", color: muted ? "var(--text-muted)" : "var(--text-primary)", fontWeight: 500 }}>
        {value}
      </span>
    </div>
  );
}

function Metric({ label, value, color, unit }: { label: string; value: string; color?: string; unit?: string }) {
  return (
    <div
      style={{
        background: "var(--navy-800)",
        borderRadius: 6,
        padding: "8px 10px",
        border: "1px solid var(--navy-700)",
      }}
    >
      <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: color || "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
        {value}
      </div>
    </div>
  );
}

function Tag({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        fontSize: 10,
        padding: "2px 7px",
        borderRadius: 20,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid var(--navy-600)",
        color,
      }}
    >
      {label}
    </span>
  );
}

function ConfigRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "4px 0",
        borderBottom: "1px solid rgba(26,50,85,0.4)",
        fontSize: 11,
        gap: 12,
      }}
    >
      <span style={{ color: "var(--text-muted)" }}>{label}</span>
      <span style={{ color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>{value}</span>
    </div>
  );
}

function ActionGroup({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{children}</div>;
}

function PrimaryAction({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        height: 40,
        borderRadius: 8,
        border: "none",
        background: "var(--green-muted)",
        color: "#fff",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 600,
        transition: "all 0.15s",
        textAlign: "center",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--green-dim)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "var(--green-muted)"; }}
    >
      {label}
    </button>
  );
}

function SecondaryAction({ label, destructive }: { label: string; destructive?: boolean; onClick?: () => void }) {
  return (
    <button
      style={{
        height: 36,
        borderRadius: 8,
        border: `1px solid ${destructive ? "var(--red-dim)" : "var(--navy-500)"}`,
        background: "transparent",
        color: destructive ? "var(--red-bright)" : "var(--text-secondary)",
        cursor: "pointer",
        fontSize: 12,
        transition: "all 0.15s",
        textAlign: "center",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = destructive ? "var(--red-main)" : "var(--navy-300)";
        e.currentTarget.style.color = destructive ? "var(--red-main)" : "var(--text-primary)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = destructive ? "var(--red-dim)" : "var(--navy-500)";
        e.currentTarget.style.color = destructive ? "var(--red-bright)" : "var(--text-secondary)";
      }}
    >
      {label}
    </button>
  );
}

/* ─── Main InspectorPanel ─────────────────────────────────────────────── */
import React from "react";

export default function InspectorPanel({
  journeyStep, selectedId, selectedServiceId, tab, onTabChange, onAdvanceJourney, isMobile, onClose,
}: InspectorPanelProps) {
  const isLive = ["live", "live-degraded", "live-incident"].includes(journeyStep);
  const isSetup = !isLive && journeyStep !== "empty" && journeyStep !== "offer-list" && journeyStep !== "contract-review";

  const showObjectInspector = selectedId === "server-a" && !selectedServiceId;
  const showServiceInspector = !!selectedServiceId;
  const showChecklist = isSetup && !selectedId;
  const showProjectInfo = !selectedId && isLive;

  const content = (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div
        style={{
          padding: "10px 14px 0",
          borderBottom: "1px solid var(--navy-700)",
          flexShrink: 0,
        }}
      >
        {/* Tabs — show project tabs when not inspecting an object */}
        {!showObjectInspector && !showServiceInspector && isLive && (
          <div style={{ display: "flex", gap: 2, paddingBottom: 0 }}>
            {(["status", "performance", "finances"] as WorkspaceTab[]).map((t) => (
              <button
                key={t}
                onClick={() => onTabChange(t)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px 6px 0 0",
                  border: "none",
                  borderBottom: tab === t ? "2px solid var(--green-muted)" : "2px solid transparent",
                  background: "transparent",
                  color: tab === t ? "var(--text-primary)" : "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: tab === t ? 600 : 400,
                  transition: "all 0.15s",
                  textTransform: "capitalize",
                }}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        {/* Object inspector header */}
        {(showObjectInspector || showServiceInspector) && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 8 }}>
            <button
              onClick={() => { }}
              style={{
                width: 24, height: 24, borderRadius: 4,
                border: "1px solid var(--navy-600)",
                background: "transparent",
                color: "var(--text-muted)",
                cursor: "pointer",
                fontSize: 12,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              ‹
            </button>
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              {showServiceInspector
                ? selectedServiceId === "svc-app" ? "Application Runtime" : "Relational Database"
                : "Server A"}
            </span>
            {isMobile && onClose && (
              <button
                onClick={onClose}
                style={{
                  marginLeft: "auto",
                  width: 24, height: 24, borderRadius: 4,
                  border: "1px solid var(--navy-600)",
                  background: "transparent",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: 14,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                ×
              </button>
            )}
          </div>
        )}

        {/* Setup checklist header */}
        {showChecklist && (
          <div style={{ paddingBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Setup checklist</div>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
        {showObjectInspector && <ServerInspector journeyStep={journeyStep} onAdvanceJourney={onAdvanceJourney} />}
        {showServiceInspector && selectedServiceId && (
          <ServiceInspector serviceId={selectedServiceId} journeyStep={journeyStep} onAdvanceJourney={onAdvanceJourney} />
        )}
        {showChecklist && <SetupChecklist journeyStep={journeyStep} />}
        {showProjectInfo && !showObjectInspector && !showServiceInspector && (
          <>
            {tab === "status" && <StatusTab journeyStep={journeyStep} />}
            {tab === "performance" && <PerformanceTab journeyStep={journeyStep} />}
            {tab === "finances" && <FinancesTab journeyStep={journeyStep} />}
          </>
        )}
        {journeyStep === "empty" && (
          <div style={{ padding: "16px", color: "var(--text-muted)", fontSize: 12 }}>
            Select a project or component to inspect it.
          </div>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <div className="drawer-backdrop" onClick={onClose} />
        <div className="drawer" style={{ maxHeight: "80vh" }}>
          <div className="drawer-handle" />
          <div className="drawer-body">{content}</div>
        </div>
      </>
    );
  }

  return (
    <div
      style={{
        width: 260,
        flexShrink: 0,
        background: "var(--navy-850)",
        borderLeft: "1px solid var(--navy-700)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {content}
    </div>
  );
}
