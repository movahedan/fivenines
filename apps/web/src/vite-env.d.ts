/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_NESTJS_API_URL?: string;
	readonly VITE_AUTH_URL?: string;
	readonly VITE_APP_ORIGIN?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
