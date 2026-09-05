import { getAuthOrigin } from "@packages/utils/origins";

export async function postAuthRefresh(signal?: AbortSignal): Promise<boolean> {
	const origin = getAuthOrigin(import.meta.env.VITE_AUTH_URL);
	const response = await fetch(`${origin}/api/refresh`, {
		method: "POST",
		credentials: "include",
		signal,
	});
	return response.ok;
}
