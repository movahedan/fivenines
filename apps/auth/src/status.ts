export function processStatusBody(): { readonly ok: true; readonly timestamp: string } {
	return { ok: true, timestamp: new Date().toISOString() };
}

export function handleStatus(): Response {
	return Response.json(processStatusBody());
}
