/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_NESTJS_API_URL?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
