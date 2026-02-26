/**
 * TransactionStepper — vertical stepper showing real-time transaction progress.
 *
 * Purely presentational. Each step has a status icon, label, description,
 * and connector line between steps.
 */

import { cva } from "class-variance-authority";
import { Circle, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const labelVariants = cva("text-sm transition-colors", {
  variants: {
    status: {
      pending: "text-muted-foreground/60",
      active: "text-foreground font-semibold",
      completed: "text-muted-foreground",
      error: "text-destructive font-semibold",
    },
  },
  defaultVariants: { status: "pending" },
});

const iconMap = {
  pending: <Circle className="size-5 text-muted-foreground/40" />,
  active: <Loader2 className="size-5 text-primary animate-spin" />,
  completed: <CheckCircle2 className="size-5 text-green-500" />,
  error: <XCircle className="size-5 text-destructive" />,
};

function TransactionStepper({ steps, className }) {
  return (
    <div data-slot="stepper" className={cn("flex flex-col", className)}>
      {steps.map((step, i) => (
        <div key={i} className="flex gap-3">
          {/* Icon column + connector */}
          <div className="flex flex-col items-center">
            <div className="flex-shrink-0">{iconMap[step.status]}</div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "w-0.5 flex-1 min-h-6 my-1 rounded-full transition-colors",
                  step.status === "completed" ? "bg-green-500" : "bg-border",
                )}
              />
            )}
          </div>

          {/* Label + description */}
          <div className={cn("pb-6", i === steps.length - 1 && "pb-0")}>
            <p className={labelVariants({ status: step.status })}>{step.label}</p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">
              {step.status === "error" && step.errorMessage
                ? step.errorMessage
                : step.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export { TransactionStepper };
