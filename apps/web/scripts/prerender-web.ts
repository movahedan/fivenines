/**
 * Post-build static prerender for marketing routes (run after `vite build`).
 * Usage: cd apps/web && WEB_PRERENDER=1 bun scripts/prerender-web.ts
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createMemoryHistory } from "@tanstack/history";
import { RouterServer } from "@tanstack/react-router/ssr/server";
import { attachRouterServerSsrUtils } from "@tanstack/router-core/ssr/server";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

import {
	prerenderPathToDistRelative,
	WEB_PRERENDER_PATHS,
	type WebPrerenderPath,
} from "../src/lib/web-prerender-paths";
import { getRouter } from "../src/router";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const distDir = join(scriptDir, "../dist/client");
const templatePath = join(distDir, "_shell.html");

type RouteMeta = Record<string, string | undefined> & {
	title?: string;
};

type HeadTag = {
	tag: "title" | "meta";
	attrs?: Record<string, string | undefined>;
	children?: string;
};

function buildHeadTagsFromMatches(metas: Array<Array<RouteMeta> | undefined>): HeadTag[] {
	const resultMeta: HeadTag[] = [];
	const metaByAttribute: Record<string, boolean> = {};
	let title: HeadTag | undefined;

	for (let i = metas.length - 1; i >= 0; i--) {
		const routeMetas = metas[i];
		if (!routeMetas) continue;
		for (let j = routeMetas.length - 1; j >= 0; j--) {
			const m = routeMetas[j];
			if (!m) continue;
			if (m.title) {
				if (!title) {
					title = { tag: "title", children: m.title };
				}
			} else {
				const attribute = m.name ?? m.property;
				if (attribute) {
					if (metaByAttribute[attribute]) continue;
					metaByAttribute[attribute] = true;
				}
				resultMeta.push({
					tag: "meta",
					attrs: { ...m },
				});
			}
		}
	}

	if (title) resultMeta.push(title);
	resultMeta.reverse();
	return resultMeta;
}

function escapeHtmlText(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function escapeHtmlAttr(value: string): string {
	return escapeHtmlText(value);
}

function headTagToHtml(tag: HeadTag): string {
	if (tag.tag === "title") {
		return `<title>${escapeHtmlText(tag.children ?? "")}</title>`;
	}
	const attrs = Object.entries(tag.attrs ?? {})
		.filter(([key, value]) => value !== undefined && key !== "title" && key !== "children")
		.map(([key, value]) => `${key}="${escapeHtmlAttr(String(value))}"`)
		.join(" ");
	return attrs.length > 0 ? `<meta ${attrs} />` : "";
}

function buildHeadHtmlFromMatches(metas: Array<Array<RouteMeta> | undefined>): string {
	return buildHeadTagsFromMatches(metas).map(headTagToHtml).filter(Boolean).join("\n\t\t");
}

function extractElementInner(html: string, id: string): string {
	const open = `<div id="${id}">`;
	const startToken = html.indexOf(open);
	if (startToken < 0) {
		throw new Error(`Missing #${id} in prerender output`);
	}
	let pos = startToken + open.length;
	let depth = 1;
	while (pos < html.length && depth > 0) {
		const nextOpen = html.indexOf("<div", pos);
		const nextClose = html.indexOf("</div>", pos);
		if (nextClose < 0) {
			throw new Error(`Unbalanced #${id} in prerender output`);
		}
		if (nextOpen >= 0 && nextOpen < nextClose) {
			depth += 1;
			pos = nextOpen + 4;
		} else {
			depth -= 1;
			if (depth === 0) {
				return html.slice(startToken + open.length, nextClose);
			}
			pos = nextClose + 6;
		}
	}
	throw new Error(`Unbalanced #${id} in prerender output`);
}

function replaceElementInner(html: string, id: string, inner: string): string {
	const open = `<div id="${id}">`;
	const startToken = html.indexOf(open);
	if (startToken < 0) {
		throw new Error(`Template is missing <div id="${id}">`);
	}
	const innerHtml = extractElementInner(html, id);
	const innerStart = startToken + open.length;
	const innerEnd = innerStart + innerHtml.length;
	return `${html.slice(0, innerStart)}${inner}${html.slice(innerEnd)}`;
}

function stripSeoTags(html: string): string {
	return html
		.replace(/<title>[^<]*<\/title>\s*/gi, "")
		.replace(/<meta\s+[^>]*name="description"[^>]*>\s*/gi, "")
		.replace(/<meta\s+[^>]*property="og:[^"]+"[^>]*>\s*/gi, "")
		.replace(/<meta\s+[^>]*name="twitter:card"[^>]*>\s*/gi, "");
}

function applyPrerenderToTemplate(template: string, headHtml: string, bodyHtml: string): string {
	let html = stripSeoTags(template);
	if (headHtml) {
		html = html.replace("</head>", `\t\t${headHtml}\n\t</head>`);
	}
	return replaceElementInner(html, "root", bodyHtml);
}

async function prerenderPath(
	template: string,
	path: WebPrerenderPath,
): Promise<{ warning?: string }> {
	const router = getRouter();
	attachRouterServerSsrUtils({ router, manifest: undefined });

	const history = createMemoryHistory({ initialEntries: [path] });
	router.update({ history, isServer: true });

	await router.load();

	const matches = router.state.matches;
	const isNotFound = matches.some((match) => match.status === "notFound");

	const metas = matches.map((match) => match.meta as Array<RouteMeta> | undefined);
	const headHtml = buildHeadHtmlFromMatches(metas);

	let rendered = "";
	try {
		rendered = renderToString(createElement(RouterServer, { router }));
	} finally {
		router.serverSsr?.setRenderFinished();
		router.serverSsr?.cleanup();
	}

	const bodyHtml = extractElementInner(rendered, "root");
	const html = applyPrerenderToTemplate(template, headHtml, bodyHtml);
	const outRelative = prerenderPathToDistRelative(path);
	const outPath = join(distDir, outRelative);

	mkdirSync(dirname(outPath), { recursive: true });
	writeFileSync(outPath, html, "utf8");

	if (isNotFound) {
		return {
			warning: `Route not implemented yet; wrote shell HTML for ${path}`,
		};
	}

	return {};
}

async function main(): Promise<void> {
	if (!process.env.WEB_PRERENDER) {
		console.warn("WEB_PRERENDER is not set; __root may duplicate head tags in #root.");
	}

	let template: string;
	try {
		template = readFileSync(templatePath, "utf8");
	} catch {
		console.error(`Missing ${templatePath}. Run vite build before prerender.`);
		process.exit(1);
	}

	for (const path of WEB_PRERENDER_PATHS) {
		const result = await prerenderPath(template, path);
		const outRelative = prerenderPathToDistRelative(path);
		console.log(`prerendered ${path} → dist/client/${outRelative}`);
		if (result.warning) {
			console.warn(result.warning);
		}
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
