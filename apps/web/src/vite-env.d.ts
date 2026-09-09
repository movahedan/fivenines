/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
	readonly VITE_NESTJS_API_URL?: string;
	readonly VITE_AUTH_URL: string;
	readonly VITE_APP_ORIGIN: string;
	readonly VITE_GTM_CONTAINER_ID?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
