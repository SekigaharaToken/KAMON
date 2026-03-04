import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useTransactionStepper } from "../useTransactionStepper.js";

const twoSteps = [
  { label: "Step 1", description: "First step" },
  { label: "Step 2", description: "Second step" },
];

describe("useTransactionStepper", () => {
  it("initializes all steps as pending", () => {
    const { result } = renderHook(() => useTransactionStepper(twoSteps));
    expect(result.current.steps).toHaveLength(2);
    expect(result.current.steps[0].status).toBe("pending");
    expect(result.current.steps[1].status).toBe("pending");
    expect(result.current.isComplete).toBe(false);
    expect(result.current.isActive).toBe(false);
    expect(result.current.activeStep).toBe(-1);
  });

  it("start marks step 0 as active", () => {
    const { result } = renderHook(() => useTransactionStepper(twoSteps));
    act(() => result.current.start());
    expect(result.current.steps[0].status).toBe("active");
    expect(result.current.steps[1].status).toBe("pending");
    expect(result.current.activeStep).toBe(0);
    expect(result.current.isActive).toBe(true);
  });

  it("advance completes current and activates next", () => {
    const { result } = renderHook(() => useTransactionStepper(twoSteps));
    act(() => result.current.start());
    act(() => result.current.advance());
    expect(result.current.steps[0].status).toBe("completed");
    expect(result.current.steps[1].status).toBe("active");
    expect(result.current.activeStep).toBe(1);
  });

  it("advance on last step completes all, isComplete true", () => {
    const { result } = renderHook(() => useTransactionStepper(twoSteps));
    act(() => result.current.start());
    act(() => result.current.advance());
    act(() => result.current.advance());
    expect(result.current.steps[0].status).toBe("completed");
    expect(result.current.steps[1].status).toBe("completed");
    expect(result.current.isComplete).toBe(true);
    expect(result.current.isActive).toBe(false);
    expect(result.current.activeStep).toBe(-1);
  });

  it("fail marks active step as error with message", () => {
    const { result } = renderHook(() => useTransactionStepper(twoSteps));
    act(() => result.current.start());
    act(() => result.current.fail("Something broke"));
    expect(result.current.steps[0].status).toBe("error");
    expect(result.current.steps[0].errorMessage).toBe("Something broke");
    expect(result.current.isActive).toBe(false);
  });

  it("reset returns all steps to pending", () => {
    const { result } = renderHook(() => useTransactionStepper(twoSteps));
    act(() => result.current.start());
    act(() => result.current.advance());
    act(() => result.current.reset());
    expect(result.current.steps[0].status).toBe("pending");
    expect(result.current.steps[1].status).toBe("pending");
    expect(result.current.isComplete).toBe(false);
    expect(result.current.activeStep).toBe(-1);
  });

  it("retry sets errored step back to active, preserving completed steps", () => {
    const { result } = renderHook(() => useTransactionStepper(twoSteps));
    // Complete step 0, then fail on step 1
    act(() => result.current.start());
    act(() => result.current.advance());
    act(() => result.current.fail("attest failed"));
    expect(result.current.steps[0].status).toBe("completed");
    expect(result.current.steps[1].status).toBe("error");

    // Retry should re-activate step 1, keep step 0 completed
    act(() => result.current.retry());
    expect(result.current.steps[0].status).toBe("completed");
    expect(result.current.steps[1].status).toBe("active");
    expect(result.current.steps[1].errorMessage).toBeNull();
    expect(result.current.activeStep).toBe(1);
    expect(result.current.isActive).toBe(true);
  });

  it("retry on step 0 error re-activates step 0", () => {
    const { result } = renderHook(() => useTransactionStepper(twoSteps));
    act(() => result.current.start());
    act(() => result.current.fail("mint failed"));
    expect(result.current.steps[0].status).toBe("error");

    act(() => result.current.retry());
    expect(result.current.steps[0].status).toBe("active");
    expect(result.current.steps[1].status).toBe("pending");
    expect(result.current.activeStep).toBe(0);
  });

  it("retry is a no-op when no step is in error", () => {
    const { result } = renderHook(() => useTransactionStepper(twoSteps));
    act(() => result.current.start());
    const stepsBefore = result.current.steps;
    act(() => result.current.retry());
    expect(result.current.steps).toBe(stepsBefore);
  });
});
