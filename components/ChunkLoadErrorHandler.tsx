"use client";

// Chunk loading error handler
if (typeof window !== "undefined") {
  // Handle dynamic import errors globally
  const originalImport = (window as any).__webpack_require__;

  // Override error handling for chunk loading
  window.addEventListener("error", (event) => {
    const error = event.error;

    // Check if it's a chunk loading error
    if (
      error &&
      (error.name === "ChunkLoadError" ||
        error.message.includes("Loading chunk") ||
        error.message.includes("Loading CSS chunk") ||
        event.filename?.includes("_next/static/chunks"))
    ) {
      console.warn("Chunk loading error detected:", error);

      // Prevent default error handling
      event.preventDefault();

      // Try to reload the page after a short delay
      setTimeout(() => {
        console.log("Attempting page reload due to chunk loading error...");
        window.location.reload();
      }, 1000);
    }
  });

  // Handle unhandled promise rejections (for dynamic imports)
  window.addEventListener("unhandledrejection", (event) => {
    const error = event.reason;

    if (
      error &&
      (error.name === "ChunkLoadError" ||
        error.message?.includes("Loading chunk") ||
        error.message?.includes("Failed to fetch dynamically imported module"))
    ) {
      console.warn("Chunk loading promise rejection:", error);

      // Prevent default handling
      event.preventDefault();

      // Try to reload the page
      setTimeout(() => {
        console.log(
          "Attempting page reload due to chunk loading promise rejection..."
        );
        window.location.reload();
      }, 1000);
    }
  });

  // Add retry logic for dynamic imports
  const retryDynamicImport = (
    importFn: () => Promise<any>,
    retries = 3
  ): Promise<any> => {
    return importFn().catch((error) => {
      if (
        retries > 0 &&
        (error.name === "ChunkLoadError" ||
          error.message?.includes("Loading chunk"))
      ) {
        console.warn(
          `Chunk loading failed, retrying... (${retries} attempts left)`
        );

        // Wait a bit before retrying
        return new Promise((resolve) => setTimeout(resolve, 1000)).then(() =>
          retryDynamicImport(importFn, retries - 1)
        );
      }
      throw error;
    });
  };

  // Make retry function globally available
  (window as any).retryDynamicImport = retryDynamicImport;
}

export default function ChunkLoadErrorHandler() {
  return null; // This is just a side-effect component
}
