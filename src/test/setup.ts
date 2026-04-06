// Shim import.meta.env before any module can throw on missing vars
Object.assign(import.meta.env, {
  VITE_SUPABASE_URL: "https://test.supabase.co",
  VITE_SUPABASE_ANON_KEY: "test-anon-key",
});

import "@testing-library/jest-dom";

// Only shim window.matchMedia when running in a browser-like environment (jsdom)
// The pipeline tests run in "node" environment where `window` does not exist.
if (typeof window !== "undefined") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
    }),
  });
}
