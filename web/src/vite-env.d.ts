/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CYBERNETICS_BRAND?: string;
  readonly VITE_CYBERNETICS_BRAND_SHORT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
