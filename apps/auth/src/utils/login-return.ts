import { authConfig } from "../config";
import { safeNextPath } from "./safe-next-path";
import { safeRedirectUri } from "./safe-redirect-uri";

export type LoginReturn =
	| { readonly kind: "relative"; readonly path: string }
	| { readonly kind: "external"; readonly redirectUri: string; readonly state: string };

export type LoginReturnForm = {
	readonly redirectUri?: string;
	readonly state?: string;
	readonly next?: string;
};

export function loginReturnFromRequest(
	req: Request,
	form?: LoginReturnForm,
	allowedOrigins: readonly string[] = authConfig.redirectOrigins,
): LoginReturn {
	const url = new URL(req.url);
	const redirectRaw = nonempty(form?.redirectUri) ?? url.searchParams.get("redirect_uri");
	const external = safeRedirectUri(redirectRaw, allowedOrigins);
	if (external) {
		const state = safeNextPath(nonempty(form?.state) ?? url.searchParams.get("state"), "/");
		return { kind: "external", redirectUri: external, state };
	}

	return {
		kind: "relative",
		path: safeNextPath(nonempty(form?.next) ?? url.searchParams.get("next")),
	};
}

export function loginReturnFieldProps(ret: LoginReturn): LoginReturnForm {
	if (ret.kind === "external") {
		return { redirectUri: ret.redirectUri, state: ret.state };
	}
	return { next: ret.path };
}

export function loginReturnLocation(ret: LoginReturn): string {
	if (ret.kind === "external") {
		return ret.redirectUri;
	}
	return ret.path;
}

export function logoutReturnLocation(
	req: Request,
	allowedOrigins: readonly string[] = authConfig.redirectOrigins,
): string | null {
	const url = new URL(req.url);
	const external = safeRedirectUri(url.searchParams.get("redirect_uri"), allowedOrigins);
	if (external) {
		return external;
	}

	const nextRaw = url.searchParams.get("next");
	if (nextRaw != null && nextRaw.length > 0) {
		return safeNextPath(nextRaw);
	}

	return null;
}

function nonempty(value: string | undefined): string | undefined {
	if (value === undefined || value.length === 0) {
		return undefined;
	}
	return value;
}
