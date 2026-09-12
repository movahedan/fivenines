import { describe, expect, it } from "bun:test";

import { LearningBoard } from "./board";
import { learningCatalog, learningSlotLabel } from "./catalog-view";

describe("learningCatalog - projections", () => {
	it("marks Monitoring available and Health Checks locked on a fresh board", () => {
		const rows = learningCatalog(new LearningBoard().snapshot(), 25_000);
		const monitoring = rows.find((row) => row.id === "monitoring");
		const health = rows.find((row) => row.id === "health-checks");

		expect(monitoring?.status).toBe("available");
		expect(health?.status).toBe("locked");
		expect(rows.find((row) => row.id === "application-runtime")?.status).toBe("completed");
		expect(learningSlotLabel(new LearningBoard().snapshot())).toBe("0/2");
	});

	it("separates completed course levels from the next enrollable level", () => {
		const board = new LearningBoard();
		board.enroll({ kind: "course", courseId: "system-administration", level: 1 }, 0, 25_000);

		const rows = learningCatalog(board.snapshot(), 25_000);
		const admin = rows.find((row) => row.id === "system-administration-1");

		expect(admin?.status).toBe("active");
		expect(admin?.note).toContain("Completed levels: 0/5");
	});
});
