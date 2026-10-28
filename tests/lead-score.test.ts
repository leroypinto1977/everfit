import { describe, it, expect } from "vitest";
import { rateLead } from "@everfit/core/lib/lead-score";
import { parseLead } from "@everfit/core/lib/leads";
import { leadNotification } from "@everfit/core/lib/email/templates";

const lead = (answers: Record<string, string>) =>
  Object.entries(answers).map(([id, value]) => ({ id, label: id, value }));

describe("rateLead", () => {
  it("rates hot, warm and cold leads from the current form", () => {
    const hot = rateLead(
      lead({
        afford: "Yes, my health is worth it. I’m ready to invest ₹35,000", // curly quote, as the form types it
        invest: "I’d like Manjula to walk me through my personalised plan on the call, then start",
        start: "Within the next 2 weeks",
        health: "Diabetes, high BP or cholesterol, Knee, back or joint pain",
      })
    );
    expect(hot).toMatchObject({ temperature: "hot", score: 7 });

    const warm = rateLead(
      lead({
        afford: "Yes, once Manjula explains my personalised plan on the call",
        invest: "I'd like Manjula to walk me through my personalised plan on the call, then start",
        start: "Within the next month",
        impact: "I feel tired and low on energy most days, I worry about my long-term health",
      })
    );
    expect(warm).toMatchObject({ temperature: "warm", score: 5 });

    const cold = rateLead(
      lead({
        afford: "Yes, after I discuss it with my family",
        invest: "I'd like to go through my plan together with my family on the call",
        start: "Right after an upcoming commitment ends (I'll share the date on the call)",
      })
    );
    expect(cold).toMatchObject({ temperature: "cold", score: 1 });
  });

  it("never rates a later start or a family talk Hot, and rules out under-18s", () => {
    const later = lead({
      afford: "Yes, my health is worth it. I'm ready to invest ₹35,000",
      invest: "I'm ready to invest in myself and start right away",
      start: "Right after an upcoming commitment ends (I'll share the date on the call)",
      health: "PCOS / PCOD",
      impact: "I feel tired and low on energy most days, I worry about my long-term health",
    });
    expect(rateLead(later)).toMatchObject({ temperature: "warm", score: 7 });
    expect(rateLead([...later, { id: "age", label: "Age", value: "16" }])?.temperature).toBe("cold");

    const family = lead({
      afford: "Yes, after I discuss it with my family",
      invest: "I'm ready to invest in myself and start right away",
      start: "This week",
      health: "Thyroid",
    });
    expect(rateLead(family)).toMatchObject({ temperature: "warm", score: 8 });
  });

  it("rates leads from the old form by question wording", () => {
    const old = [
      { label: "If Evherfit is the right fit for your goals, which best describes you?", value: "I am financially ready to invest ₹35,000–₹40,000 and begin" },
      { label: "Who will make the final decision about joining Evherfit?", value: "I can make the decision myself" },
      { label: "If selected for Evherfit, when would you be ready to start?", value: "Immediately / within 7 days" },
    ];
    expect(rateLead(old)).toMatchObject({ temperature: "hot", score: 10 });
    old[0].value = "₹35,000–₹40,000 is currently outside my budget";
    expect(rateLead(old)?.temperature).toBe("cold");
  });

  it("leaves a lead it can't rate unrated", () => {
    expect(rateLead([{ label: "Age", value: "28" }])).toBeNull();
  });

  it("carries the rating from intake into the team's email subject", () => {
    const parsed = parseLead({
      ref: "ABC123",
      name: "Priya",
      phone: "+91 98765 43210",
      email: "p@example.com",
      answers: lead({ start: "This week", invest: "I'm ready to invest in myself and start right away" }),
    })!;
    expect(parsed.answers[0].id).toBe("start");
    expect(leadNotification(parsed, { subject: "New lead {{name}}", body: "x" }).subject).toBe("Hot lead, 7 pts: New lead Priya");
  });
});
