export function viteAuthOrigin(): string {
	return requiredViteOrigin("VITE_AUTH_URL");
}

export function viteAppOrigin(): string {
	return requiredViteOrigin("VITE_APP_ORIGIN");
}

function requiredViteOrigin(name: "VITE_AUTH_URL" | "VITE_APP_ORIGIN"): string {
	const fromImport = import.meta.env[name];
	if (typeof fromImport === "string" && fromImport.length > 0) {
		return fromImport;
	}
	const fromProcess = typeof process !== "undefined" ? process.env[name] : undefined;
	if (typeof fromProcess === "string" && fromProcess.length > 0) {
		return fromProcess;
	}
	throw new Error(`${name} is required`);
}
