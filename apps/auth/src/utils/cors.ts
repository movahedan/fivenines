function originAllowed(origin: string | null, allowedOrigins: readonly string[]): origin is string {
	return origin !== null && allowedOrigins.includes(origin);
}

export function corsPreflight(req: Request, allowedOrigins: readonly string[]): Response {
	const origin = req.headers.get("origin");
	if (!originAllowed(origin, allowedOrigins)) {
		return new Response(null, { status: 204 });
	}

	return new Response(null, {
		status: 204,
		headers: {
			"Access-Control-Allow-Origin": origin,
			"Access-Control-Allow-Credentials": "true",
			"Access-Control-Allow-Headers": "content-type, authorization",
			"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
			"Access-Control-Max-Age": "600",
			Vary: "Origin",
		},
	});
}

export function withCors(req: Request, res: Response, allowedOrigins: readonly string[]): Response {
	const origin = req.headers.get("origin");
	if (!originAllowed(origin, allowedOrigins)) {
		return res;
	}

	const headers = new Headers(res.headers);
	headers.set("Access-Control-Allow-Origin", origin);
	headers.set("Access-Control-Allow-Credentials", "true");
	headers.set("Access-Control-Allow-Headers", "content-type, authorization");
	headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
	headers.set("Vary", "Origin");
	return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}
