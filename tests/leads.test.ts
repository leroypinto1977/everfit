import { describe, it, expect } from "vitest";
import { parseLead } from "@everfit/core/lib/leads";
import { leadNotification } from "@everfit/core/lib/email/templates";
import { validateSetting } from "@everfit/core/lib/settings";

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
    expect(parseLead(valid)).toEqual({
      ...valid,
      ref: "K7Q2X9AB",
      name: "Test",
      email: "test@example.com",
      rating: null,
    });
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

/**
 * The lead email is built from text the owner typed and values a stranger
 * typed into a public form, so the two things worth pinning are that the
 * placeholders are filled and that nothing the lead wrote can become markup.
 */
describe("leadNotification", () => {
  const lead = parseLead({ ...valid, name: "<b>Mallory</b>", answers: [{ label: "Goal", value: "<script>x</script>" }] })!;

  it("fills the owner's placeholders in the subject and the body", () => {
    const email = leadNotification(parseLead(valid)!, {
      subject: "New lead — {{name}} (#{{ref}})",
      body: "Call {{name}} on {{phone}}.\n\n{{answers}}\n\nOpen: {{link}} {{typo}}",
    });
    expect(email.subject).toBe("New lead — Test (#K7Q2X9AB)");
    expect(email.html).toContain("Call Test on +91 98765 43210.");
    expect(email.html).toContain("/one-to-one?q=K7Q2X9AB");
    expect(email.html).toContain("28"); // the answer to "Age"
    expect(email.html).toContain("{{typo}}"); // an unknown placeholder stays visible
  });

  it("escapes everything the lead typed", () => {
    const email = leadNotification(lead, { subject: "{{name}}", body: "Hi {{name}}\n\n{{answers}}" });
    expect(email.html).not.toContain("<b>Mallory</b>");
    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("&lt;b&gt;Mallory&lt;/b&gt;");
  });

  it("is a plain note with a text part, not the branded newsletter shell", () => {
    const email = leadNotification(parseLead(valid)!, { subject: "{{name}}", body: "Call {{name}}." });
    expect(email.html).not.toContain("/track");
    expect(email.html).not.toContain("<table");
    expect(email.text).toContain("Call Test.");
    expect(email.text).toContain("/one-to-one?q=K7Q2X9AB");
  });

  it("always carries the rating, its reasons and every detail of the lead", () => {
    const rated = parseLead({
      ...valid,
      answers: [
        { id: "start", label: "When would you like to start?", value: "This week" },
        { id: "invest", label: "Move forward", value: "I'm ready to invest in myself and start right away" },
      ],
    })!;
    // The owner's wording mentions nothing but the name.
    const email = leadNotification(rated, { subject: "{{name}}", body: "New lead: {{name}}" });
    for (const part of [email.html, email.text!]) {
      expect(part).toContain("Rating: Hot lead (7 pts)");
      expect(part).toContain("Start: This week (+3)");
      expect(part).toContain("+91 98765 43210");
      expect(part).toContain("test@example.com");
      expect(part).toContain("K7Q2X9AB");
      expect(part).toContain("When would you like to start?");
    }
    // The default wording already lists them, so they are not repeated.
    const withAll = leadNotification(rated, {
      subject: "x",
      body: "Name: {{name}}\nWhatsApp: {{phone}}\nEmail: {{email}}\n\n{{answers}}\n\n{{link}}",
    });
    expect(withAll.text!.split("+91 98765 43210").length).toBe(2);
    expect(withAll.text!.split("When would you like to start?").length).toBe(2);
  });
});

describe("lead email settings", () => {
  it("normalises a list of recipients and rejects a bad address", () => {
    expect(validateSetting("lead_notify_emails", " A@x.com ;b@y.com,\n a@x.com ")).toBe("a@x.com, b@y.com");
    expect(() => validateSetting("lead_notify_emails", "a@x.com, nope")).toThrow(/nope/);
    expect(() => validateSetting("lead_notify_emails", "a@x.co b@x.co c@x.co d@x.co e@x.co f@x.co")).toThrow(/five/);
  });

  it("keeps the message's paragraphs and treats browser line endings as unchanged", () => {
    expect(validateSetting("lead_email_body", "Hello {{name}}\r\n\r\n{{answers}}\r\n")).toBe("Hello {{name}}\n\n{{answers}}");
  });
});
