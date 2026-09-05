export async function postAuthRefresh(signal?: AbortSignal): Promise<boolean> {
	const response = await fetch(`${import.meta.env.VITE_AUTH_URL}/api/refresh`, {
		method: "POST",
		credentials: "include",
		signal,
	});
	return response.ok;
}
