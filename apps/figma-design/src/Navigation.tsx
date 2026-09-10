import type { GameView } from "./scenario";

interface NavProps {
  view: GameView;
  onViewChange: (v: GameView) => void;
  onNewProject: () => void;
  railExpanded: boolean;
  onRailToggle: () => void;
}

const NAV_ITEMS: { id: GameView; label: string; icon: string }[] = [
  { id: "projects",  label: "Projects",  icon: "⬡" },
  { id: "inventory", label: "Inventory", icon: "⊞" },
  { id: "learning",  label: "Learning",  icon: "◈" },
  { id: "finances",  label: "Finances",  icon: "◇" },
];

/* ─── Desktop Rail ─────────────────────────────────────────────── */
export function DesktopRail({ view, onViewChange, onNewProject, railExpanded, onRailToggle }: NavProps) {
  const w = railExpanded ? 160 : 48;

  return (
    <nav
      style={{
        width: w,
        flexShrink: 0,
        background: "var(--navy-950)",
        borderRight: "1px solid var(--navy-600)",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.2s ease",
        overflow: "hidden",
        zIndex: 20,
      }}
    >
      {/* New Project button */}
      <button
        onClick={onNewProject}
        style={{
          margin: "10px 8px 4px",
          height: 36,
          borderRadius: 8,
          border: "1px solid var(--green-muted)",
          background: "var(--green-surface)",
          color: "var(--green-main)",
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: railExpanded ? "flex-start" : "center",
          gap: 8,
          padding: railExpanded ? "0 12px" : "0",
          transition: "all 0.15s",
          whiteSpace: "nowrap",
          overflow: "hidden",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--green-dim)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "var(--green-surface)"; }}
      >
        <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
        {railExpanded && <span>New project</span>}
      </button>

      <div style={{ height: 1, background: "var(--navy-600)", margin: "6px 0" }} />

      {/* Nav items */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, padding: "0 8px" }}>
        {NAV_ITEMS.map((item) => {
          const active = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              style={{
                height: 36,
                borderRadius: 6,
                border: "none",
                background: active ? "var(--navy-700)" : "transparent",
                color: active ? "var(--text-primary)" : "var(--text-muted)",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                display: "flex",
                alignItems: "center",
                justifyContent: railExpanded ? "flex-start" : "center",
                gap: 10,
                padding: railExpanded ? "0 10px" : "0",
                transition: "all 0.15s",
                whiteSpace: "nowrap",
                overflow: "hidden",
                borderLeft: active ? "2px solid var(--green-muted)" : "2px solid transparent",
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--navy-750)"; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{ fontSize: 15, flexShrink: 0 }}>{item.icon}</span>
              {railExpanded && <span>{item.label}</span>}
            </button>
          );
        })}
      </div>

      {/* Rail toggle */}
      <button
        onClick={onRailToggle}
        style={{
          margin: "8px",
          height: 32,
          borderRadius: 6,
          border: "1px solid var(--navy-600)",
          background: "transparent",
          color: "var(--text-muted)",
          cursor: "pointer",
          fontSize: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--navy-400)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--navy-600)"; e.currentTarget.style.color = "var(--text-muted)"; }}
        title={railExpanded ? "Collapse rail" : "Expand rail"}
      >
        {railExpanded ? "‹" : "›"}
      </button>
    </nav>
  );
}

/* ─── Mobile Bottom Nav ────────────────────────────────────────── */
export function MobileBottomNav({ view, onViewChange, onNewProject }: NavProps) {
  return (
    <nav
      style={{
        height: 56,
        flexShrink: 0,
        background: "var(--navy-950)",
        borderTop: "1px solid var(--navy-600)",
        display: "flex",
        alignItems: "center",
        paddingBottom: "env(safe-area-inset-bottom, 0)",
        zIndex: 20,
      }}
    >
      {/* Projects */}
      <MobileTab icon="⬡" label="Projects" active={view === "projects"} onClick={() => onViewChange("projects")} />
      {/* Inventory */}
      <MobileTab icon="⊞" label="Inventory" active={view === "inventory"} onClick={() => onViewChange("inventory")} />
      {/* New Project — central action */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <button
          onClick={onNewProject}
          style={{
            width: 52, height: 52,
            borderRadius: "50%",
            border: "2px solid var(--green-muted)",
            background: "var(--green-surface)",
            color: "var(--green-main)",
            cursor: "pointer",
            fontSize: 24,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 16px rgba(34,197,94,0.25)",
            transition: "all 0.15s",
            marginBottom: 8,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--green-dim)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--green-surface)"; }}
          aria-label="New project"
        >
          +
        </button>
      </div>
      {/* Learning */}
      <MobileTab icon="◈" label="Learning" active={view === "learning"} onClick={() => onViewChange("learning")} />
      {/* Finances */}
      <MobileTab icon="◇" label="Finances" active={view === "finances"} onClick={() => onViewChange("finances")} />
    </nav>
  );
}

function MobileTab({ icon, label, active, onClick }: { icon: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        height: "100%",
        border: "none",
        background: "transparent",
        color: active ? "var(--green-main)" : "var(--text-muted)",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        transition: "color 0.15s",
        paddingTop: 4,
      }}
    >
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ fontSize: 10, fontWeight: active ? 600 : 400 }}>{label}</span>
    </button>
  );
}
