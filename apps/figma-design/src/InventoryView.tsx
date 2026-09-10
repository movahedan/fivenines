import { useState } from "react";
import type { JourneyStep } from "./scenario";

type Detail = string | null;

const RESOURCE_COLORS = {
  cpu:  "var(--sky)",
  ram:  "var(--green)",
  disk: "var(--amber)",
  net:  "var(--txt-m)",
};

function ResourceChip({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div
      style={{
        display: "flex", flexDirection: "column", gap: 3,
        padding: "4px 8px",
        borderRadius: 4,
        background: color + "12",
        border: `1px solid ${color}30`,
        minWidth: 44,
      }}
    >
      <span style={{ fontSize: 8, fontWeight: 700, color, letterSpacing: ".06em" }}>{label}</span>
      <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "var(--font-mono)", color }}>{pct}%</span>
    </div>
  );
}

function ServerDetail({ onClose }: { onClose: () => void }) {
  return (
    <div className="anim-fade" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <div
        style={{
          padding: "10px 12px",
          borderBottom: "1px solid var(--border-0)",
          display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
        }}
      >
        <div className="lamp lamp-g" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--txt-0)" }}>Server A</div>
          <div style={{ fontSize: 9, color: "var(--txt-2)", marginTop: 1, fontFamily: "var(--font-mono)" }}>general-small · owned</div>
        </div>
        <button
          onClick={onClose}
          style={{
            width: 22, height: 22, borderRadius: 4,
            border: "1px solid var(--border-1)", background: "transparent",
            color: "var(--txt-2)", cursor: "pointer", fontSize: 12,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >×</button>
      </div>
      <div className="panel-body" style={{ padding: "12px" }}>
        {/* Specs */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 9, color: "var(--txt-2)", fontWeight: 700, letterSpacing: ".06em", marginBottom: 6 }}>SPECS</div>
          {[
            { label: "Cores", value: "2 vCPU" },
            { label: "RAM", value: "2 GiB" },
            { label: "Disk", value: "64 GiB SSD" },
            { label: "Network", value: "100 Mbps" },
          ].map((r) => (
            <div
              key={r.label}
              style={{
                display: "flex", justifyContent: "space-between",
                padding: "5px 0", borderBottom: "1px solid var(--border-0)",
                fontSize: 11,
              }}
            >
              <span style={{ color: "var(--txt-2)" }}>{r.label}</span>
              <span style={{ color: "var(--txt-0)", fontFamily: "var(--font-mono)" }}>{r.value}</span>
            </div>
          ))}
        </div>

        {/* Resource usage */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 9, color: "var(--txt-2)", fontWeight: 700, letterSpacing: ".06em", marginBottom: 8 }}>UTILISATION</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <ResourceChip label="CPU" pct={7}  color={RESOURCE_COLORS.cpu} />
            <ResourceChip label="RAM" pct={41} color={RESOURCE_COLORS.ram} />
            <ResourceChip label="DISK" pct={18} color={RESOURCE_COLORS.disk} />
            <ResourceChip label="NET" pct={2}  color={RESOURCE_COLORS.net} />
          </div>
        </div>

        {/* Projects */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 9, color: "var(--txt-2)", fontWeight: 700, letterSpacing: ".06em", marginBottom: 6 }}>PROJECTS</div>
          <div
            style={{
              fontSize: 10, padding: "4px 8px", borderRadius: 4,
              background: "var(--green-surf)", border: "1px solid var(--green-dim)",
              color: "var(--green)", display: "inline-block",
            }}
          >
            Maya's Appointments
          </div>
        </div>

        {/* Financials */}
        <div>
          <div style={{ fontSize: 9, color: "var(--txt-2)", fontWeight: 700, letterSpacing: ".06em", marginBottom: 6 }}>VALUE</div>
          {[
            { label: "Purchase price", value: "♦240", color: "var(--txt-0)" },
            { label: "Resale estimate", value: "♦192", color: "var(--txt-1)" },
            { label: "Opex / day", value: "♦1.27", color: "var(--amber)" },
          ].map((r) => (
            <div
              key={r.label}
              style={{
                display: "flex", justifyContent: "space-between",
                padding: "5px 0", borderBottom: "1px solid var(--border-0)",
                fontSize: 11,
              }}
            >
              <span style={{ color: "var(--txt-2)" }}>{r.label}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: r.color }}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ServerRow({ onClick, active }: { onClick: () => void; active: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", display: "flex", gap: 10, alignItems: "center",
        padding: "9px 12px",
        border: "none",
        borderBottom: "1px solid var(--border-0)",
        background: active ? "var(--bg-3)" : "transparent",
        cursor: "pointer", textAlign: "left",
        transition: "background .1s",
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--bg-2)"; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      {/* Icon */}
      <div
        style={{
          width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
          background: "var(--sky)18", border: "1.5px solid var(--sky)55",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 10, fontWeight: 800, color: "var(--sky)", fontFamily: "var(--font-mono)",
        }}
      >
        SRV
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--txt-0)" }}>Server A</div>
        <div style={{ fontSize: 9, color: "var(--txt-2)", marginTop: 1, fontFamily: "var(--font-mono)" }}>general-small</div>
      </div>

      {/* Colorful resource chips — compact */}
      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
        {([["CPU", 7, RESOURCE_COLORS.cpu], ["RAM", 41, RESOURCE_COLORS.ram]] as const).map(([l, v, c]) => (
          <div
            key={l}
            style={{
              fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 700,
              color: c as string, padding: "2px 5px", borderRadius: 3,
              background: (c as string) + "18", border: `1px solid ${c as string}40`,
            }}
          >
            {v}%
          </div>
        ))}
      </div>

      <div className="lamp lamp-g" style={{ flexShrink: 0 }} />
    </button>
  );
}

export default function InventoryView({ journeyStep }: { journeyStep: JourneyStep }) {
  const [detail, setDetail] = useState<Detail>(null);
  const hasServer = !["empty", "offer-list", "contract-review", "accepted-no-server"].includes(journeyStep);

  if (detail === "server-a") {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <ServerDetail onClose={() => setDetail(null)} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Summary strip */}
      <div
        style={{
          padding: "7px 12px",
          borderBottom: "1px solid var(--border-0)",
          flexShrink: 0,
          fontSize: 9, color: "var(--txt-2)", fontWeight: 700, letterSpacing: ".06em",
          textTransform: "uppercase",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}
      >
        <span>Servers</span>
        <span style={{ fontFamily: "var(--font-mono)", color: hasServer ? "var(--txt-1)" : "var(--txt-2)" }}>
          {hasServer ? "1 owned" : "—"}
        </span>
      </div>

      <div className="panel-body">
        {hasServer ? (
          <ServerRow onClick={() => setDetail("server-a")} active={detail === "server-a"} />
        ) : (
          <div style={{ padding: "32px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 28, opacity: .1, marginBottom: 8 }}>⊞</div>
            <div style={{ fontSize: 11, color: "var(--txt-2)", lineHeight: 1.6 }}>
              No hardware yet.<br />Acquire from a project workspace.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
