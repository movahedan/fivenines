import type { RequestMethod, RequestOptions } from "./base-fetch";

function stringifyHeaderValue(value: string | readonly string[]): string {
	return typeof value === "string" ? value : value.join(", ");
}

export function headersInitToRecord(headers?: RequestInit["headers"]): Record<string, string> {
	if (headers === undefined) {
		return {};
	}

	if (headers instanceof Headers) {
		const out: Record<string, string> = {};
		headers.forEach((value, key) => {
			out[key] = value;
		});
		return out;
	}

	if (Array.isArray(headers)) {
		const out: Record<string, string> = {};
		for (const entry of headers) {
			out[entry[0]] = stringifyHeaderValue(entry[1]);
		}
		return out;
	}

	const out: Record<string, string> = {};
	for (const [key, value] of Object.entries(headers)) {
		out[key] = stringifyHeaderValue(value as string | readonly string[]);
	}
	return out;
}

function resolveMethod(method: string | undefined): RequestMethod {
	const resolvedMethod = (method ?? "GET").toUpperCase();
	if (
		resolvedMethod === "POST" ||
		resolvedMethod === "PUT" ||
		resolvedMethod === "PATCH" ||
		resolvedMethod === "DELETE" ||
		resolvedMethod === "OPTIONS" ||
		resolvedMethod === "HEAD"
	) {
		return resolvedMethod;
	}
	return "GET";
}

function bodyToData(body: RequestInit["body"]): unknown {
	if (body == null) {
		return undefined;
	}
	if (typeof body === "string") {
		try {
			return JSON.parse(body);
		} catch {
			return body;
		}
	}
	return body;
}

export function requestInitToOptions(url: string, init?: RequestInit): RequestOptions {
	const headers = headersInitToRecord(init?.headers);
	const data = bodyToData(init?.body);
	const credentials = init?.credentials;

	return {
		url,
		method: resolveMethod(init?.method),
		...(Object.keys(headers).length > 0 ? { headers } : {}),
		...(data !== undefined ? { data } : {}),
		...(init?.signal ? { signal: init.signal } : {}),
		...(credentials === "omit" || credentials === "same-origin" || credentials === "include"
			? { credentials }
			: {}),
	};
}
