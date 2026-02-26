import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TransactionStepper } from "../stepper.jsx";

const mockSteps = [
  { label: "Mint NFT", description: "Purchase token", status: "completed", errorMessage: null },
  { label: "Register", description: "Create attestation", status: "active", errorMessage: null },
];

describe("TransactionStepper", () => {
  it("renders the correct number of steps", () => {
    render(<TransactionStepper steps={mockSteps} />);
    expect(screen.getByText("Mint NFT")).toBeInTheDocument();
    expect(screen.getByText("Register")).toBeInTheDocument();
  });

  it("shows correct labels and descriptions", () => {
    const steps = [
      { label: "Step A", description: "Do A", status: "pending", errorMessage: null },
      { label: "Step B", description: "Do B", status: "pending", errorMessage: null },
    ];
    render(<TransactionStepper steps={steps} />);
    expect(screen.getByText("Step A")).toBeInTheDocument();
    expect(screen.getByText("Do A")).toBeInTheDocument();
    expect(screen.getByText("Step B")).toBeInTheDocument();
    expect(screen.getByText("Do B")).toBeInTheDocument();
  });

  it("displays error message when step is in error state", () => {
    const steps = [
      { label: "Mint NFT", description: "Purchase token", status: "error", errorMessage: "Transaction failed" },
      { label: "Register", description: "Create attestation", status: "pending", errorMessage: null },
    ];
    render(<TransactionStepper steps={steps} />);
    expect(screen.getByText("Transaction failed")).toBeInTheDocument();
    // Description should be replaced by error message
    expect(screen.queryByText("Purchase token")).not.toBeInTheDocument();
  });

  it("shows description when step has no error message", () => {
    const steps = [
      { label: "Mint NFT", description: "Purchase token", status: "active", errorMessage: null },
    ];
    render(<TransactionStepper steps={steps} />);
    expect(screen.getByText("Purchase token")).toBeInTheDocument();
  });
});
