import { useState } from "react";
import { SERVER_OPTIONS } from "./scenario";

interface AcquisitionDrawerProps {
  cash: number;
  onAcquire: (owned: boolean) => void;
  onClose: () => void;
}

export default function AcquisitionDrawer({ cash, onAcquire, onClose }: AcquisitionDrawerProps) {
  const [selectedServer, setSelectedServer] = useState(SERVER_OPTIONS[0].id);
  const [mode, setMode] = useState<"buy" | "lease">("buy");

  const server = SERVER_OPTIONS.find((s) => s.id === selectedServer)!;
  const cost = mode === "buy" ? server.buyPrice : server.rentPerDay;
  const canAfford = mode === "buy" ? cash >= cost : true;

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer" style={{ maxHeight: "88vh" }}>
        <div className="drawer-handle" />

        <div
          style={{
            padding: "12px 16px 10px",
            borderBottom: "1px solid var(--navy-600)",
            display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>Add server</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>
              Choose hardware for Maya's Appointments
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              marginLeft: "auto", width: 28, height: 28, borderRadius: 6,
              border: "1px solid var(--navy-500)", background: "transparent",
              color: "var(--text-muted)", cursor: "pointer", fontSize: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>

        <div className="drawer-body" style={{ padding: "14px 16px 24px" }}>
          {/* Buy / Lease toggle */}
          <div
            style={{
              display: "flex", gap: 0, marginBottom: 16,
              background: "var(--navy-950)", borderRadius: 8,
              padding: 3, border: "1px solid var(--navy-600)",
            }}
          >
            {(["buy", "lease"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  flex: 1, height: 34, borderRadius: 6, border: "none",
                  background: mode === m ? "var(--navy-700)" : "transparent",
                  color: mode === m ? "var(--text-primary)" : "var(--text-muted)",
                  cursor: "pointer", fontSize: 13, fontWeight: mode === m ? 600 : 400,
                  transition: "all 0.15s", textTransform: "capitalize",
                }}
              >
                {m === "buy" ? "Buy (own)" : "Lease (rent/day)"}
              </button>
            ))}
          </div>

          {/* Mode explanation */}
          <div
            style={{
              marginBottom: 14, padding: "8px 12px", borderRadius: 6,
              background: "var(--navy-800)", fontSize: 11,
              color: "var(--text-muted)", lineHeight: 1.5,
            }}
          >
            {mode === "buy"
              ? "One-time purchase. No daily rental cost. Operating costs (maintenance + power) apply hourly while powered on. Resale at 80% of purchase price."
              : "No upfront cost. Daily rental accrues every 24 simulated hours while powered on or off. Release anytime — confirm impact to hosted projects."}
          </div>

          {/* Server options */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            {SERVER_OPTIONS.map((srv) => {
              const isSelected = selectedServer === srv.id;
              const price = mode === "buy" ? srv.buyPrice : srv.rentPerDay;
              const affordable = mode === "buy" ? cash >= price : true;

              return (
                <button
                  key={srv.id}
                  onClick={() => setSelectedServer(srv.id)}
                  disabled={!affordable}
                  style={{
                    width: "100%", textAlign: "left",
                    padding: "12px 14px", borderRadius: 8,
                    border: `1px solid ${isSelected ? "var(--navy-300)" : "var(--navy-600)"}`,
                    background: isSelected ? "var(--navy-750)" : "var(--navy-800)",
                    cursor: affordable ? "pointer" : "not-allowed",
                    opacity: affordable ? 1 : 0.5,
                    transition: "all 0.15s",
                    display: "flex", gap: 14, alignItems: "flex-start",
                  }}
                >
                  {/* Selection indicator */}
                  <div
                    style={{
                      width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                      border: `2px solid ${isSelected ? "var(--green-muted)" : "var(--navy-500)"}`,
                      background: isSelected ? "var(--green-muted)" : "transparent",
                      marginTop: 2,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
                          {srv.name}
                        </div>
                        {srv.recommended && (
                          <span
                            style={{
                              fontSize: 9, padding: "1px 6px", borderRadius: 20, marginTop: 3, display: "inline-block",
                              background: "var(--green-surface)", color: "var(--green-main)",
                              border: "1px solid var(--green-dim)", fontWeight: 600,
                            }}
                          >
                            Recommended
                          </span>
                        )}
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
                          ♦{price}
                        </div>
                        <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                          {mode === "buy" ? "one-time" : "/day"}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 10 }}>
                      {[
                        ["Cores", `${srv.cores} vCPU`],
                        ["RAM", srv.ram],
                        ["Disk", srv.disk],
                        ["Network", srv.network],
                      ].map(([k, v]) => (
                        <div key={k}>
                          <span style={{ fontSize: 9, color: "var(--text-muted)" }}>{k} </span>
                          <span style={{ fontSize: 10, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>{v}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: 8, fontSize: 10, color: "var(--text-muted)" }}>{srv.note}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Cash summary */}
          <div
            style={{
              background: "var(--navy-800)", borderRadius: 8, padding: "10px 14px",
              border: "1px solid var(--navy-700)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              marginBottom: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Current cash</div>
              <div style={{ fontSize: 13, fontFamily: "var(--font-mono)", color: "var(--text-mono)" }}>♦{cash.toFixed(2)}</div>
            </div>
            {mode === "buy" && (
              <>
                <div style={{ fontSize: 18, color: "var(--text-muted)" }}>→</div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>After purchase</div>
                  <div
                    style={{
                      fontSize: 13,
                      fontFamily: "var(--font-mono)",
                      color: (cash - server.buyPrice) >= 0 ? "var(--text-mono)" : "var(--red-main)",
                    }}
                  >
                    ♦{(cash - server.buyPrice).toFixed(2)}
                  </div>
                </div>
              </>
            )}
            {mode === "lease" && (
              <>
                <div style={{ fontSize: 18, color: "var(--text-muted)" }}>+</div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Ongoing cost</div>
                  <div style={{ fontSize: 13, fontFamily: "var(--font-mono)", color: "var(--amber-main)" }}>
                    ♦{server.rentPerDay}/day
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => onAcquire(mode === "buy")}
            disabled={!canAfford}
            style={{
              width: "100%", height: 48, borderRadius: 10, border: "none",
              background: canAfford ? "var(--green-muted)" : "var(--navy-600)",
              color: canAfford ? "#fff" : "var(--text-muted)",
              cursor: canAfford ? "pointer" : "not-allowed",
              fontSize: 15, fontWeight: 700, transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { if (canAfford) e.currentTarget.style.background = "var(--green-dim)"; }}
            onMouseLeave={(e) => { if (canAfford) e.currentTarget.style.background = "var(--green-muted)"; }}
          >
            {mode === "buy"
              ? `Buy ${server.name} — ♦${server.buyPrice}`
              : `Lease ${server.name} — ♦${server.rentPerDay}/day`}
          </button>
        </div>
      </div>
    </>
  );
}
