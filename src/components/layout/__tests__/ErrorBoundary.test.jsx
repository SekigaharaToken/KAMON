import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { TestWrapper } from "@/test/wrapper.jsx";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary.jsx";

// Suppress console.error from React error boundary logging
let origConsoleError;
beforeEach(() => {
  origConsoleError = console.error;
  console.error = vi.fn();
});
afterEach(() => {
  console.error = origConsoleError;
});

function ThrowingChild() {
  throw new Error("Test error");
}

function GoodChild() {
  return <div>Hello world</div>;
}

describe("ErrorBoundary", () => {
  it("renders children when no error", () => {
    render(
      <ErrorBoundary>
        <GoodChild />
      </ErrorBoundary>,
      { wrapper: TestWrapper },
    );
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("renders fallback card when child throws", () => {
    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>,
      { wrapper: TestWrapper },
    );
    // i18n resolves "errors.boundaryTitle" to "Something went wrong"
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("fallback has a refresh button", () => {
    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>,
      { wrapper: TestWrapper },
    );
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("does not render children when error occurs", () => {
    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>,
      { wrapper: TestWrapper },
    );
    expect(screen.queryByText("Hello world")).not.toBeInTheDocument();
  });
});
