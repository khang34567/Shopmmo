import { describe, expect, it } from "vitest";
import { assertDepositTransition, assertOrderTransition } from "@/services/state-machine";

describe("state machines", () => {
  it("allows valid deposit transitions and rejects invalid ones", () => {
    expect(() => assertDepositTransition("PENDING", "CONFIRMED")).not.toThrow();
    expect(() => assertDepositTransition("EXPIRED", "CONFIRMED_LATE")).not.toThrow();
    expect(() => assertDepositTransition("CONFIRMED", "REJECTED")).toThrow();
    expect(() => assertDepositTransition("REJECTED", "CONFIRMED")).toThrow();
  });

  it("allows valid order transitions and rejects invalid ones", () => {
    expect(() => assertOrderTransition("PROCESSING", "NEEDS_REVIEW")).not.toThrow();
    expect(() => assertOrderTransition("NEEDS_REVIEW", "REFUNDED")).not.toThrow();
    expect(() => assertOrderTransition("FAILED", "COMPLETED")).toThrow();
  });
});
