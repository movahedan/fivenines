import { useState } from "react";
import { TECHNOLOGIES, COURSES } from "./scenario";

type LTab = "technologies" | "courses";

const FAMILY_COLOR: Record<string, string> = {
  Application:   "var(--sky)",
  Database:      "var(--amber)",
  Observability: "var(--green)",
  Routing:       "var(--txt-m)",
  Reliability:   "var(--red)",
  Data:          "var(--amber-hi)",
};

const FAMILY_LETTER: Record<string, string> = {
  Application:   "A",
  Database:      "D",
  Observability: "O",
  Routing:       "R",
  Reliability:   "★",
  Data:          "∂",
};

const COURSE_COLOR = ["var(--sky)", "var(--green)", "var(--amber)", "var(--txt-m)", "var(--red)"];

function FamilyIcon({ family, size = 30 }: { family: string; size?: number }) {
  const color = FAMILY_COLOR[family] ?? "var(--txt-2)";
  const letter = FAMILY_LETTER[family] ?? "?";
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%",
        background: color + "18",
        border: `1.5px solid ${color}55`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, color,
        fontSize: size * 0.36, fontWeight: 800,
        fontFamily: "var(--font-mono)",
      }}
    >
      {letter}
    </div>
  );
}

function CourseIcon({ id, size = 30 }: { id: string; size?: number }) {
  const idx = COURSES.findIndex((c) => c.id === id) % COURSE_COLOR.length;
  const color = COURSE_COLOR[idx];
  const letter = id.slice(0, 2).toUpperCase();
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%",
        background: color + "18",
        border: `1.5px solid ${color}55`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, color,
        fontSize: size * 0.28, fontWeight: 800,
        fontFamily: "var(--font-mono)",
        letterSpacing: "-.02em",
      }}
    >
      {letter}
    </div>
  );
}

/* ─── Detail views ─────────────────────────────────────────────── */
function TechDetail({ tech, onClose }: { tech: typeof TECHNOLOGIES[number]; onClose: () => void }) {
  const color = FAMILY_COLOR[tech.family] ?? "var(--txt-2)";
  const statusColor =
    tech.status === "unlocked" ? "var(--green)"
    : tech.status === "available" ? "var(--sky)"
    : "var(--txt-2)";

  return (
    <div className="anim-fade" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      {/* Detail header */}
      <div
        style={{
          padding: "10px 12px",
          borderBottom: "1px solid var(--border-0)",
          display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
        }}
      >
        <FamilyIcon family={tech.family} size={26} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--txt-0)" }}>{tech.name}</div>
          <div style={{ fontSize: 9, color: "var(--txt-2)", marginTop: 1 }}>{tech.family}</div>
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
        {/* Status */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 9, color: "var(--txt-2)", fontWeight: 700, letterSpacing: ".06em", marginBottom: 4 }}>STATUS</div>
          <div
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "3px 8px", borderRadius: 4,
              border: `1px solid ${statusColor}40`,
              background: statusColor + "12",
              fontSize: 10, fontWeight: 700, color: statusColor,
            }}
          >
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: statusColor }} />
            {tech.status.toUpperCase()}
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 9, color: "var(--txt-2)", fontWeight: 700, letterSpacing: ".06em", marginBottom: 6 }}>DESCRIPTION</div>
          <div style={{ fontSize: 11, color: "var(--txt-1)", lineHeight: 1.6 }}>{tech.description}</div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
          {"researchHours" in tech && (
            <div style={{ padding: "8px 10px", borderRadius: 5, background: "var(--bg-3)", border: "1px solid var(--border-0)" }}>
              <div style={{ fontSize: 9, color: "var(--txt-2)", fontWeight: 700, letterSpacing: ".05em", marginBottom: 3 }}>RESEARCH</div>
              <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--sky)" }}>
                {(tech as any).researchHours}h
              </div>
            </div>
          )}
          <div style={{ padding: "8px 10px", borderRadius: 5, background: "var(--bg-3)", border: "1px solid var(--border-0)" }}>
            <div style={{ fontSize: 9, color: "var(--txt-2)", fontWeight: 700, letterSpacing: ".05em", marginBottom: 3 }}>INSTALL</div>
            <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--txt-0)" }}>
              {tech.installHours}h
            </div>
          </div>
          {"monthlyCost" in tech && (
            <div style={{ padding: "8px 10px", borderRadius: 5, background: "var(--bg-3)", border: "1px solid var(--border-0)" }}>
              <div style={{ fontSize: 9, color: "var(--txt-2)", fontWeight: 700, letterSpacing: ".05em", marginBottom: 3 }}>MONTHLY</div>
              <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--amber)" }}>
                ♦{(tech as any).monthlyCost}
              </div>
            </div>
          )}
        </div>

        {/* Prereqs */}
        {tech.prereqs.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 9, color: "var(--txt-2)", fontWeight: 700, letterSpacing: ".06em", marginBottom: 6 }}>REQUIRES</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {tech.prereqs.map((p) => (
                <span
                  key={p}
                  style={{
                    fontSize: 10, padding: "2px 7px", borderRadius: 3,
                    border: "1px solid var(--border-1)",
                    background: "var(--bg-3)",
                    color: "var(--txt-1)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}

        {tech.status === "available" && (
          <button
            style={{
              width: "100%", height: 32, borderRadius: 5,
              border: "1px solid var(--sky)",
              background: "var(--sky)18",
              color: "var(--sky)", cursor: "pointer",
              fontSize: 11, fontWeight: 700, letterSpacing: ".06em",
              textTransform: "uppercase",
              transition: "background .12s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--sky)30"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--sky)18"; }}
          >
            Start research
          </button>
        )}
      </div>
    </div>
  );
}

function CourseDetail({ course, onClose }: { course: typeof COURSES[number]; onClose: () => void }) {
  const idx = COURSES.findIndex((c) => c.id === course.id) % COURSE_COLOR.length;
  const color = COURSE_COLOR[idx];

  return (
    <div className="anim-fade" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <div
        style={{
          padding: "10px 12px",
          borderBottom: "1px solid var(--border-0)",
          display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
        }}
      >
        <CourseIcon id={course.id} size={26} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--txt-0)" }}>{course.name}</div>
          <div style={{ fontSize: 9, color: "var(--txt-2)", marginTop: 1 }}>Level {course.currentLevel} / {course.maxLevel}</div>
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
        {/* Level pips */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 9, color: "var(--txt-2)", fontWeight: 700, letterSpacing: ".06em", marginBottom: 6 }}>LEVEL PROGRESS</div>
          <div style={{ display: "flex", gap: 4 }}>
            {Array.from({ length: course.maxLevel }).map((_, i) => (
              <div
                key={i}
                style={{
                  flex: 1, height: 6, borderRadius: 3,
                  background: i < course.currentLevel ? color : "var(--border-0)",
                  boxShadow: i < course.currentLevel ? `0 0 4px ${color}80` : "none",
                  transition: "background .2s",
                }}
              />
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 9, color: "var(--txt-2)", fontWeight: 700, letterSpacing: ".06em", marginBottom: 6 }}>EFFECT</div>
          <div style={{ fontSize: 11, color: "var(--txt-1)", lineHeight: 1.6 }}>{course.effect}</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
          <div style={{ padding: "8px 10px", borderRadius: 5, background: "var(--bg-3)", border: "1px solid var(--border-0)" }}>
            <div style={{ fontSize: 9, color: "var(--txt-2)", fontWeight: 700, letterSpacing: ".05em", marginBottom: 3 }}>TUITION</div>
            <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--amber)" }}>
              ♦{course.nextTuition}/mo
            </div>
          </div>
          <div style={{ padding: "8px 10px", borderRadius: 5, background: "var(--bg-3)", border: "1px solid var(--border-0)" }}>
            <div style={{ fontSize: 9, color: "var(--txt-2)", fontWeight: 700, letterSpacing: ".05em", marginBottom: 3 }}>DURATION</div>
            <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--txt-0)" }}>
              {course.nextDurationWeeks}w
            </div>
          </div>
        </div>

        <button
          style={{
            width: "100%", height: 32, borderRadius: 5,
            border: `1px solid ${color}`,
            background: color + "18",
            color, cursor: "pointer",
            fontSize: 11, fontWeight: 700, letterSpacing: ".06em",
            textTransform: "uppercase",
            transition: "background .12s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = color + "30"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = color + "18"; }}
        >
          Enroll — ♦{course.nextTuition}/mo
        </button>
      </div>
    </div>
  );
}

/* ─── Row items ─────────────────────────────────────────────────── */
function TechRow({
  tech, active, onClick,
}: {
  tech: typeof TECHNOLOGIES[number];
  active: boolean;
  onClick: () => void;
}) {
  const color = FAMILY_COLOR[tech.family] ?? "var(--txt-2)";
  const statusColor =
    tech.status === "unlocked" ? "var(--green)"
    : tech.status === "available" ? "var(--sky)"
    : "var(--border-2)";

  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", display: "flex", gap: 10, alignItems: "center",
        padding: "9px 12px",
        border: "none",
        borderBottom: "1px solid var(--border-0)",
        background: active ? "var(--bg-3)" : "transparent",
        cursor: "pointer",
        textAlign: "left",
        transition: "background .1s",
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--bg-2)"; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      <FamilyIcon family={tech.family} size={28} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--txt-0)", lineHeight: 1.3 }}>{tech.name}</div>
        <div style={{ fontSize: 9, color: "var(--txt-2)", marginTop: 1 }}>{tech.family}</div>
      </div>
      {"researchHours" in tech ? (
        <div
          style={{
            fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 700,
            color, padding: "2px 6px", borderRadius: 3,
            background: color + "18", border: `1px solid ${color}40`,
            flexShrink: 0,
          }}
        >
          {(tech as any).researchHours}h
        </div>
      ) : (
        <div
          style={{
            width: 7, height: 7, borderRadius: "50%",
            background: statusColor,
            boxShadow: tech.status === "unlocked" ? `0 0 4px ${statusColor}` : "none",
            flexShrink: 0,
          }}
        />
      )}
    </button>
  );
}

function CourseRow({
  course, active, onClick,
}: {
  course: typeof COURSES[number];
  active: boolean;
  onClick: () => void;
}) {
  const idx = COURSES.findIndex((c) => c.id === course.id) % COURSE_COLOR.length;
  const color = COURSE_COLOR[idx];

  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", display: "flex", gap: 10, alignItems: "center",
        padding: "9px 12px",
        border: "none",
        borderBottom: "1px solid var(--border-0)",
        background: active ? "var(--bg-3)" : "transparent",
        cursor: "pointer",
        textAlign: "left",
        transition: "background .1s",
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--bg-2)"; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      <CourseIcon id={course.id} size={28} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--txt-0)", lineHeight: 1.3 }}>{course.name}</div>
        <div
          style={{ display: "flex", gap: 3, marginTop: 4 }}
        >
          {Array.from({ length: course.maxLevel }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 14, height: 3, borderRadius: 2,
                background: i < course.currentLevel ? color : "var(--border-1)",
              }}
            />
          ))}
        </div>
      </div>
      <div
        style={{
          fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 700,
          color, padding: "2px 6px", borderRadius: 3,
          background: color + "18", border: `1px solid ${color}40`,
          flexShrink: 0,
        }}
      >
        L{course.currentLevel}
      </div>
    </button>
  );
}

/* ─── Main ──────────────────────────────────────────────────────── */
export default function LearningView() {
  const [tab, setTab] = useState<LTab>("technologies");
  const [selectedTech, setSelectedTech] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  const tech = selectedTech ? TECHNOLOGIES.find((t) => t.id === selectedTech) : null;
  const course = selectedCourse ? COURSES.find((c) => c.id === selectedCourse) : null;

  // If a detail is open, show it
  if (tech) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <TechDetail tech={tech} onClose={() => setSelectedTech(null)} />
      </div>
    );
  }
  if (course) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <CourseDetail course={course} onClose={() => setSelectedCourse(null)} />
      </div>
    );
  }

  const ongoing = COURSES.find((c) => c.currentLevel > 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Ongoing banner */}
      {ongoing ? (
        <div
          style={{
            padding: "8px 12px",
            borderBottom: "1px solid var(--border-0)",
            background: "var(--bg-3)",
            flexShrink: 0,
          }}
        >
          <div style={{ fontSize: 9, color: "var(--txt-2)", fontWeight: 700, letterSpacing: ".07em", marginBottom: 6 }}>
            ONGOING
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CourseIcon id={ongoing.id} size={24} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--txt-0)" }}>{ongoing.name}</div>
              <div style={{ fontSize: 9, color: "var(--txt-2)", marginTop: 1 }}>Level {ongoing.currentLevel}</div>
            </div>
            <div className="lamp lamp-a pulse" />
          </div>
        </div>
      ) : (
        <div
          style={{
            padding: "8px 12px",
            borderBottom: "1px solid var(--border-0)",
            flexShrink: 0,
          }}
        >
          <div style={{ fontSize: 9, color: "var(--txt-2)", fontWeight: 700, letterSpacing: ".07em", marginBottom: 4 }}>ONGOING</div>
          <div style={{ fontSize: 10, color: "var(--txt-2)", fontStyle: "italic" }}>No active study</div>
        </div>
      )}

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--border-0)",
          flexShrink: 0,
        }}
      >
        {(["technologies", "courses"] as LTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1, height: 32,
              border: "none",
              borderBottom: tab === t ? "2px solid var(--green)" : "2px solid transparent",
              borderRight: t === "technologies" ? "1px solid var(--border-0)" : "none",
              background: tab === t ? "var(--bg-3)" : "transparent",
              color: tab === t ? "var(--txt-0)" : "var(--txt-2)",
              cursor: "pointer",
              fontSize: 9, fontWeight: 700, letterSpacing: ".07em",
              textTransform: "uppercase",
              transition: "all .12s",
            }}
          >
            {t === "technologies" ? "Technologies" : "Courses"}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="panel-body">
        {tab === "technologies" && TECHNOLOGIES.map((tech) => (
          <TechRow
            key={tech.id}
            tech={tech}
            active={selectedTech === tech.id}
            onClick={() => setSelectedTech(tech.id)}
          />
        ))}
        {tab === "courses" && COURSES.map((course) => (
          <CourseRow
            key={course.id}
            course={course}
            active={selectedCourse === course.id}
            onClick={() => setSelectedCourse(course.id)}
          />
        ))}
      </div>
    </div>
  );
}
