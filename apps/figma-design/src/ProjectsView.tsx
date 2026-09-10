import type { JourneyStep } from "./scenario";

interface ProjectsViewProps {
  journeyStep: JourneyStep;
  onOpenProject: () => void;
  onNewProject: () => void;
}


function ProjectRow({ journeyStep, onOpen }: { journeyStep: JourneyStep; onOpen: () => void }) {
  const isLive = ["live", "live-degraded", "live-incident"].includes(journeyStep);

  const stateLabel =
    journeyStep === "live-incident" ? "INCIDENT"
    : journeyStep === "live-degraded" ? "PRESSURE"
    : isLive ? "LIVE"
    : journeyStep === "ready-to-start" ? "READY"
    : "SETUP";

  const lampCls =
    journeyStep === "live-incident" ? "lamp lamp-r"
    : journeyStep === "live-degraded" ? "lamp lamp-a"
    : isLive ? "lamp lamp-g"
    : journeyStep === "ready-to-start" ? "lamp lamp-a"
    : "lamp lamp-s pulse";

  const stateColor =
    journeyStep === "live-incident" ? "var(--red)"
    : journeyStep === "live-degraded" ? "var(--amber)"
    : isLive ? "var(--green)"
    : journeyStep === "ready-to-start" ? "var(--amber)"
    : "var(--sky)";

  const setupPct =
    journeyStep === "ready-to-start" ? 100
    : journeyStep === "configuring" ? 80
    : journeyStep === "db-installing" ? 60
    : journeyStep === "app-installing" ? 40
    : journeyStep === "server-acquired" ? 20
    : journeyStep === "acquiring" ? 10
    : journeyStep === "accepted-no-server" ? 5
    : 0;

  const showSetupBar = !isLive && !["empty", "offer-list", "contract-review"].includes(journeyStep);

  return (
    <button
      onClick={onOpen}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 12px", width: "100%",
        border: "none", borderBottom: "1px solid var(--border-0)",
        background: "transparent", cursor: "pointer", textAlign: "left",
        transition: "background .1s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-2)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >
      {/* Avatar */}
      <div style={{
        width: 30, height: 30, borderRadius: 6, flexShrink: 0,
        background: "var(--bg-4)", border: "1px solid var(--border-1)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 10, fontWeight: 800, color: "var(--txt-1)", fontFamily: "var(--font-mono)",
      }}>MC</div>

      {/* Name + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 12, fontWeight: 700, color: "var(--txt-0)", lineHeight: 1.2,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {"Maya's Appointments"}
        </div>
        <div style={{
          fontSize: 9, color: "var(--txt-2)", marginTop: 2,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          maya chen · appt booking
        </div>
        {showSetupBar && (
          <div style={{ marginTop: 5, height: 2, borderRadius: 1, background: "var(--bg-5)", overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 1, transition: "width .4s",
              width: `${setupPct}%`,
              background: setupPct === 100 ? "var(--green)" : "var(--sky)",
            }} />
          </div>
        )}
      </div>

      {/* State lamp + label */}
      <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
        <div className={lampCls} />
        <span style={{ fontSize: 9, fontWeight: 700, color: stateColor, letterSpacing: ".05em" }}>
          {stateLabel}
        </span>
      </div>
    </button>
  );
}

export default function ProjectsView({ journeyStep, onOpenProject, onNewProject }: ProjectsViewProps) {
  const hasProject = !["empty", "offer-list", "contract-review"].includes(journeyStep);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{
        padding: "10px 12px", borderBottom: "1px solid var(--border-0)",
        display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
      }}>
        <div className="sec-dot" />
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".08em", color: "var(--txt-0)", textTransform: "uppercase" }}>
          Projects
        </span>
        {hasProject && (
          <span style={{ fontSize: 9, color: "var(--txt-2)", fontFamily: "var(--font-mono)" }}>(1)</span>
        )}
        <button
          onClick={onNewProject}
          style={{
            marginLeft: "auto", width: 24, height: 24, borderRadius: 4,
            border: "1px solid var(--green-dim)", background: "var(--green-surf)",
            color: "var(--green)", cursor: "pointer", fontSize: 16, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all .12s", lineHeight: 1,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--green-glow)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--green-surf)"; }}
          title="New project"
        >+</button>
      </div>

      {/* List */}
      <div className="panel-body">
        {hasProject ? (
          <ProjectRow journeyStep={journeyStep} onOpen={onOpenProject} />
        ) : (
          <div style={{ padding: "28px 12px", textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 10, opacity: .15 }}>⬡</div>
            <div style={{ fontSize: 11, color: "var(--txt-2)", lineHeight: 1.6, marginBottom: 16 }}>
              No active projects.<br />Accept your first offer to begin.
            </div>
            <button
              onClick={onNewProject}
              style={{
                height: 32, padding: "0 14px", borderRadius: 5,
                border: "1px solid var(--green-dim)", background: "var(--green-surf)",
                color: "var(--green)", cursor: "pointer", fontSize: 11, fontWeight: 700,
                letterSpacing: ".05em", textTransform: "uppercase", transition: "all .12s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--green-glow)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "var(--green-surf)"; }}
            >+ New project</button>
          </div>
        )}
      </div>
    </div>
  );
}
