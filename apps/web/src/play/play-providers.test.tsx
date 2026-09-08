import { describe, expect, it, mock } from "bun:test";

import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { hasScope, SCOPES } from "@packages/auth";

import { playerAuthSession } from "../player-session";

mock.module("@packages/http/react", () => ({
	FetcherSettingsProvider: ({ children }: { children: ReactNode }) => children,
}));

mock.module("@packages/http", () => ({
	defaultFetcherSettingsInput: { config: { baseRequestConfig: {} } },
}));

process.env.VITE_AUTH_URL ??= "http://auth.fivenines.com:3001";
process.env.VITE_APP_ORIGIN ??= "http://play.fivenines.com:3000";

const { PlayProviders } = await import("./play-providers");

describe("PlayProviders", () => {
	it("renders children without restoring a session", () => {
		const restore = mock(() => Promise.resolve(true));
		playerAuthSession.restore = restore;

		render(
			<PlayProviders>
				<p>play tree</p>
			</PlayProviders>,
		);

		expect(screen.getByText("play tree")).toBeTruthy();
		expect(restore).not.toHaveBeenCalled();
		expect(hasScope([SCOPES.admin], SCOPES.read)).toBe(true);
	});
});
