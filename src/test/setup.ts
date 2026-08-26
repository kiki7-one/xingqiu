import "@testing-library/jest-dom/vitest";

// jsdom 不实现 matchMedia
if (!window.matchMedia) {
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
      dispatchEvent: () => false,
    }),
  });
}

// jsdom 不实现 scrollTo
if (!window.scrollTo) {
  Object.defineProperty(window, "scrollTo", {
    writable: true,
    value: () => {},
  });
}

// jsdom 不实现 URL.createObjectURL/revokeObjectURL
if (!URL.createObjectURL) {
  URL.createObjectURL = (() => "blob:mock-url") as typeof URL.createObjectURL;
}
if (!URL.revokeObjectURL) {
  URL.revokeObjectURL = (() => {}) as typeof URL.revokeObjectURL;
}
