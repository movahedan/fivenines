import { OFFER } from "./scenario";

interface NewProjectPageProps {
  phase: "offer" | "contract";
  onSelectOffer: () => void;
  onAccept: () => void;
  onClose: () => void;
  cash: number;
  isMobile?: boolean;
}

function Row({ label, value, color, mono }: { label: string; value: string; color?: string; mono?: boolean }) {
  return (
    <div
      style={{
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        padding: "6px 0", borderBottom: "1px solid var(--border-0)", gap: 16, fontSize: 11,
      }}
    >
      <span style={{ color: "var(--txt-2)", flexShrink: 0 }}>{label}</span>
      <span style={{
        color: color ?? "var(--txt-0)", fontWeight: color ? 700 : 400,
        fontFamily: mono ? "var(--font-mono)" : undefined, textAlign: "right",
      }}>
        {value}
      </span>
    </div>
  );
}

function SectLabel({ title }: { title: string }) {
  return (
    <div style={{
      fontSize: 9, fontWeight: 700, color: "var(--txt-2)", letterSpacing: ".1em",
      textTransform: "uppercase", marginTop: 20, marginBottom: 4,
      paddingBottom: 4, borderBottom: "1px solid var(--border-0)",
    }}>
      {title}
    </div>
  );
}

function OfferPage({ onReviewContract, isMobile }: { onReviewContract: () => void; isMobile?: boolean }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
        gap: 0,
        height: isMobile ? undefined : "100%",
        overflow: isMobile ? undefined : "hidden",
      }}
    >
      {/* Left col */}
      <div style={{ padding: "20px 28px", overflow: "auto" }}>
        {/* Customer identity */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div
            style={{
              width: 40, height: 40, borderRadius: 8, flexShrink: 0,
              background: "var(--bg-4)", border: "1px solid var(--border-1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 800, color: "var(--txt-1)", fontFamily: "var(--font-mono)",
            }}
          >MC</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--txt-0)" }}>{OFFER.customer}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 3, alignItems: "center" }}>
              <span style={{
                fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 20,
                background: "var(--green-surf)", border: "1px solid var(--green-dim)", color: "var(--green)",
              }}>{OFFER.customerRelation}</span>
              <span style={{ fontSize: 10, color: "var(--txt-2)", fontFamily: "var(--font-mono)" }}>
                trust {OFFER.customerTrust}
              </span>
            </div>
          </div>
        </div>

        <div style={{ fontSize: 12, color: "var(--txt-1)", lineHeight: 1.7, marginBottom: 4 }}>
          {OFFER.description}
        </div>

        <SectLabel title="Project" />
        <Row label="Type"            value={OFFER.projectType} />
        <Row label="Demand"          value={`~${OFFER.demandPerHour} req/h`} mono />
        <Row label="Traffic pattern" value={OFFER.rhythmProfile} />
        <Row label="Demand mix"      value={OFFER.rootMix} />

        <SectLabel title="Required technologies" />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", paddingTop: 6, paddingBottom: 10 }}>
          {OFFER.requiredTechnologies.map((t) => (
            <span key={t} style={{
              fontSize: 10, padding: "3px 9px", borderRadius: 20,
              background: "var(--green-surf)", border: "1px solid var(--green-dim)", color: "var(--green)",
            }}>{t}</span>
          ))}
        </div>

        <div style={{ fontSize: 10, color: "var(--txt-2)", lineHeight: 1.6, marginTop: 8 }}>
          Expires in {OFFER.expiresIn}. Declining has no penalty.
        </div>
      </div>

      {/* Right col */}
      <div style={{
        padding: "20px 28px", overflow: "auto", display: "flex", flexDirection: "column",
        borderLeft: isMobile ? "none" : "1px solid var(--border-0)",
        borderTop: isMobile ? "1px solid var(--border-0)" : "none",
      }}>
        <SectLabel title="Commercial terms" />
        <Row label="Advance on acceptance" value={`♦${OFFER.advance}`}           color="var(--green)" mono />
        <Row label="Weekly fixed fee"       value={`♦${OFFER.weeklyFee}`}         color="var(--green)" mono />
        <Row label="Usage fee"              value="None" />
        <Row label="SLA target"             value={`${OFFER.sla}%`}               color="var(--txt-0)" mono />
        <Row label="Setup allowance"        value={`${OFFER.setupAllowanceHours}h`} mono />

        <SectLabel title="Refund exposure" />
        {OFFER.refundBands.map((b) => (
          <Row key={b.label} label={b.label} value={`${b.pct}%`}
            color={b.pct >= 50 ? "var(--red)" : "var(--amber)"} mono />
        ))}

        <div style={{ fontSize: 11, color: "var(--txt-2)", lineHeight: 1.6, marginTop: 16, marginBottom: 20 }}>
          {OFFER.cancellationTerms}
        </div>

        <div style={{ marginTop: "auto" }}>
          <button
            onClick={onReviewContract}
            style={{
              width: "100%", height: 44, borderRadius: 6,
              border: "1px solid var(--green)", background: "var(--green-surf)", color: "var(--green)",
              cursor: "pointer", fontSize: 13, fontWeight: 700,
              letterSpacing: ".03em", transition: "all .12s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--green-glow)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--green-surf)"; }}
          >
            Review full contract →
          </button>
        </div>
      </div>
    </div>
  );
}

function ContractPage({ onAccept, onBack, isMobile }: { onAccept: () => void; onBack: () => void; isMobile?: boolean }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
        gap: 0,
        height: isMobile ? undefined : "100%",
        overflow: isMobile ? undefined : "hidden",
      }}
    >
      {/* Left col */}
      <div style={{ padding: "20px 28px", overflow: "auto" }}>
        <SectLabel title="Service obligations" />
        <Row label="Availability (SLA)"    value={`${OFFER.sla}%`} color="var(--txt-0)" mono />
        <Row label="Measurement period"    value="Per 168h billing week" />
        <Row label="Setup allowance"       value={`${OFFER.setupAllowanceHours}h from acceptance`} mono />
        <Row label="Demand"                value={`${OFFER.demandPerHour} req/h (office hours)`} mono />

        <SectLabel title="Refund schedule — missed SLA" />
        {OFFER.refundBands.map((b) => (
          <Row key={b.label} label={b.label} value={`${b.pct}% of fee`}
            color={b.pct >= 50 ? "var(--red)" : "var(--amber)"} mono />
        ))}
        <Row label="All demand missed" value="100% of fee" color="var(--red)" mono />

        <SectLabel title="Cancellation" />
        <div style={{ fontSize: 11, color: "var(--txt-1)", lineHeight: 1.7, paddingTop: 6 }}>
          {OFFER.cancellationTerms}
        </div>
      </div>

      {/* Right col */}
      <div style={{
        padding: "20px 28px", overflow: "auto", display: "flex", flexDirection: "column",
        borderLeft: isMobile ? "none" : "1px solid var(--border-0)",
        borderTop: isMobile ? "1px solid var(--border-0)" : "none",
      }}>
        <SectLabel title="Payment" />
        <Row label="Advance — on acceptance" value={`♦${OFFER.advance}`}   color="var(--green)" mono />
        <Row label="Weekly fixed fee"         value={`♦${OFFER.weeklyFee}`} color="var(--green)" mono />
        <Row label="Usage fee"                value="None" />

        <SectLabel title="Scope" />
        <Row label="Type"         value={OFFER.projectType} />
        <Row label="Demand mix"   value={OFFER.rootMix} />

        <SectLabel title="Required technologies" />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", paddingTop: 6, paddingBottom: 16 }}>
          {OFFER.requiredTechnologies.map((t) => (
            <span key={t} style={{
              fontSize: 10, padding: "3px 9px", borderRadius: 20,
              background: "var(--green-surf)", border: "1px solid var(--green-dim)", color: "var(--green)",
            }}>{t}</span>
          ))}
        </div>

        <div style={{ marginTop: "auto" }}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "10px 14px", marginBottom: 10,
            borderTop: "1px solid var(--border-0)", paddingTop: 14,
          }}>
            <span style={{ fontSize: 11, color: "var(--txt-1)" }}>Receive on acceptance</span>
            <span style={{ fontSize: 22, fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--green)" }}>
              ♦{OFFER.advance}
            </span>
          </div>
          <button
            onClick={onAccept}
            style={{
              width: "100%", height: 44, borderRadius: 6,
              border: "1px solid var(--green)", background: "#166534", color: "#fff",
              cursor: "pointer", fontSize: 13, fontWeight: 700,
              letterSpacing: ".03em", transition: "background .12s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#14532d"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#166534"; }}
          >
            Accept contract — receive ♦{OFFER.advance}
          </button>
          <div style={{ marginTop: 8, fontSize: 10, color: "var(--txt-2)", textAlign: "center" }}>
            Terms freeze at acceptance. Cannot be renegotiated.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewProjectPage({ phase, onSelectOffer, onAccept, onClose, isMobile }: NewProjectPageProps) {
  const offerIndex = 0;
  const offerTotal = 1;

  return (
    <div className="anim-fade" style={{ flex: 1, display: "flex", flexDirection: "column", background: "var(--bg-0)", minHeight: 0 }}>
      {/* Sub-header */}
      <div style={{
        height: 42, flexShrink: 0,
        background: "var(--bg-2)", borderBottom: "1px solid var(--border-0)",
        display: "flex", alignItems: "center", paddingLeft: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, paddingRight: 14, borderRight: "1px solid var(--border-0)", marginRight: 14 }}>
          <div className="sec-dot" />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".06em", color: "var(--txt-0)", textTransform: "uppercase" }}>
            {phase === "offer" ? "New Project" : "Contract Review"}
          </span>
        </div>

        <button disabled={offerIndex === 0} style={{
          width: 26, height: 26, borderRadius: 4,
          border: "1px solid var(--border-1)", background: "transparent",
          color: "var(--txt-2)", cursor: "not-allowed", fontSize: 13,
          display: "flex", alignItems: "center", justifyContent: "center", opacity: .35,
        }}>‹</button>

        <div style={{ padding: "0 12px", fontSize: 13, fontWeight: 600, color: "var(--txt-0)" }}>
          {OFFER.projectName}
          <span style={{ fontSize: 10, color: "var(--txt-2)", marginLeft: 8, fontFamily: "var(--font-mono)" }}>
            {offerIndex + 1} / {offerTotal}
          </span>
        </div>

        <button disabled={offerIndex >= offerTotal - 1} style={{
          width: 26, height: 26, borderRadius: 4,
          border: "1px solid var(--border-1)", background: "transparent",
          color: "var(--txt-2)", cursor: "not-allowed", fontSize: 13,
          display: "flex", alignItems: "center", justifyContent: "center", opacity: .35,
        }}>›</button>

        {phase === "contract" && (
          <button
            onClick={onSelectOffer}
            style={{
              marginLeft: 10, padding: "0 10px", height: 26, borderRadius: 4,
              border: "1px solid var(--border-1)", background: "transparent",
              color: "var(--txt-1)", cursor: "pointer", fontSize: 11,
              display: "flex", alignItems: "center", gap: 4, transition: "all .12s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-3)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >← Back</button>
        )}

        <div style={{ flex: 1 }} />

        <button
          onClick={onClose}
          style={{
            width: 42, height: "100%", border: "none",
            background: "transparent", color: "var(--txt-2)", cursor: "pointer", fontSize: 18,
            display: "flex", alignItems: "center", justifyContent: "center",
            borderLeft: "1px solid var(--border-0)", transition: "all .12s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-4)"; e.currentTarget.style.color = "var(--txt-0)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--txt-2)"; }}
        >×</button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minHeight: 0, overflow: isMobile ? "auto" : "hidden" }}>
        {phase === "offer"
          ? <OfferPage onReviewContract={onSelectOffer} isMobile={isMobile} />
          : <ContractPage onAccept={onAccept} onBack={onSelectOffer} isMobile={isMobile} />}
      </div>
    </div>
  );
}
