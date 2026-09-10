import { BILLING_HISTORY, DEMAND_HISTORY } from "./scenario";

function Spark({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const W = 260, H = 44;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 3) - 1;
    return `${x},${y}`;
  });
  const path = "M " + pts.join(" L ");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block", width: "100%" }}>
      <path d={`${path} L ${W},${H} L 0,${H} Z`} fill={color} opacity={0.08} />
      <path d={path} stroke={color} fill="none" strokeWidth={1.5} />
    </svg>
  );
}

function StatRow({ label, value, color = "var(--txt-0)", mono = true }: { label: string; value: string; color?: string; mono?: boolean }) {
  return (
    <div
      style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "5px 0", borderBottom: "1px solid var(--border-0)",
        fontSize: 11,
      }}
    >
      <span style={{ color: "var(--txt-2)" }}>{label}</span>
      <span style={{ fontWeight: 700, color, fontFamily: mono ? "var(--font-mono)" : undefined }}>{value}</span>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 9, fontWeight: 700, color: "var(--txt-2)", letterSpacing: ".07em", textTransform: "uppercase", marginBottom: 6 }}>
      {children}
    </div>
  );
}

export default function FinancesView() {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Key stats strip */}
      <div
        style={{
          padding: "7px 12px 10px",
          borderBottom: "1px solid var(--border-0)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[
            { label: "CASH", value: "♦340.00", color: "var(--green)" },
            { label: "RECV", value: "♦40.00",  color: "var(--sky)" },
            { label: "OPEX/WK", value: "♦17.77", color: "var(--red)" },
            { label: "REP", value: "0", color: "var(--txt-1)" },
          ].map((s) => (
            <div key={s.label}>
              <div style={{ fontSize: 8, fontWeight: 700, color: "var(--txt-2)", letterSpacing: ".07em", marginBottom: 2 }}>{s.label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--font-mono)", color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel-body" style={{ padding: "12px" }}>
        {/* Demand sparkline */}
        <div style={{ marginBottom: 16 }}>
          <SectionLabel>Demand — Maya's Appointments</SectionLabel>
          <Spark data={DEMAND_HISTORY} color="var(--sky)" />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            <span style={{ fontSize: 8, color: "var(--txt-2)", fontFamily: "var(--font-mono)" }}>D1 00:00</span>
            <span style={{ fontSize: 8, color: "var(--txt-2)", fontFamily: "var(--font-mono)" }}>now</span>
          </div>
        </div>

        {/* Billing periods */}
        <div style={{ marginBottom: 16 }}>
          <SectionLabel>Billing periods</SectionLabel>
          {BILLING_HISTORY.map((b) => (
            <div key={b.label} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: "var(--txt-1)", marginBottom: 4 }}>{b.label}</div>
              <StatRow label="Earned" value={`♦${b.earned.toFixed(2)}`} color="var(--green)" />
              <StatRow label="Costs" value={`♦${b.costs.toFixed(2)}`} color="var(--red)" />
              <StatRow label="Balance" value={`♦${b.balance.toFixed(2)}`} color="var(--txt-0)" />
              <StatRow
                label="SLA actual"
                value={`${b.slaActual}% / ${b.slaTarget}%`}
                color={b.slaActual >= b.slaTarget ? "var(--green)" : "var(--red)"}
              />
            </div>
          ))}
        </div>

        {/* Transactions */}
        <div>
          <SectionLabel>Transactions</SectionLabel>
          {[
            { label: "Advance — Maya's Appts", amount: "+♦80.00", date: "D1 11:00", credit: true },
            { label: "Server A opex (est.)",   amount: "−♦8.90",  date: "D1–7",    credit: false },
            { label: "Fee accrued (Week 1)",    amount: "♦40.00",  date: "D4",      credit: true },
          ].map((tx, i) => (
            <div
              key={i}
              style={{
                display: "flex", alignItems: "flex-start", gap: 8,
                padding: "7px 0", borderBottom: "1px solid var(--border-0)",
              }}
            >
              <div
                style={{
                  width: 6, height: 6, borderRadius: "50%", marginTop: 3, flexShrink: 0,
                  background: tx.credit ? "var(--green)" : "var(--red)",
                  boxShadow: `0 0 4px ${tx.credit ? "var(--green)" : "var(--red)"}`,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: "var(--txt-1)" }}>{tx.label}</div>
                <div style={{ fontSize: 9, color: "var(--txt-2)", fontFamily: "var(--font-mono)", marginTop: 1 }}>{tx.date}</div>
              </div>
              <div
                style={{
                  fontSize: 12, fontWeight: 700, fontFamily: "var(--font-mono)",
                  color: tx.credit ? "var(--green)" : "var(--red)", flexShrink: 0,
                }}
              >
                {tx.amount}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
