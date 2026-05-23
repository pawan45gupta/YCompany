import { describe, expect, it } from "vitest";
import { applyCoupon } from "./coupons";

describe("applyCoupon", () => {
  it("rejects unknown codes", () => {
    const r = applyCoupon("NOPE", 10000);
    expect(r.valid).toBe(false);
  });

  it("applies WELCOME10 when minimum met", () => {
    const r = applyCoupon("WELCOME10", 6000);
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.discountCents).toBe(600);
      expect(r.freeShipping).toBe(false);
    }
  });

  it("caps SAVE20 discount", () => {
    const r = applyCoupon("SAVE20", 50000);
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.discountCents).toBe(5000);
    }
  });

  it("enables FREESHIP only above threshold", () => {
    const low = applyCoupon("FREESHIP", 5000);
    expect(low.valid).toBe(false);
    const high = applyCoupon("FREESHIP", 8000);
    expect(high.valid).toBe(true);
    if (high.valid) {
      expect(high.freeShipping).toBe(true);
    }
  });
});
