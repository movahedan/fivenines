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

export function loginReturnFromRequest(req: Request, form?: LoginReturnForm): LoginReturn {
	const url = new URL(req.url);
	const redirectRaw = nonempty(form?.redirectUri) ?? url.searchParams.get("redirect_uri");
	const external = safeRedirectUri(redirectRaw, authConfig.redirectOrigins);
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

function nonempty(value: string | undefined): string | undefined {
	if (value === undefined || value.length === 0) {
		return undefined;
	}
	return value;
}
