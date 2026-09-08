import { describe, expect, it, mock } from "bun:test";

import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { hasScope, SCOPES } from "@packages/auth";

mock.module("@packages/http/react", () => ({
	FetcherSettingsProvider: ({ children }: { children: ReactNode }) => children,
}));

mock.module("@packages/http", () => ({
	defaultFetcherSettingsInput: { config: { baseRequestConfig: {} } },
}));

describe("PlayProviders", () => {
	it("renders children without restoring a session", async () => {
		const { PlayProviders } = await import("./play-providers");

		render(
			<PlayProviders
				authOrigin="http://auth.fivenines.com:3001"
				appOrigin="http://play.fivenines.com:3000"
			>
				<p>play tree</p>
			</PlayProviders>,
		);

		expect(screen.getByText("play tree")).toBeTruthy();
		expect(hasScope([SCOPES.admin], SCOPES.read)).toBe(true);
	});
});
