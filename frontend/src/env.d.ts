/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // Add more VITE_ variables here if needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
