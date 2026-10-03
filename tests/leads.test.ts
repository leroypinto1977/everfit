import { describe, it, expect } from "vitest";
import { parseLead } from "@everfit/core/lib/leads";

/**
 * parseLead is the only thing between an unauthenticated POST and the leads
 * table, so the accept/reject boundary gets the coverage.
 */
const valid = {
  ref: "k7q2x9ab",
  source: "one-to-one",
  name: " Test ",
  phone: "+91 98765 43210",
  email: "Test@Example.com",
  answers: [{ label: "Age", value: "28" }],
};

describe("parseLead", () => {
  it("normalises a well-formed application", () => {
    expect(parseLead(valid)).toEqual({ ...valid, ref: "K7Q2X9AB", name: "Test", email: "test@example.com" });
  });

  it("rejects bodies that are not a usable application", () => {
    expect(parseLead(null)).toBeNull();
    expect(parseLead("lead")).toBeNull();
    expect(parseLead({ ...valid, ref: "a b" })).toBeNull();
    expect(parseLead({ ...valid, phone: "12345" })).toBeNull();
    expect(parseLead({ ...valid, email: "not-an-email" })).toBeNull();
    expect(parseLead({ ...valid, answers: "none" })).toBeNull();
  });

  it("drops malformed answers and clips over-long ones instead of losing the lead", () => {
    const lead = parseLead({
      ...valid,
      answers: [null, { label: "Goal" }, { label: "Goal", value: "x".repeat(5000) }],
    });
    expect(lead?.answers).toEqual([{ label: "Goal", value: "x".repeat(1000) }]);
  });
});
