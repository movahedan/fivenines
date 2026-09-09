import { getAnalyticsConfig } from "./configure";

let gtmInitialized = false;

function buildGtmScript(token: string): string {
	return `
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','GTM-${token}');
    `;
}

export function setupTagManager(): void {
	if (gtmInitialized) {
		return;
	}

	const env = getAnalyticsConfig();
	const gtmContainerId = env.gtmContainerId;
	const doc = globalThis.document;
	if (env.isDevelopment || !gtmContainerId || typeof doc === "undefined") {
		return;
	}

	gtmInitialized = true;

	const scriptElement = doc.createElement("script");
	scriptElement.id = "_gtm_script_tag";
	scriptElement.type = "text/javascript";
	scriptElement.innerHTML = buildGtmScript(gtmContainerId);
	doc.head.appendChild(scriptElement);

	if (!doc.body || process.env.NODE_ENV === "test") {
		return;
	}

	const noscript = doc.createElement("noscript");
	const iframe = doc.createElement("iframe");
	iframe.src = `https://www.googletagmanager.com/ns.html?id=GTM-${gtmContainerId}`;
	iframe.height = "0";
	iframe.width = "0";
	iframe.style.cssText = "display:none;visibility:hidden";
	noscript.appendChild(iframe);
	doc.body.appendChild(noscript);
}

/** @internal Reset for unit tests */
export function resetTagManagerForTests(): void {
	gtmInitialized = false;
}
