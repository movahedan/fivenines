export const TRAFFIC_POLICY = {
	timezoneHours: { min: -12, max: 14 },
	campaignWindowPermille: 1500,
	idlePermille: 1000,
	fatSpike: {
		durationHours: 48,
		permille: 2000,
		triggerPerThousandProne: 80,
		triggerPerThousand: 20,
	},
	weakSpike: {
		durationHours: 3,
		permille: 1250,
		triggerPerThousand: 150,
	},
	jitter: { minPermille: 850, span: 300 },
	rhythm: {
		shopping: [
			{ startHour: 0, endHour: 7, permille: 400 },
			{ startHour: 8, endHour: 11, permille: 700 },
			{ startHour: 12, endHour: 13, permille: 900 },
			{ startHour: 14, endHour: 16, permille: 900 },
			{ startHour: 17, endHour: 22, permille: 1400 },
			{ startHour: 23, endHour: 23, permille: 800 },
		],
		saas: [
			{ startHour: 0, endHour: 7, permille: 200 },
			{ startHour: 8, endHour: 11, permille: 1100 },
			{ startHour: 12, endHour: 13, permille: 800 },
			{ startHour: 14, endHour: 16, permille: 1200 },
			{ startHour: 17, endHour: 22, permille: 400 },
			{ startHour: 23, endHour: 23, permille: 300 },
		],
		portfolio: [
			{ startHour: 0, endHour: 7, permille: 500 },
			{ startHour: 8, endHour: 11, permille: 600 },
			{ startHour: 12, endHour: 13, permille: 600 },
			{ startHour: 14, endHour: 16, permille: 700 },
			{ startHour: 17, endHour: 22, permille: 500 },
			{ startHour: 23, endHour: 23, permille: 500 },
		],
	},
} as const;

export type TrafficHourBand =
	| (typeof TRAFFIC_POLICY.rhythm.shopping)[number]
	| (typeof TRAFFIC_POLICY.rhythm.saas)[number]
	| (typeof TRAFFIC_POLICY.rhythm.portfolio)[number];
