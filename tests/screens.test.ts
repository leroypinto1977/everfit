import { describe, it, expect } from "vitest";
import { canSee, homeFor, isScreenKey } from "../apps/admin/src/lib/screens";

describe("admin screen access", () => {
  it("lets an owner open every screen whatever their list says", () => {
    const owner = { role: "owner", screens: [] };
    expect(canSee(owner, "revenue")).toBe(true);
    expect(homeFor(owner)).toBe("/");
  });

  it("limits staff to the screens ticked for them", () => {
    const staff = { role: "staff", screens: ["one-to-one", "orders"] };
    expect(canSee(staff, "orders")).toBe(true);
    expect(canSee(staff, "revenue")).toBe(false);
    expect(canSee(staff, "dashboard")).toBe(false);
    // sent to the first allowed screen in sidebar order, never back to a denied one
    expect(homeFor(staff)).toBe("/orders");
  });

  it("sends staff with no screens to Settings, which never redirects", () => {
    expect(homeFor({ role: "staff", screens: [] })).toBe("/settings");
  });

  it("only accepts known screen keys from a form", () => {
    expect(isScreenKey("one-to-one")).toBe(true);
    expect(isScreenKey("settings")).toBe(false);
    expect(isScreenKey("../admin")).toBe(false);
  });
});
