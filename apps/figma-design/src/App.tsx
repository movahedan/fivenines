import { useState, useEffect, useRef } from "react";
import TopBar from "./TopBar";
import PanelSection from "./PanelSection";
import ProjectsView from "./ProjectsView";
import ProjectWorkspace from "./ProjectWorkspace";
import InventoryView from "./InventoryView";
import LearningView from "./LearningView";
import FinancesView from "./FinancesView";
import NewProjectPage from "./NewProjectPage";
import { ACTIVITY_EVENTS } from "./scenario";
import type { JourneyStep } from "./scenario";

/* ─── Journey progression ─────────────────────────────────────── */
const STEPS: JourneyStep[] = [
  "empty", "offer-list", "contract-review", "accepted-no-server",
  "acquiring", "server-acquired", "app-installing", "db-installing", "configuring",
  "ready-to-start", "live", "live-degraded", "live-incident",
];

function cashForStep(s: JourneyStep): number {
  if (s === "empty" || s === "offer-list" || s === "contract-review") return 500;
  if (s === "accepted-no-server") return 580; // +80 advance
  return 340; // bought server -240
}

function opsForStep(s: JourneyStep): { label: string; hoursRemaining: number; progress: number }[] {
  if (s === "app-installing") return [{ label: "App Runtime install",    hoursRemaining: 1, progress: 55 }];
  if (s === "db-installing")  return [{ label: "Relational DB install",  hoursRemaining: 2, progress: 30 }];
  if (s === "configuring")    return [{ label: "Configure DB connection", hoursRemaining: 1, progress: 70 }];
  return [];
}

/* ─── Activity drawer ─────────────────────────────────────────── */
function ActivityDrawer({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(4,7,15,.6)",
          backdropFilter: "blur(2px)",
          zIndex: 80,
        }}
      />
      <div
        className="anim-slide-right"
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0,
          width: 320,
          background: "var(--bg-2)",
          borderLeft: "1px solid var(--border-0)",
          zIndex: 90,
          display: "flex", flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid var(--border-0)",
            display: "flex", alignItems: "center", gap: 8,
            flexShrink: 0,
          }}
        >
          <div className="sec-dot" />
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--txt-0)" }}>
            Activity
          </span>
          <button
            onClick={onClose}
            style={{
              marginLeft: "auto", width: 26, height: 26, borderRadius: 4,
              border: "1px solid var(--border-1)", background: "transparent",
              color: "var(--txt-2)", cursor: "pointer", fontSize: 14,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>
        <div className="panel-body" style={{ padding: "8px 14px" }}>
          {ACTIVITY_EVENTS.map((ev) => (
            <div
              key={ev.id}
              style={{
                padding: "10px 0",
                borderBottom: "1px solid var(--border-0)",
                display: "flex", gap: 10,
              }}
            >
              <span style={{ fontSize: 14, flexShrink: 0, lineHeight: 1.4 }}>{ev.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: "var(--txt-0)", lineHeight: 1.5 }}>{ev.text}</div>
                <div style={{ fontSize: 9, color: "var(--txt-2)", marginTop: 2, fontFamily: "var(--font-mono)" }}>
                  {ev.time} · {ev.category}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ─── Prototype journey control ───────────────────────────────── */
function JourneyControl({ step, onBack, onNext }: { step: JourneyStep; onBack: () => void; onNext: () => void }) {
  const idx = STEPS.indexOf(step);
  return (
    <div
      style={{
        position: "fixed", bottom: 16, left: "50%", transform: "translateX(-50%)",
        zIndex: 200,
        background: "var(--bg-3)",
        border: "1px solid var(--border-2)",
        borderRadius: 999,
        padding: "5px 14px",
        display: "flex", alignItems: "center", gap: 10,
        boxShadow: "0 4px 24px rgba(0,0,0,.6)",
        pointerEvents: "all",
      }}
    >
      <button
        onClick={onBack}
        disabled={idx === 0}
        style={{
          width: 26, height: 26, borderRadius: "50%",
          border: "1px solid var(--border-1)", background: "transparent",
          color: "var(--txt-2)", cursor: idx === 0 ? "not-allowed" : "pointer",
          opacity: idx === 0 ? .3 : 1,
          fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        ‹
      </button>
      <span style={{ fontSize: 10, color: "var(--txt-1)", minWidth: 160, textAlign: "center", fontFamily: "var(--font-mono)" }}>
        {idx + 1}/{STEPS.length} · {step.replace(/-/g, " ")}
      </span>
      <button
        onClick={onNext}
        disabled={idx >= STEPS.length - 1}
        style={{
          width: 26, height: 26, borderRadius: "50%",
          border: "1px solid var(--border-1)", background: "transparent",
          color: "var(--txt-2)", cursor: idx >= STEPS.length - 1 ? "not-allowed" : "pointer",
          opacity: idx >= STEPS.length - 1 ? .3 : 1,
          fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        ›
      </button>
    </div>
  );
}

/* ─── Mobile ops strip (above bottom nav) ────────────────────── */
function OpsStrip({
  opsTasks, learningSlots,
}: {
  opsTasks: { label: string; hoursRemaining: number; progress: number }[];
  learningSlots: { label: string; progress: number }[];
}) {
  const items = [
    ...opsTasks.map((t) => ({ label: t.label, progress: t.progress, color: "var(--sky)" })),
    ...learningSlots.map((s) => ({ label: s.label, progress: s.progress, color: "var(--amber)" })),
  ];
  if (items.length === 0) return null;
  return (
    <div style={{
      flexShrink: 0, padding: "8px 16px",
      background: "var(--bg-1)", borderTop: "1px solid var(--border-0)",
    }}>
      {items.map((item, i) => (
        <div key={i} style={{ marginBottom: i < items.length - 1 ? 7 : 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: "var(--txt-2)", letterSpacing: ".04em" }}>{item.label}</span>
            <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: item.color }}>{item.progress}%</span>
          </div>
          <div style={{ height: 2, borderRadius: 99, background: "var(--bg-5)" }}>
            <div style={{ height: "100%", borderRadius: 99, background: item.color, width: `${item.progress}%`, transition: "width .4s" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Mobile bottom nav ───────────────────────────────────────── */
type MobileTab = "projects" | "inventory" | "learning" | "finances";

const MOBILE_TABS: { id: MobileTab; label: string; icon: string }[] = [
  { id: "projects",  label: "Projects",  icon: "⊞" },
  { id: "inventory", label: "Inventory", icon: "⊡" },
  { id: "learning",  label: "Learning",  icon: "◈" },
  { id: "finances",  label: "Finances",  icon: "◉" },
];

function MobileBottomNav({
  tab, onTab, onNewProject,
}: {
  tab: MobileTab;
  onTab: (t: MobileTab) => void;
  onNewProject: () => void;
}) {
  const left  = MOBILE_TABS.slice(0, 2);
  const right = MOBILE_TABS.slice(2);
  return (
    <div
      style={{
        flexShrink: 0, height: 56,
        background: "var(--bg-2)", borderTop: "1px solid var(--border-0)",
        display: "flex", alignItems: "stretch",
        position: "relative", zIndex: 100,
      }}
    >
      {left.map((t) => (
        <button
          key={t.id}
          onClick={() => onTab(t.id)}
          style={{
            flex: 1, border: "none", background: "transparent", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
            borderTop: tab === t.id ? "2px solid var(--green)" : "2px solid transparent",
            color: tab === t.id ? "var(--green)" : "var(--txt-2)",
            transition: "all .12s",
          }}
        >
          <span style={{ fontSize: 16 }}>{t.icon}</span>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" }}>{t.label}</span>
        </button>
      ))}
      {/* Center new project button */}
      <button
        onClick={onNewProject}
        style={{
          width: 52, flexShrink: 0, border: "none", background: "transparent", cursor: "pointer",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "0 4px",
        }}
      >
        <div
          style={{
            width: 38, height: 38, borderRadius: "50%",
            background: "var(--green-surf)", border: "1px solid var(--green)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, color: "var(--green)", lineHeight: 1,
          }}
        >+</div>
      </button>
      {right.map((t) => (
        <button
          key={t.id}
          onClick={() => onTab(t.id)}
          style={{
            flex: 1, border: "none", background: "transparent", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
            borderTop: tab === t.id ? "2px solid var(--green)" : "2px solid transparent",
            color: tab === t.id ? "var(--green)" : "var(--txt-2)",
            transition: "all .12s",
          }}
        >
          <span style={{ fontSize: 16 }}>{t.icon}</span>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

/* ─── Right panel tab strip ───────────────────────────────────── */
const RIGHT_PANELS = [
  { id: "inventory" as const, label: "Inventory" },
  { id: "learning"  as const, label: "Learning" },
  { id: "finances"  as const, label: "Finances" },
];
type RightPanel = typeof RIGHT_PANELS[number]["id"] | null;

function RightTabStrip({
  active, onSelect,
}: {
  active: RightPanel;
  onSelect: (p: RightPanel) => void;
}) {
  return (
    <div
      style={{
        width: 28,
        flexShrink: 0,
        background: "var(--bg-1)",
        borderLeft: "1px solid var(--border-0)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {RIGHT_PANELS.map((p) => {
        const isActive = active === p.id;
        return (
          <button
            key={p.id}
            className="panel-tab"
            onClick={() => onSelect(isActive ? null : p.id)}
            style={{
              flex: 1,
              width: "100%",
              borderTop: "none",
              borderBottom: "1px solid var(--border-0)",
              borderLeft: isActive ? "2px solid var(--green)" : "2px solid transparent",
              borderRight: "none",
            }}
            title={p.label}
          >
            <span
              className="panel-tab-label"
              style={{ color: isActive ? "var(--green)" : "var(--txt-2)" }}
            >
              {p.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}


/* ─── Right panel wrapper with resize ────────────────────────── */
function RightPanel({ width, onWidthChange, children }: { width: number; onWidthChange: (w: number) => void; children: React.ReactNode }) {
  const dragRef = useRef<{ x: number; w: number } | null>(null);

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = { x: e.clientX, w: width };
    const move = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      // right panel: dragging left = bigger
      const newW = Math.min(520, Math.max(160, dragRef.current.w + dragRef.current.x - ev.clientX));
      onWidthChange(newW);
    };
    const up = () => {
      dragRef.current = null;
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  };

  return (
    <div
      style={{ display: "flex", height: "100%", flexShrink: 0, position: "relative" }}
    >
      {/* Grip at left edge of the panel */}
      <div
        onMouseDown={onMouseDown}
        style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: 5, cursor: "col-resize", zIndex: 20 }}
      />
      <div
        className="anim-slide-right"
        style={{
          width, flexShrink: 0, background: "var(--bg-1)",
          borderLeft: "1px solid var(--border-0)",
          display: "flex", flexDirection: "column", minHeight: 0,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ─── App ─────────────────────────────────────────────────────── */
export default function App() {
  const [step, setStep]           = useState<JourneyStep>("empty");
  const [speed, setSpeed]         = useState(1);
  const [leftOpen, setLeftOpen]   = useState(true);
  const [leftWidth, setLeftWidth] = useState(220);
  const [rightPanel, setRightPanel] = useState<RightPanel>(null);
  const [rightWidth, setRightWidth] = useState(260);
  const [showActivity, setShowActivity] = useState(false);
  const [newProjectPhase, setNewProjectPhase] = useState<null | "offer" | "contract">(null);
  const [isMobile, setIsMobile]   = useState(() => window.innerWidth < 768);
  const [mobileTab, setMobileTab] = useState<MobileTab>("projects");

  const inWorkspace =
    !["empty", "offer-list", "contract-review", "accepted-no-server"].includes(step) && newProjectPhase === null;

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  /* ── Journey helpers ── */
  function advance() {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) {
      const next = STEPS[idx + 1];
      setStep(next);
      // Auto-close new project page when we move past contract acceptance
      if (next === "accepted-no-server") setNewProjectPhase(null);
    }
  }
  function rewind() {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  }

  function handleNewProject() {
    if (step === "empty") setStep("offer-list");
    setNewProjectPhase("offer");
  }
  function handleOfferSelect() { setNewProjectPhase("contract"); }
  function handleContractAccept() {
    setStep("accepted-no-server");
    setNewProjectPhase(null);
  }
  function handleNewProjectClose() {
    setNewProjectPhase(null);
    if (step === "offer-list" || step === "contract-review") setStep("empty");
  }

  const cash = cashForStep(step);
  const ops  = opsForStep(step);
  const showNewProjectPage = newProjectPhase !== null;

  /* ─── Mobile layout ─── */
  if (isMobile) {
    const mobileContent = () => {
      if (showNewProjectPage) {
        return (
          <NewProjectPage
            phase={newProjectPhase!}
            onSelectOffer={handleOfferSelect}
            onAccept={handleContractAccept}
            onClose={handleNewProjectClose}
            cash={cash}
            isMobile
          />
        );
      }
      if (mobileTab === "projects") {
        return inWorkspace
          ? <ProjectWorkspace journeyStep={step} onAdvanceJourney={advance} cash={cash} isMobile />
          : (
            <div style={{ padding: 16 }}>
              <ProjectsView journeyStep={step} onOpenProject={() => {}} onNewProject={handleNewProject} />
            </div>
          );
      }
      if (mobileTab === "inventory") return <InventoryView journeyStep={step} />;
      if (mobileTab === "learning")  return <LearningView />;
      return <FinancesView />;
    };

    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <TopBar
          cash={cash} reputation={0} opex={8.90}
          speed={speed} onSpeedChange={setSpeed}
          opsTasks={ops} learningSlots={[]}
          onActivityOpen={() => setShowActivity(true)}
          isMobile
        />
        <div style={{ flex: 1, minHeight: 0, overflow: "auto", display: "flex", flexDirection: "column" }}>
          {mobileContent()}
        </div>
        <OpsStrip opsTasks={ops} learningSlots={[]} />
        <MobileBottomNav tab={mobileTab} onTab={setMobileTab} onNewProject={handleNewProject} />
        {showActivity && <ActivityDrawer onClose={() => setShowActivity(false)} />}
        <JourneyControl step={step} onBack={rewind} onNext={advance} />
      </div>
    );
  }

  /* ─── Desktop layout ─── */
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <TopBar
        cash={cash} reputation={0} opex={8.90}
        speed={speed} onSpeedChange={setSpeed}
        opsTasks={ops} learningSlots={[]}
        onActivityOpen={() => setShowActivity(true)}
        isMobile={false}
      />

      {/* Body: [left tab | left panel | center | right panel | right tab strip] */}
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>

        {/* Left panel: Projects */}
        <PanelSection
          label="Projects"
          sublabel={inWorkspace ? "(1)" : undefined}
          expanded={leftOpen}
          onToggle={() => setLeftOpen((v) => !v)}
          tabSide="right"
          width={leftWidth}
          onWidthChange={setLeftWidth}
          animDir="left"
        >
          <ProjectsView
            journeyStep={step}
            onOpenProject={() => { /* workspace is always center */ }}
            onNewProject={handleNewProject}
          />
        </PanelSection>

        {/* Center: workspace OR new project page */}
        <div style={{ flex: 1, minWidth: 320, display: "flex", flexDirection: "column", background: "var(--bg-1)" }}>
          {showNewProjectPage ? (
            <NewProjectPage
              phase={newProjectPhase!}
              onSelectOffer={handleOfferSelect}
              onAccept={handleContractAccept}
              onClose={handleNewProjectClose}
              cash={cash}
            />
          ) : inWorkspace ? (
            <ProjectWorkspace
              journeyStep={step}
              onAdvanceJourney={advance}
              cash={cash}
              isMobile={false}
            />
          ) : (
            /* Empty state canvas */
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 16,
                color: "var(--txt-2)",
              }}
            >
              <div style={{ fontSize: 56, opacity: .1 }}>⬡</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--txt-1)", letterSpacing: ".04em" }}>
                No active project
              </div>
              <div style={{ fontSize: 12, opacity: .7, textAlign: "center", lineHeight: 1.6, maxWidth: 320 }}>
                Accept a project offer to begin setting up infrastructure. Use the Projects panel or the + button.
              </div>
              <button
                onClick={handleNewProject}
                style={{
                  height: 38, padding: "0 20px",
                  borderRadius: 6, border: "1px solid var(--green-dim)",
                  background: "var(--green-surf)", color: "var(--green)",
                  cursor: "pointer", fontSize: 12, fontWeight: 700,
                  letterSpacing: ".06em", textTransform: "uppercase",
                  transition: "all .12s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--green-glow)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "var(--green-surf)"; }}
              >
                + New project
              </button>
            </div>
          )}
        </div>

        {/* Right: content panel (open) */}
        {rightPanel && (
          <RightPanel width={rightWidth} onWidthChange={setRightWidth}>
            {/* Right panel header */}
            <div
              style={{
                padding: "10px 12px",
                borderBottom: "1px solid var(--border-0)",
                display: "flex", alignItems: "center", gap: 8,
                flexShrink: 0,
              }}
            >
              <div className="sec-dot" style={{ background: "var(--txt-2)", boxShadow: "none" }} />
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".08em", color: "var(--txt-0)", textTransform: "uppercase" }}>
                {rightPanel}
              </span>
              <button
                onClick={() => setRightPanel(null)}
                style={{
                  marginLeft: "auto", width: 22, height: 22, borderRadius: 3,
                  border: "1px solid var(--border-1)", background: "transparent",
                  color: "var(--txt-2)", cursor: "pointer", fontSize: 12,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                ×
              </button>
            </div>
            <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
              {rightPanel === "inventory" && <InventoryView journeyStep={step} />}
              {rightPanel === "learning"  && <LearningView />}
              {rightPanel === "finances"  && <FinancesView />}
            </div>
          </RightPanel>
        )}

        {/* Right tab strip: Inventory / Learning / Finances */}
        <RightTabStrip active={rightPanel} onSelect={setRightPanel} />
      </div>

      {showActivity && <ActivityDrawer onClose={() => setShowActivity(false)} />}
      <JourneyControl step={step} onBack={rewind} onNext={advance} />
    </div>
  );
}
