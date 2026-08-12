import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach } from "vitest";

function instalarMatchMediaPadrao() {
  Object.defineProperty(window, "matchMedia", {
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
    configurable: true,
    writable: true,
  });
}

beforeEach(() => {
  instalarMatchMediaPadrao();
});

afterEach(() => {
  cleanup();
});
