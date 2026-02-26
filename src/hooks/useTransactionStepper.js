/**
 * useTransactionStepper — state machine for multi-step transaction flows.
 *
 * Each step has: { label, description, status: "pending"|"active"|"completed"|"error", errorMessage }
 * Provides: start, advance, fail, reset, isComplete, isActive, activeStep
 */

import { useState, useCallback, useMemo } from "react";

export function useTransactionStepper(initialSteps) {
  const [steps, setSteps] = useState(() =>
    initialSteps.map((s) => ({ ...s, status: "pending", errorMessage: null })),
  );

  const activeStep = useMemo(
    () => steps.findIndex((s) => s.status === "active"),
    [steps],
  );

  const isComplete = useMemo(
    () => steps.length > 0 && steps.every((s) => s.status === "completed"),
    [steps],
  );

  const isActive = useMemo(() => activeStep !== -1, [activeStep]);

  const start = useCallback(() => {
    setSteps((prev) =>
      prev.map((s, i) =>
        i === 0 ? { ...s, status: "active", errorMessage: null } : s,
      ),
    );
  }, []);

  const advance = useCallback(() => {
    setSteps((prev) => {
      const idx = prev.findIndex((s) => s.status === "active");
      if (idx === -1) return prev;
      return prev.map((s, i) => {
        if (i === idx) return { ...s, status: "completed", errorMessage: null };
        if (i === idx + 1) return { ...s, status: "active", errorMessage: null };
        return s;
      });
    });
  }, []);

  const fail = useCallback((msg) => {
    setSteps((prev) => {
      const idx = prev.findIndex((s) => s.status === "active");
      if (idx === -1) return prev;
      return prev.map((s, i) =>
        i === idx ? { ...s, status: "error", errorMessage: msg } : s,
      );
    });
  }, []);

  const reset = useCallback(() => {
    setSteps((prev) =>
      prev.map((s) => ({ ...s, status: "pending", errorMessage: null })),
    );
  }, []);

  return { steps, start, advance, fail, reset, isComplete, isActive, activeStep };
}
