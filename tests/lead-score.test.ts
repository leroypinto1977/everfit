import { describe, it, expect } from "vitest";
import { rateLead } from "@everfit/core/lib/lead-score";
import { parseLead } from "@everfit/core/lib/leads";
import { leadNotification } from "@everfit/core/lib/email/templates";

const lead = (answers: Record<string, string>) =>
  Object.entries(answers).map(([id, value]) => ({ id, label: id, value }));

describe("rateLead", () => {
  it("rates the plan's three examples", () => {
    const hot = rateLead(
      lead({
        decision: "Just me. I make my own decisions about my health",
        invest: "I’d like Manjula to walk me through my personalised plan on the call, then start", // curly quote, as forms type it
        start: "Within the next 2 weeks",
        health: "Diabetes, high BP or cholesterol, Knee, back or joint pain",
      })
    );
    expect(hot).toMatchObject({ temperature: "hot", score: 9 });

    const warm = rateLead(
      lead({
        decision: "Me and my husband",
        invest: "I'd like Manjula to walk me through my personalised plan on the call, then start",
        start: "Within the next month",
        impact: "I feel tired and low on energy most days, I worry about my long-term health",
      })
    );
    expect(warm).toMatchObject({ temperature: "warm", score: 6 });

    const cold = rateLead(
      lead({
        decision: "Me and a family member",
        invest: "I'd like to go through my plan together with my family on the call",
        start: "Right after an upcoming commitment ends (I'll share the date on the call)",
      })
    );
    expect(cold).toMatchObject({ temperature: "cold", score: 2 });
  });

  it("never rates a later start Hot, and rules out under-18s", () => {
    const later = lead({
      decision: "Just me. I make my own decisions about my health",
      invest: "I'm ready to invest in myself and start right away",
      start: "Right after an upcoming commitment ends (I'll share the date on the call)",
      health: "PCOS / PCOD",
    });
    expect(rateLead(later)).toMatchObject({ temperature: "warm", score: 8 });
    expect(rateLead([...later, { id: "age", label: "Age", value: "16" }])?.temperature).toBe("cold");
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

  it("scores the ₹35,000 question: +1 when ready, never hot after a family talk", () => {
    const base = {
      decision: "Just me. I make my own decisions about my health",
      invest: "I'd like Manjula to walk me through my personalised plan on the call, then start",
      start: "Within the next 2 weeks",
    };
    expect(rateLead(lead({ ...base, afford: "Yes, my health is worth it. I’m ready to invest ₹35,000" }))).toMatchObject({ temperature: "hot", score: 9 });
    expect(rateLead(lead({ ...base, health: "Thyroid", afford: "Yes, after I discuss it with my family" }))).toMatchObject({ temperature: "warm", score: 9 });
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
      answers: lead({ start: "This week", invest: "I'm ready to invest in myself and start right away", decision: "Me and my husband" }),
    })!;
    expect(parsed.answers[0].id).toBe("start");
    expect(leadNotification(parsed, { subject: "New lead {{name}}", body: "x" }).subject).toBe("🟠 Warm 8/13 · New lead Priya");
  });
});
