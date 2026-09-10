import { useState, useEffect } from "react";

interface TopBarProps {
  cash: number;
  reputation: number;
  opex: number;
  speed: number;
  onSpeedChange: (s: number) => void;
  opsTasks: { label: string; hoursRemaining: number; progress: number }[];
  learningSlots: { label: string; progress: number }[];
  onActivityOpen: () => void;
  isMobile?: boolean;
}

/* ─── Sim clock ──────────────────────────────────────────────────── */
function useSimTicks(speed: number) {
  const [ticks, setTicks] = useState(0);
  useEffect(() => {
    if (speed === 0) return;
    const id = setInterval(() => setTicks((t) => t + 1), 5000 / speed);
    return () => clearInterval(id);
  }, [speed]);
  return ticks;
}

/* ─── Calendar bar clock ─────────────────────────────────────────── */
// Sep 9 2026 is today. Each sim tick = 1 sim hour.
const SIM_START = new Date(2026, 8, 9); // month is 0-indexed

function CalendarClock({ ticks }: { ticks: number }) {
  const simDay  = Math.floor(ticks / 24);
  const simHour = ticks % 24;

  const date = new Date(SIM_START);
  date.setDate(SIM_START.getDate() + simDay);
  const label = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const fillPct = Math.round((simHour / 24) * 100);

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--txt-0)", fontFamily: "var(--font-mono)", lineHeight: 1, whiteSpace: "nowrap" }}>
        {label}
      </span>
      <div style={{ height: 3, borderRadius: 2, background: "var(--bg-4)", overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 2,
          width: `${fillPct}%`,
          background: "var(--txt-m)",
          transition: "width .6s ease",
        }} />
      </div>
    </div>
  );
}

/* ─── Profile drawer — slides from LEFT ──────────────────────────── */
function ProfileDrawer({ onClose }: { onClose: () => void }) {
  const menuItems: { icon: string; label: string; color?: string }[] = [
    { icon: "◎", label: "View profile" },
    { icon: "⚙", label: "Settings" },
    { icon: "⊟", label: "Keyboard shortcuts" },
    { icon: "◈", label: "What's new" },
  ];

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(4,7,15,.5)",
          backdropFilter: "blur(2px)",
          zIndex: 80,
        }}
      />
      <div
        className="anim-slide-left"
        style={{
          position: "fixed", top: 0, left: 0, bottom: 0,
          width: 280,
          background: "var(--bg-2)",
          borderRight: "1px solid var(--border-0)",
          zIndex: 90,
          display: "flex", flexDirection: "column",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "14px 16px",
          borderBottom: "1px solid var(--border-0)",
          display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8, flexShrink: 0,
            background: "var(--green-surf)", border: "1px solid var(--green-dim)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 800, color: "var(--green)", fontFamily: "var(--font-mono)",
          }}>OP</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--txt-0)" }}>Operator</div>
            <div style={{ fontSize: 10, color: "var(--txt-2)" }}>ops@fivenines.io</div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 26, height: 26, borderRadius: 4,
              border: "1px solid var(--border-1)", background: "transparent",
              color: "var(--txt-2)", cursor: "pointer", fontSize: 14,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >×</button>
        </div>

        {/* Menu items */}
        <div className="panel-body">
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={onClose}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                width: "100%", padding: "11px 16px",
                border: "none", borderBottom: "1px solid var(--border-0)",
                background: "transparent",
                color: item.color ?? "var(--txt-1)", cursor: "pointer",
                fontSize: 12, textAlign: "left", transition: "background .1s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-3)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{ fontSize: 14, color: "var(--txt-2)", width: 18, flexShrink: 0 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}

          <button
            onClick={onClose}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              width: "100%", padding: "11px 16px", marginTop: 8,
              border: "none", borderBottom: "1px solid var(--border-0)",
              background: "transparent",
              color: "var(--red)", cursor: "pointer",
              fontSize: 12, textAlign: "left", transition: "background .1s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-3)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <span style={{ fontSize: 14, width: 18, flexShrink: 0 }}>⏻</span>
            Sign out
          </button>
        </div>
      </div>
    </>
  );
}

/* ─── TopBar ─────────────────────────────────────────────────────── */
/* ─── Speed buttons ──────────────────────────────────────────────── */
function SpeedButtons({ speed, onSpeedChange }: { speed: number; onSpeedChange: (s: number) => void }) {
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {([0, 1, 2, 4] as const).map((s) => (
        <button
          key={s}
          onClick={() => onSpeedChange(s)}
          style={{
            width: s === 0 ? 26 : 22, height: 20, borderRadius: 3,
            border: "1px solid", fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 700,
            cursor: "pointer", transition: "all .12s",
            borderColor: speed === s ? "var(--green)" : "var(--border-1)",
            background: speed === s ? "var(--green-surf)" : "transparent",
            color: speed === s ? "var(--green)" : "var(--txt-2)",
          }}
        >{s === 0 ? "⏸" : `${s}×`}</button>
      ))}
    </div>
  );
}

export default function TopBar({
  cash, reputation, opex, speed, onSpeedChange,
  opsTasks, learningSlots, onActivityOpen, isMobile,
}: TopBarProps) {
  const ticks = useSimTicks(speed);
  const [profileOpen, setProfileOpen] = useState(false);

  /* ── shared section styles ── */
  const seg = (extra?: React.CSSProperties): React.CSSProperties => ({
    padding: "0 14px", display: "flex", alignItems: "center", gap: 12,
    borderRight: "1px solid var(--border-0)", height: "100%", flexShrink: 0,
    ...extra,
  });

  const actBtn = (bordered = true) => (
    <button
      onClick={onActivityOpen}
      title="Activity"
      style={{
        width: 44, height: "100%",
        border: "none", borderRight: bordered ? "1px solid var(--border-0)" : "none",
        background: "transparent", color: "var(--txt-2)", cursor: "pointer",
        fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
        transition: "color .12s, background .12s", flexShrink: 0,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-3)"; e.currentTarget.style.color = "var(--txt-1)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--txt-2)"; }}
    >⌁</button>
  );

  const dateGroupRow = (
    <div style={seg({ borderRight: "none", gap: 10 })}>
      <CalendarClock ticks={ticks} />
      <SpeedButtons speed={speed} onSpeedChange={onSpeedChange} />
    </div>
  );

  const dateGroupCol = (
    <div style={seg({ borderRight: "1px solid var(--border-0)", flexDirection: "column", gap: 5, justifyContent: "center", alignItems: "flex-end" })}>
      <CalendarClock ticks={ticks} />
      <SpeedButtons speed={speed} onSpeedChange={onSpeedChange} />
    </div>
  );

  const cashGroup = (
    <div style={seg({ gap: 20 })}>
      <Stat label="CASH" value={`♦${cash.toFixed(2)}`} color="var(--green)" />
      <Stat label="REP"  value={String(reputation)}     color="var(--txt-1)" />
      <Stat label="OPEX" value={`♦${opex.toFixed(2)}`} color="var(--txt-1)" />
    </div>
  );

  if (isMobile) {
    return (
      <>
        <header style={{
          height: 56, flexShrink: 0,
          background: "var(--bg-0)", borderBottom: "1px solid var(--border-0)",
          display: "flex", alignItems: "center",
          zIndex: 50, userSelect: "none",
        }}>
          {/* 1 — Profile icon */}
          <button
            onClick={() => setProfileOpen(true)}
            title="Profile"
            style={{
              width: 52, height: "100%",
              border: "none", borderRight: "1px solid var(--border-0)",
              background: profileOpen ? "var(--bg-2)" : "transparent",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, transition: "background .12s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-2)"; }}
            onMouseLeave={(e) => { if (!profileOpen) e.currentTarget.style.background = "transparent"; }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: 6,
              background: "var(--green-surf)", border: "1px solid var(--green-dim)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 800, color: "var(--green)", fontFamily: "var(--font-mono)",
            }}>OP</div>
          </button>

          {/* 2 — Cash group */}
          <div style={seg({ gap: 16, flexShrink: 0 })}>
            <Stat label="CASH" value={`♦${cash.toFixed(0)}`} color="var(--green)" />
            <Stat label="REP"  value={String(reputation)}    color="var(--txt-1)" />
            <Stat label="OPEX" value={`♦${opex.toFixed(0)}`} color="var(--txt-1)" />
          </div>

          <div style={{ flex: 1 }} />

          {/* 3 — Date group (stacked col) */}
          {dateGroupCol}

          {/* 4 — Activity */}
          {actBtn(false)}
        </header>
        {profileOpen && <ProfileDrawer onClose={() => setProfileOpen(false)} />}
      </>
    );
  }

  /* ── Desktop: Profile | Cash | Tasks | Activity | Date ── */
  return (
    <>
      <header style={{
        height: 44, flexShrink: 0,
        background: "var(--bg-0)", borderBottom: "1px solid var(--border-0)",
        display: "flex", alignItems: "center",
        zIndex: 50, userSelect: "none",
      }}>
        {/* 1 — Profile */}
        <button
          onClick={() => setProfileOpen(true)}
          style={{
            width: 168, flexShrink: 0, padding: "0 14px",
            display: "flex", alignItems: "center", gap: 9, height: "100%",
            border: "none",
            borderLeft: "1px solid var(--border-0)",
            borderRight: "1px solid var(--border-0)",
            background: profileOpen ? "var(--bg-2)" : "transparent",
            cursor: "pointer", textAlign: "left", transition: "background .12s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-2)"; }}
          onMouseLeave={(e) => { if (!profileOpen) e.currentTarget.style.background = "transparent"; }}
        >
          <div style={{
            width: 24, height: 24, borderRadius: 5, flexShrink: 0,
            background: "var(--green-surf)", border: "1px solid var(--green-dim)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontWeight: 800, color: "var(--green)", fontFamily: "var(--font-mono)",
          }}>OP</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--txt-0)", lineHeight: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Operator</div>
            <div style={{ fontSize: 9, color: "var(--txt-2)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>ops@fivenines.io</div>
          </div>
        </button>

        {/* 2 — Cash */}
        {cashGroup}

        {/* 3 — Tasks */}
        <div style={{ flex: 1, padding: "0 12px", display: "flex", alignItems: "center", gap: 10, borderRight: "1px solid var(--border-0)", height: "100%", overflow: "hidden" }}>
          {opsTasks.length === 0 && learningSlots.length === 0 ? (
            <span style={{ fontSize: 10, color: "var(--txt-2)" }}>No active tasks</span>
          ) : (
            <>
              {opsTasks.map((t, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, padding: "3px 9px", borderRadius: 4, background: "var(--bg-3)", border: "1px solid var(--border-0)" }}>
                  <div className="lamp lamp-s pulse" />
                  <span style={{ fontSize: 10, color: "var(--txt-1)" }}>{t.label}</span>
                  <div style={{ width: 48, height: 2, borderRadius: 99, background: "var(--bg-5)", overflow: "hidden" }}>
                    <div style={{ height: "100%", background: "var(--sky)", width: `${t.progress}%`, borderRadius: 99 }} />
                  </div>
                  <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--sky-hi)" }}>{t.hoursRemaining}h</span>
                </div>
              ))}
              {learningSlots.map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, padding: "3px 9px", borderRadius: 4, background: "var(--bg-3)", border: "1px solid var(--border-0)" }}>
                  <div className="lamp lamp-a pulse" />
                  <span style={{ fontSize: 10, color: "var(--txt-1)" }}>{s.label}</span>
                  <div style={{ width: 48, height: 2, borderRadius: 99, background: "var(--bg-5)", overflow: "hidden" }}>
                    <div style={{ height: "100%", background: "var(--amber)", width: `${s.progress}%`, borderRadius: 99 }} />
                  </div>
                  <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--amber-hi)" }}>{s.progress}%</span>
                </div>
              ))}
            </>
          )}
        </div>

        {/* 4 — Date group (row) */}
        {dateGroupRow}

        {/* 5 — Activity */}
        {actBtn(false)}
      </header>

      {profileOpen && <ProfileDrawer onClose={() => setProfileOpen(false)} />}
    </>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div style={{ fontSize: 9, color: "var(--txt-2)", fontWeight: 700, letterSpacing: ".06em", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--font-mono)", color, lineHeight: 1 }}>{value}</div>
    </div>
  );
}
