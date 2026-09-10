import { OFFER } from "./scenario";

interface OfferDrawerProps {
  phase: "offer-list" | "contract-review";
  onSelectOffer: () => void;
  onBack: () => void;
  onAccept: () => void;
  onClose: () => void;
  cash: number;
}

export default function OfferDrawer({ phase, onSelectOffer, onBack, onAccept, onClose, cash }: OfferDrawerProps) {
  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer" style={{ maxHeight: "88vh" }}>
        <div className="drawer-handle" />

        {/* Header */}
        <div
          style={{
            padding: "12px 16px 10px",
            borderBottom: "1px solid var(--navy-600)",
            display: "flex", alignItems: "center", gap: 10,
            flexShrink: 0,
          }}
        >
          {phase === "contract-review" && (
            <button
              onClick={onBack}
              style={{
                width: 28, height: 28, borderRadius: 6,
                border: "1px solid var(--navy-500)",
                background: "transparent",
                color: "var(--text-secondary)",
                cursor: "pointer", fontSize: 14,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              ‹
            </button>
          )}
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
              {phase === "offer-list" ? "Available projects" : "Contract review"}
            </div>
            {phase === "offer-list" && (
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>
                1 offer available · expires in {OFFER.expiresIn}
              </div>
            )}
            {phase === "contract-review" && (
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>
                Review all terms before accepting
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              marginLeft: "auto",
              width: 28, height: 28, borderRadius: 6,
              border: "1px solid var(--navy-500)",
              background: "transparent",
              color: "var(--text-muted)",
              cursor: "pointer", fontSize: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>

        <div className="drawer-body" style={{ padding: "12px 16px 24px" }}>
          {phase === "offer-list" ? (
            <OfferList onSelect={onSelectOffer} />
          ) : (
            <ContractReview onAccept={onAccept} cash={cash} />
          )}
        </div>
      </div>
    </>
  );
}

function OfferList({ onSelect }: { onSelect: () => void }) {
  return (
    <div>
      <button
        onClick={onSelect}
        style={{
          width: "100%",
          background: "var(--navy-750)",
          border: "1px solid var(--navy-500)",
          borderRadius: 10,
          padding: "14px 16px",
          cursor: "pointer",
          display: "flex",
          gap: 14,
          alignItems: "flex-start",
          textAlign: "left",
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--navy-300)";
          e.currentTarget.style.background = "var(--navy-700)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--navy-500)";
          e.currentTarget.style.background = "var(--navy-750)";
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: 40, height: 40, borderRadius: 8, flexShrink: 0,
            background: "var(--navy-600)",
            border: "1px solid var(--navy-400)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 700, color: "var(--text-secondary)",
          }}
        >
          {OFFER.customerInitials}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
              {OFFER.projectName}
            </span>
            <span
              style={{
                fontSize: 10, padding: "2px 7px", borderRadius: 20,
                background: "var(--navy-600)", color: "var(--text-secondary)",
                fontWeight: 500,
              }}
            >
              {OFFER.customerRelation}
            </span>
          </div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 3 }}>
            {OFFER.customer} · {OFFER.projectType}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6, lineHeight: 1.5 }}>
            {OFFER.description}
          </div>

          <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap" }}>
            <Stat label="Advance" value={`♦${OFFER.advance}`} highlight />
            <Stat label="Weekly fee" value={`♦${OFFER.weeklyFee}`} highlight />
            <Stat label="SLA" value={`${OFFER.sla}%`} />
            <Stat label="Setup" value={`${OFFER.setupAllowanceHours}h`} />
          </div>

          <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
            {OFFER.requiredTechnologies.map((t) => (
              <span
                key={t}
                style={{
                  fontSize: 10, padding: "2px 8px", borderRadius: 20,
                  background: "var(--green-surface)",
                  border: "1px solid var(--green-dim)",
                  color: "var(--green-main)",
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        <div style={{ color: "var(--text-muted)", fontSize: 16, flexShrink: 0 }}>›</div>
      </button>

      <div style={{ marginTop: 10, fontSize: 11, color: "var(--text-muted)", textAlign: "center" }}>
        Selecting an offer opens its full contract for review. No action is taken until you accept.
      </div>
    </div>
  );
}

function ContractReview({ onAccept, cash }: { onAccept: () => void; cash: number }) {
  const canAfford = cash >= 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Customer */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
        <div
          style={{
            width: 44, height: 44, borderRadius: 10, flexShrink: 0,
            background: "var(--navy-600)",
            border: "1px solid var(--navy-400)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 700, color: "var(--text-secondary)",
          }}
        >
          MC
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
            {OFFER.projectName}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
            {OFFER.customer} · {OFFER.customerRelation}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
            <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Trust</span>
            <TrustBar value={OFFER.customerTrust} />
          </div>
        </div>
      </div>

      <Section label="Project">
        <Row label="Type" value={OFFER.projectType} />
        <Row label="Demand" value={`~${OFFER.demandPerHour} requests/hour`} mono />
        <Row label="Traffic pattern" value={OFFER.rhythmProfile} />
        <Row label="Demand mix" value={OFFER.rootMix} />
        <Row label="Required technologies" value={OFFER.requiredTechnologies.join(", ")} />
      </Section>

      <Section label="Payment terms">
        <Row label="Advance payment (on acceptance)" value={`♦${OFFER.advance}`} highlight bold />
        <Row label="Weekly fixed fee" value={`♦${OFFER.weeklyFee}`} highlight bold />
        <Row label="Usage fee" value="None (fixed-fee contract)" />
      </Section>

      <Section label="Service obligations">
        <Row label="Availability target (SLA)" value={`${OFFER.sla}% of requests`} bold />
        <Row label="Measurement period" value="Per 168-hour billing week" />
        <Row label="Setup allowance" value={`${OFFER.setupAllowanceHours} hours from acceptance`} bold />
        <Row label="Demand" value={`${OFFER.demandPerHour} requests/hour (office hours profile)`} />
      </Section>

      <Section label="Refund schedule — if missed SLA">
        {OFFER.refundBands.map((b) => (
          <Row key={b.label} label={b.label} value={`${b.pct}% of fixed fee refunded`} />
        ))}
        <Row label="Complete failure (all demand missed)" value="100% refund of fixed fee" bold />
      </Section>

      <Section label="Setup and cancellation">
        <div
          style={{
            fontSize: 12,
            color: "var(--text-secondary)",
            lineHeight: 1.6,
            padding: "8px 0",
          }}
        >
          <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
            If setup is not complete within {OFFER.setupAllowanceHours} hours of acceptance:
          </span>{" "}
          {OFFER.cancellationTerms}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, lineHeight: 1.5 }}>
          Service activation follows preparation. Accepting this contract does not start live service immediately.
          The advance is received on acceptance.
        </div>
      </Section>

      {/* Action bar */}
      <div
        style={{
          marginTop: 20,
          padding: "14px 0 0",
          borderTop: "1px solid var(--navy-600)",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <div
          style={{
            background: "var(--navy-700)",
            borderRadius: 8,
            padding: "10px 14px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>On acceptance you receive</span>
          <span style={{ fontSize: 18, fontWeight: 700, color: "var(--green-main)", fontFamily: "var(--font-mono)" }}>
            ♦{OFFER.advance}
          </span>
        </div>

        <button
          onClick={onAccept}
          disabled={!canAfford}
          style={{
            height: 48,
            borderRadius: 10,
            border: "none",
            background: "var(--green-muted)",
            color: "#fff",
            cursor: "pointer",
            fontSize: 15,
            fontWeight: 700,
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--green-dim)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--green-muted)"; }}
        >
          Accept contract — receive ♦{OFFER.advance} advance
        </button>
        <div style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center" }}>
          Contract terms are frozen at acceptance. Demand and pricing cannot be renegotiated.
        </div>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: "var(--text-muted)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: 8,
          paddingBottom: 6,
          borderBottom: "1px solid var(--navy-700)",
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function Row({
  label, value, mono, highlight, bold,
}: {
  label: string; value: string; mono?: boolean; highlight?: boolean; bold?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 12,
        padding: "5px 0",
        fontSize: 12,
        borderBottom: "1px solid rgba(26,50,85,0.4)",
      }}
    >
      <span style={{ color: "var(--text-secondary)", flexShrink: 0 }}>{label}</span>
      <span
        style={{
          color: highlight ? "var(--text-primary)" : "var(--text-secondary)",
          fontWeight: bold ? 700 : 400,
          fontFamily: mono ? "var(--font-mono)" : undefined,
          textAlign: "right",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{label}</div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: highlight ? "var(--green-main)" : "var(--text-primary)",
          fontFamily: "var(--font-mono)",
          marginTop: 1,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function TrustBar({ value }: { value: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 60, height: 4, borderRadius: 2, background: "var(--navy-500)", overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${value}%`,
            background: value > 60 ? "var(--green-muted)" : value > 40 ? "var(--amber-main)" : "var(--red-main)",
            borderRadius: 2,
          }}
        />
      </div>
      <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{value}</span>
    </div>
  );
}
