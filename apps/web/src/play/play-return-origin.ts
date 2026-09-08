export function playReturnOrigin(
	authOrigin: string,
	configuredAppOrigin: string,
	pageOrigin: string | undefined,
): string {
	if (pageOrigin !== undefined && pageOrigin.length > 0 && pageOrigin !== authOrigin) {
		return pageOrigin;
	}
	return configuredAppOrigin;
}
