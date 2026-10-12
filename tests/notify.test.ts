import { afterEach, describe, expect, it, vi } from "vitest";

// notify.ts reaches the database through these two; the provider logic under
// test needs neither.
vi.mock("@everfit/core/lib/settings", () => ({ getSettings: async () => ({ email_from: "", support_email: "" }) }));
vi.mock("@everfit/core/lib/orders", () => ({ logEmailEvent: async () => {} }));

import {
  brevoPayload,
  emailConfigured,
  emailProvider,
  resendPayload,
  sendTestEmail,
  senderIsUsable,
} from "@everfit/core/lib/notify";

const message = {
  from: "EVHERFIT <orders@evherfit.com>",
  to: "buyer@example.com",
  subject: "Order confirmed",
  html: "<p>Thanks</p>",
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("email provider", () => {
  it("is off without a key, Brevo with its key, and Resend whenever its key is set", () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("BREVO_API_KEY", "");
    expect(emailProvider()).toBeNull();
    expect(emailConfigured()).toBe(false);

    vi.stubEnv("BREVO_API_KEY", "xkeysib-test");
    expect(emailProvider()).toBe("brevo");

    vi.stubEnv("RESEND_API_KEY", "re_test");
    expect(emailProvider()).toBe("resend");
    expect(emailConfigured()).toBe(true);
  });

  it("builds each provider's request body", () => {
    expect(resendPayload({ ...message, replyTo: "lead@example.com" })).toEqual({
      from: "EVHERFIT <orders@evherfit.com>",
      to: ["buyer@example.com"],
      subject: "Order confirmed",
      html: "<p>Thanks</p>",
      reply_to: "lead@example.com",
    });
    expect(resendPayload(message)).not.toHaveProperty("reply_to");
    expect(brevoPayload({ ...message, replyTo: "" })).toEqual({
      sender: { name: "EVHERFIT", email: "orders@evherfit.com" },
      to: [{ email: "buyer@example.com" }],
      subject: "Order confirmed",
      htmlContent: "<p>Thanks</p>",
    });
  });

  it("sends through Resend with a bearer key, and reports a rejection by name", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("BREVO_API_KEY", "xkeysib-test");
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ id: "1" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    expect(await sendTestEmail("owner@example.com", { subject: "Hello", html: "<p>Hi</p>" })).toEqual({});
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect((init.headers as Record<string, string>).authorization).toBe("Bearer re_test");
    expect(JSON.parse(init.body as string)).toMatchObject({ to: ["owner@example.com"], subject: "[Test] Hello" });

    vi.stubGlobal("fetch", vi.fn(async () => new Response("domain not verified", { status: 403 })));
    expect((await sendTestEmail("owner@example.com", { subject: "Hello", html: "" })).error).toMatch(/^Resend rejected the send \(403\)/);
  });

  it("falls back to Brevo when only its key is set", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("BREVO_API_KEY", "xkeysib-test");
    const fetchMock = vi.fn(async () => new Response("{}", { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    expect(await sendTestEmail("owner@example.com", { subject: "Hello", html: "<p>Hi</p>" })).toEqual({});
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.brevo.com/v3/smtp/email");
    expect((init.headers as Record<string, string>)["api-key"]).toBe("xkeysib-test");
  });

  it("checks a sender against Resend's verified domains, and can't tell with a send-only key", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response(JSON.stringify({ data: [{ name: "evherfit.com", status: "verified" }, { name: "old.example", status: "pending" }] }))
    ));
    expect(await senderIsUsable("Orders@Evherfit.com")).toBe(true);
    expect(await senderIsUsable("a@old.example")).toBe(false);

    vi.stubGlobal("fetch", vi.fn(async () => new Response("restricted_api_key", { status: 401 })));
    expect(await senderIsUsable("orders@evherfit.com")).toBeNull();
  });
});
