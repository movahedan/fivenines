export const CAPACITY_POLICY = {
	inflightPerThousandRequests: 10,
	categories: {
		shopping: { cpuPerRequest: 1, bytesPerRequest: 40, memPerInflight: 2 },
		saas: { cpuPerRequest: 1, bytesPerRequest: 10, memPerInflight: 4 },
		portfolio: { cpuPerRequest: 1, bytesPerRequest: 20, memPerInflight: 1 },
	},
} as const;
