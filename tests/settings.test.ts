import { describe, it, expect, vi, afterEach } from "vitest";
import { SettingValidationError, senderDomain, validateSetting } from "@everfit/core/lib/settings";

/**
 * The write path is where a bad value would reach a legal document, so the
 * validators get the coverage. The read path (table -> env -> default) is
 * exercised through peekSettings, which is the one branch that runs without a
 * database.
 */
describe("validateSetting", () => {
  it("accepts a well-formed GSTIN and normalises case", () => {
    expect(validateSetting("store_gstin", " 29abcde1234f1z5 ")).toBe("29ABCDE1234F1Z5");
  });

  it("rejects a malformed GSTIN", () => {
    expect(() => validateSetting("store_gstin", "29ABCDE1234")).toThrow(SettingValidationError);
    // right length, wrong shape: no mandatory Z in position 14
    expect(() => validateSetting("store_gstin", "29ABCDE1234F1X5")).toThrow(SettingValidationError);
  });

  it("lower-cases emails and rejects non-addresses", () => {
    expect(validateSetting("support_email", "  Info@EVHERFIT.com ")).toBe("info@evherfit.com");
    expect(() => validateSetting("order_notify_email", "not-an-email")).toThrow(SettingValidationError);
  });

  it("accepts only whole numbers for the Brevo list id", () => {
    expect(validateSetting("brevo_list_id", " 12 ")).toBe("12");
    expect(() => validateSetting("brevo_list_id", "2.5")).toThrow(SettingValidationError);
  });

  it("rejects a GST rate typed as a percentage", () => {
    // the mistake that matters: 18 meaning 18%, which would be read as 1800%
    expect(() => validateSetting("gst_rate", "18")).toThrow(/decimal fraction/);
    expect(() => validateSetting("gst_rate", "-0.1")).toThrow(SettingValidationError);
    expect(() => validateSetting("gst_rate", "abc")).toThrow(SettingValidationError);
  });

  it("accepts a GST rate as a decimal fraction", () => {
    expect(validateSetting("gst_rate", "0.18")).toBe("0.18");
    expect(validateSetting("gst_rate", " 0.050 ")).toBe("0.05");
    expect(validateSetting("gst_rate", "1")).toBe("1");
  });

  it("normalises a sender address with or without a display name", () => {
    expect(validateSetting("email_from", "EVHERFIT <Orders@EVHERFIT.com>")).toBe("EVHERFIT <orders@evherfit.com>");
    expect(validateSetting("email_from", "  orders@evherfit.com ")).toBe("orders@evherfit.com");
    expect(() => validateSetting("email_from", "EVHERFIT <not-an-address>")).toThrow(SettingValidationError);
    expect(() => validateSetting("email_from", "nope")).toThrow(SettingValidationError);
  });

  it("treats an empty value as 'clear this setting'", () => {
    // every kind must allow it — that is the only way back to env control
    expect(validateSetting("store_gstin", "   ")).toBe("");
    expect(validateSetting("support_email", "")).toBe("");
    expect(validateSetting("brevo_list_id", "")).toBe("");
  });

  it("collapses whitespace on single-line values but preserves multiline ones", () => {
    expect(validateSetting("store_state", "  West   Bengal ")).toBe("West Bengal");
    expect(validateSetting("store_address", " 12 MG Road\nBengaluru ")).toBe("12 MG Road\nBengaluru");
  });
});

describe("senderDomain", () => {
  it("extracts the domain from either sender shape", () => {
    expect(senderDomain("EVHERFIT <orders@evherfit.com>")).toBe("evherfit.com");
    expect(senderDomain("orders@evherfit.com")).toBe("evherfit.com");
    expect(senderDomain("Sub <a@mail.evherfit.co.in>")).toBe("mail.evherfit.co.in");
    expect(senderDomain("garbage")).toBeNull();
  });
});

describe("peekSettings", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("falls back to the environment, then to the hardcoded default", async () => {
    vi.stubEnv("SUPPORT_EMAIL", "ops@evherfit.com");
    vi.stubEnv("STORE_GSTIN", "");
    vi.resetModules();
    const { peekSettings } = await import("@everfit/core/lib/settings");

    const s = peekSettings();
    expect(s.support_email).toBe("ops@evherfit.com"); // from env
    expect(s.store_gstin).toBe(""); // no env, no default
  });
});
