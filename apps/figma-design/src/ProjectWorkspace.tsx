import InfraCanvas from "./InfraCanvas";
import AcquisitionDrawer from "./AcquisitionDrawer";
import type { JourneyStep } from "./scenario";
import { useState } from "react";

interface ProjectWorkspaceProps {
  journeyStep: JourneyStep;
  onAdvanceJourney: () => void;
  cash: number;
  isMobile: boolean;
}

export default function ProjectWorkspace({
  journeyStep, onAdvanceJourney, cash, isMobile,
}: ProjectWorkspaceProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [showAcquisition, setShowAcquisition] = useState(false);

  const isLive  = ["live", "live-degraded", "live-incident"].includes(journeyStep);
  const isSetup = !isLive;
  const canStart = journeyStep === "ready-to-start";

  const stateColor =
    journeyStep === "live-incident" ? "var(--red)"
    : journeyStep === "live-degraded" ? "var(--amber)"
    : isLive ? "var(--green)"
    : canStart ? "var(--amber)"
    : "var(--sky)";

  const lampCls =
    journeyStep === "live-incident" ? "lamp lamp-r"
    : journeyStep === "live-degraded" ? "lamp lamp-a"
    : isLive ? "lamp lamp-g"
    : canStart ? "lamp lamp-a"
    : "lamp lamp-s pulse";

  const stateLabel =
    journeyStep === "live-incident" ? "Incident"
    : journeyStep === "live-degraded" ? "Capacity pressure"
    : isLive ? "Live"
    : canStart ? "Ready to start"
    : "Setting up";

  function handleSelectServer(id: string) {
    setSelectedId(id || null);
    if (!id) setSelectedServiceId(null);
  }

  function handleSelectService(serverId: string, serviceId: string) {
    setSelectedId(serverId);
    setSelectedServiceId(serviceId);
  }

  function handleAcquire() {
    setShowAcquisition(false);
    onAdvanceJourney();
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      {/* Project header */}
      {(() => {
        // SLA status description — no numbers
        const slaColor =
          journeyStep === "live-incident" ? "var(--red)"
          : journeyStep === "live-degraded" ? "var(--amber)"
          : isLive ? "var(--green)"
          : canStart ? "var(--amber)"
          : "var(--txt-2)";
        const slaDesc =
          journeyStep === "live-incident" ? "SLA breached — service is down"
          : journeyStep === "live-degraded" ? "SLA at risk — approaching limit"
          : isLive ? "SLA on track"
          : canStart ? "Ready to go live"
          : "Setting up";

        // Identity block — same for both
        const identity = (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 6, flexShrink: 0,
              background: "var(--bg-5)", border: "1px solid var(--border-1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 800, color: "var(--txt-1)", fontFamily: "var(--font-mono)",
            }}>MC</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--txt-0)", lineHeight: 1.2 }}>{"Maya's Appointments"}</div>
              <div style={{ fontSize: 10, color: "var(--txt-2)", marginTop: 1 }}>Maya Chen · Appointment Booking Site</div>
            </div>
          </div>
        );

        // Status group — lamp + state · dot + SLA sentence, flex-row on desktop
        const statusGroup = (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className={lampCls} />
            <span style={{ fontSize: 11, fontWeight: 700, color: stateColor }}>{stateLabel}</span>
            <div style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--border-2)", flexShrink: 0 }} />
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: slaColor, boxShadow: `0 0 5px ${slaColor}`, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: slaColor }}>{slaDesc}</span>
          </div>
        );

        // Action buttons
        const btnStyle = (active: boolean, color: string) => ({
          display: "flex", alignItems: "center", gap: 7,
          height: 30, padding: "0 13px", borderRadius: 5,
          border: `1px solid ${active ? color : "var(--border-1)"}`,
          background: active ? "color-mix(in srgb, " + color + " 12%, transparent)" : "transparent",
          color: active ? color : "var(--txt-1)",
          cursor: "pointer", fontSize: 11, fontWeight: 700, letterSpacing: ".03em",
          transition: "all .12s",
        } as React.CSSProperties);

        const actions = (
          <>
            {isSetup && (
              <button
                onClick={canStart ? onAdvanceJourney : undefined}
                disabled={!canStart}
                style={{
                  ...btnStyle(canStart, "var(--green)"),
                  opacity: canStart ? 1 : 0.45,
                  cursor: canStart ? "pointer" : "not-allowed",
                }}
              >
                <span>▶</span> Start service
              </button>
            )}
            <button style={btnStyle(false, "var(--txt-1)")}>
              <span style={{ fontSize: 13 }}>⏸</span> Park
            </button>
          </>
        );

        if (isMobile) {
          return (
            <div style={{
              padding: "12px 16px", flexShrink: 0,
              background: "var(--bg-2)", borderBottom: "1px solid var(--border-0)",
            }}>
              {/* Top row: identity left, status group right */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
                {identity}
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, justifyContent: "flex-end" }}>
                    <div className={lampCls} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: stateColor }}>{stateLabel}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end", marginTop: 3 }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: slaColor, boxShadow: `0 0 5px ${slaColor}`, flexShrink: 0 }} />
                    <span style={{ fontSize: 9, color: slaColor }}>{slaDesc}</span>
                  </div>
                </div>
              </div>
              {/* Action buttons stacked full width */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {isSetup && (
                  <button
                    onClick={canStart ? onAdvanceJourney : undefined}
                    disabled={!canStart}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      width: "100%", height: 36, borderRadius: 5,
                      border: canStart ? "1px solid var(--green)" : "1px solid var(--border-1)",
                      background: canStart ? "var(--green-surf)" : "transparent",
                      color: canStart ? "var(--green)" : "var(--txt-2)",
                      cursor: canStart ? "pointer" : "not-allowed",
                      fontSize: 12, fontWeight: 700, opacity: canStart ? 1 : 0.45,
                    }}
                  >
                    <span>▶</span> Start service
                  </button>
                )}
                <button style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  width: "100%", height: 36, borderRadius: 5,
                  border: "1px solid var(--border-1)", background: "transparent",
                  color: "var(--txt-2)", cursor: "pointer", fontSize: 12, fontWeight: 700,
                }}>
                  <span style={{ fontSize: 14 }}>⏸</span> Park project
                </button>
              </div>
            </div>
          );
        }

        // Desktop
        return (
          <div style={{
            padding: "10px 16px", flexShrink: 0,
            background: "var(--bg-2)", borderBottom: "1px solid var(--border-0)",
            display: "flex", alignItems: "center", gap: 16,
          }}>
            {identity}
            <div style={{ width: 1, height: 28, background: "var(--border-0)", flexShrink: 0, marginLeft: 4 }} />
            {statusGroup}
            <div style={{ flex: 1 }} />
            {actions}
          </div>
        );
      })()}

      {/* Canvas */}
      <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
        <InfraCanvas
          journeyStep={journeyStep}
          selectedId={selectedId}
          onSelectServer={handleSelectServer}
          onSelectService={handleSelectService}
          onAddServer={() => setShowAcquisition(true)}
        />
      </div>

      {showAcquisition && (
        <AcquisitionDrawer
          cash={cash}
          onAcquire={handleAcquire}
          onClose={() => setShowAcquisition(false)}
        />
      )}
    </div>
  );
}
