import { useRef, type ReactNode } from "react";

interface PanelSectionProps {
  label: string;
  sublabel?: string;
  expanded: boolean;
  onToggle: () => void;
  tabSide: "left" | "right";
  width: number;
  onWidthChange?: (w: number) => void;
  minWidth?: number;
  maxWidth?: number;
  children: ReactNode;
  accent?: boolean;
  animDir?: "left" | "right";
}

export default function PanelSection({
  label, sublabel, expanded, onToggle, tabSide, width, onWidthChange,
  minWidth = 140, maxWidth = 520,
  children, accent, animDir,
}: PanelSectionProps) {
  const tabOnLeft = tabSide === "left";
  const dragRef = useRef<{ x: number; w: number } | null>(null);

  const onResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = { x: e.clientX, w: width };
    const move = (ev: MouseEvent) => {
      if (!dragRef.current || !onWidthChange) return;
      // left panel (tab on right): dragging right = bigger; left panel content is on the LEFT
      // tabOnLeft=false means content is LEFT, tab is RIGHT → drag right = expand
      const delta = tabOnLeft
        ? dragRef.current.x - ev.clientX   // right panel: drag left = expand
        : ev.clientX - dragRef.current.x;  // left panel: drag right = expand
      const newW = Math.min(maxWidth, Math.max(minWidth, dragRef.current.w + delta));
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

  const tabEl = (
    <button
      className="panel-tab"
      onClick={onToggle}
      style={{
        borderRight: "1px solid var(--border-0)",
        borderLeft:  "1px solid var(--border-0)",
        borderTop: "none", borderBottom: "none",
        height: "100%",
      }}
      title={expanded ? `Collapse ${label}` : `Expand ${label}`}
    >
      {expanded && (
        <div
          style={{
            position: "absolute", top: 0, bottom: 0, width: 2,
            background: accent !== false ? "var(--green)" : "var(--border-2)",
            left: tabOnLeft ? 0 : undefined,
            right: tabOnLeft ? undefined : 0,
          }}
        />
      )}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <span
          className="panel-tab-label"
          style={{ color: expanded ? (accent !== false ? "var(--green)" : "var(--txt-0)") : "var(--txt-2)" }}
        >
          {label}
          {sublabel && (
            <span style={{ marginTop: 4, fontSize: 8, color: expanded ? "var(--green)" : "var(--txt-2)" }}>
              {" "}{sublabel}
            </span>
          )}
        </span>
        <span
          style={{
            fontSize: 8, display: "block",
            color: expanded ? "var(--txt-1)" : "var(--txt-2)",
            transform: `rotate(${tabOnLeft ? (expanded ? 90 : -90) : (expanded ? -90 : 90)}deg)`,
          }}
        >▶</span>
      </div>
    </button>
  );

  // Resize grip — placed as absolute sibling in the outer wrapper so overflow:hidden on content doesn't clip it
  const resizeGrip = expanded && onWidthChange ? (
    <div
      onMouseDown={onResizeMouseDown}
      style={{
        position: "absolute",
        top: 0, bottom: 0,
        // For left panel (tab on right): grip sits at right edge of content = width px from left, overlapping the tab's left edge
        // For right panel (tab on left): grip sits at left edge of content = 28px from left (tab width)
        left: tabOnLeft ? 28 : width - 3,
        width: 6,
        cursor: "col-resize",
        zIndex: 20,
      }}
    />
  ) : null;

  return (
    <div style={{ display: "flex", height: "100%", flexShrink: 0, position: "relative" }}>
      {tabOnLeft ? <>{tabEl}{contentEl()}</> : <>{contentEl()}{tabEl}</>}
      {resizeGrip}
    </div>
  );

  function contentEl() {
    if (!expanded) return null;
    return (
      <div
        className={animDir === "right" ? "anim-slide-right" : "anim-slide-left"}
        style={{
          width,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          overflow: "hidden",
          borderRight: tabOnLeft ? "none" : "1px solid var(--border-0)",
          borderLeft:  tabOnLeft ? "1px solid var(--border-0)" : "none",
          background: "var(--bg-1)",
        }}
      >
        {children}
      </div>
    );
  }
}
