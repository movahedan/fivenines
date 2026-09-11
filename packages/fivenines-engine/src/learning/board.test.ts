import { describe, expect, it } from "bun:test";

import { LEARNING_POLICY } from "../catalog/learning-policy";
import { researchById } from "../catalog/research-catalog";
import { LearningBoard } from "./board";

describe("LearningBoard - slots and tuition", () => {
	it("charges Monitoring 4000 cents for 168 hours and completes without a second month", () => {
		const board = new LearningBoard();
		const tuition = board.enroll({ kind: "research", technologyId: "monitoring" }, 0, 10_000);

		expect(tuition).toBe(4_000);
		expect(researchById("monitoring").durationHours).toBe(168);

		let cash = 10_000 - tuition;

		for (let hour = 0; hour < 168; hour += 1) {
			cash += board.tick(hour, cash);
		}

		expect(cash).toBe(6_000);
		expect(board.snapshot().completedTechnologyIds).toContain("monitoring");
		expect(board.snapshot().slotsUsed).toBe(0);
	});

	it("rejects a third concurrent enrollment", () => {
		const board = new LearningBoard();
		board.enroll({ kind: "research", technologyId: "monitoring" }, 0, 20_000);
		board.enroll({ kind: "research", technologyId: "email-delivery" }, 0, 20_000);

		expect(() =>
			board.enroll({ kind: "research", technologyId: "live-streaming" }, 0, 20_000),
		).toThrow("learning slots are full");
	});

	it("pauses on insufficient renewal cash and resumes with a fresh month", () => {
		const board = new LearningBoard();
		let cash = 80_000;

		for (const technologyId of ["background-workers", "job-scheduler", "batch-computing"]) {
			cash -= board.enroll({ kind: "research", technologyId }, 0, cash);
			const duration = researchById(technologyId).durationHours;

			for (let hour = 0; hour < duration; hour += 1) {
				cash += board.tick(hour, cash);
			}
		}

		cash -= board.enroll({ kind: "research", technologyId: "checkpointing" }, 0, cash);
		cash = 0;

		for (let hour = 0; hour < LEARNING_POLICY.monthHours; hour += 1) {
			cash += board.tick(hour, cash);
		}

		const paused = board
			.snapshot()
			.enrollments.find((enrollment) => enrollment.status === "paused");

		expect(paused?.pauseReason).toBe("insufficient-funds");
		expect(paused?.progressHours).toBe(LEARNING_POLICY.monthHours);

		const resumeTuition = board.resume(paused?.id ?? "", LEARNING_POLICY.monthHours, 40_000);

		expect(resumeTuition).toBe(32_000);
	});

	it("keeps progress on cancel and resumes inside paid coverage without a fee", () => {
		const board = new LearningBoard();
		board.enroll({ kind: "research", technologyId: "monitoring" }, 0, 10_000);
		board.tick(0, 10_000);
		const id = board.snapshot().enrollments[0]?.id ?? "";
		board.cancel(id);

		expect(board.resume(id, 10, 0)).toBe(0);
		expect(board.snapshot().enrollments[0]?.progressHours).toBe(1);
	});
});
