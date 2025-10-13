"use client";
import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      "Component Error Boundary caught an error:",
      error,
      errorInfo
    );

    // If it's a ChunkLoadError, try to reload the page
    if (
      error.name === "ChunkLoadError" ||
      error.message.includes("Loading chunk")
    ) {
      window.location.reload();
    }
  }

  render() {
    if (this.state.hasError) {
      // If it's a chunk loading error, show a reload button
      if (
        this.state.error?.name === "ChunkLoadError" ||
        this.state.error?.message.includes("Loading chunk")
      ) {
        return (
          <div className="flex flex-col items-center justify-center min-h-[200px] p-8 bg-gray-50 rounded-lg">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Loading Error
              </h3>
              <p className="text-gray-600 mb-4">
                There was a problem loading this page. This usually happens when
                the app is updated.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        );
      }

      // For other errors, show the fallback or default error UI
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center min-h-[200px] p-8 bg-red-50 rounded-lg">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-red-800 mb-2">
                Something went wrong
              </h3>
              <p className="text-red-600 mb-4">
                An unexpected error occurred. Please try refreshing the page.
              </p>
              <button
                onClick={() => this.setState({ hasError: false })}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors mr-2"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
