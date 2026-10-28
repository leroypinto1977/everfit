/**
 * Rates a 1-to-1 application Hot, Warm or Cold from its answers, so the team
 * calls the readiest leads first. Pure: the intake rates each lead once, and
 * the backfill rates leads saved before rating existed.
 *
 * Answers are matched by the form's question id, or by the question's wording
 * for leads from the form before October 2026, which sent no ids. Options are
 * matched by their text, so rewording an option on the 1-to-1 form
 * (one-to-one/src/LeadForm.jsx) means rewording it here in the same change —
 * an option this table doesn't know scores nothing.
 */

export const LEAD_TEMPERATURES = [
  { value: "hot", label: "Hot" },
  { value: "warm", label: "Warm" },
  { value: "cold", label: "Cold" },
] as const;

export type LeadTemperature = (typeof LEAD_TEMPERATURES)[number]["value"];

export const isLeadTemperature = (v: unknown): v is LeadTemperature =>
  LEAD_TEMPERATURES.some((t) => t.value === v);

export interface LeadRating {
  temperature: LeadTemperature;
  score: number;
  /** The answers that earned or cost points, worded for the person making the call. */
  reasons: string[];
}

export const RATING_MAX = 12;
const HOT = 9;
const WARM = 5;

const norm = (s: string) =>
  s.toLowerCase().replace(/[‘’]/g, "'").replace(/[–—]/g, "-").replace(/\s+/g, " ").trim();

interface Readiness {
  id: string;
  /** The question's wording on the old form. */
  legacy: string[];
  name: string;
  points: Record<string, number>;
  /** Options that rule the lead out — only the old form had any. */
  cold?: string[];
  /** Options that cap the lead at Warm however high it scores. */
  notHot?: string[];
}

const READINESS: Readiness[] = [
  {
    id: "invest",
    legacy: ["If Evherfit is the right fit for your goals, which best describes you?"],
    name: "Moving forward",
    points: {
      "I'm ready to invest in myself and start right away": 4,
      "I'd like Manjula to walk me through my personalised plan on the call, then start": 3,
      "I'd like to go through my plan together with my family on the call": 1,
      "I am financially ready to invest ₹35,000–₹40,000 and begin": 4,
      "I am comfortable with the investment, but need more clarity before deciding": 3,
      "I need to discuss the investment with my spouse / family": 1,
    },
    cold: ["₹35,000–₹40,000 is currently outside my budget", "I am only exploring options right now"],
  },
  {
    id: "decision",
    legacy: ["Who will make the final decision about joining Evherfit?"],
    name: "On the call",
    points: {
      "Just me. I make my own decisions about my health": 3,
      "Me and my husband": 1,
      "Me and a family member": 1,
      "I can make the decision myself": 3,
      "I need to discuss it with my spouse / family": 1,
      "Someone else will be financially supporting me": 1,
      "I am unsure": 0,
    },
  },
  {
    id: "start",
    legacy: ["If selected for Evherfit, when would you be ready to start?"],
    name: "Start",
    points: {
      "This week": 3,
      "Within the next 2 weeks": 2,
      "Within the next month": 1,
      "Right after an upcoming commitment ends (I'll share the date on the call)": 0,
      "Immediately / within 7 days": 3,
      "Within 2 weeks": 2,
      "Within 30 days": 1,
      "After one month": 0,
    },
    notHot: [
      "Right after an upcoming commitment ends (I'll share the date on the call)",
      "After one month",
    ],
    cold: ["I am only exploring right now"],
  },
  {
    // Only on the old form; it can rule a lead out but earns nothing.
    id: "commit",
    legacy: ["How ready are you to commit to your transformation for the next 90 days?"],
    name: "Commitment",
    points: {},
    cold: ["I am not ready to make significant lifestyle changes right now"],
  },
];

/** True when any of `options` was ticked; checkbox answers arrive joined with ", ". */
const ticked = (value: string, options: string[]) => options.filter((o) => norm(value).includes(norm(o))).length;

const BONUSES: { id: string; reason: string; earns: (value: string) => boolean }[] = [
  {
    id: "health",
    reason: "Has a medical concern (PCOS, thyroid, diabetes or BP)",
    earns: (v) => ticked(v, ["PCOS / PCOD", "Thyroid", "Diabetes or pre-diabetes", "High BP / cholesterol"]) > 0,
  },
  {
    id: "impact",
    reason: "It affects her day to day in 3+ ways",
    earns: (v) =>
      ticked(v, [
        "I avoid photos or don't like what I see in the mirror",
        "My clothes don't fit and I hide my body",
        "I feel tired and low on energy most days",
        "My health reports or doctor have warned me",
        "I can't keep up with my kids and family",
        "I worry about my long-term health",
      ]) >= 3,
  },
];

type Answer = { id?: string; label: string; value: string };

const find = (answers: Answer[], id: string, legacy: string[]) =>
  answers.find((a) => a.id === id || legacy.some((l) => norm(l) === norm(a.label)))?.value;

/** Null when none of the readiness questions was answered — a lead from some other form. */
export function rateLead(answers: Answer[]): LeadRating | null {
  let score = 0;
  let rated = false;
  let cold = false;
  let notHot = false;
  const reasons: string[] = [];

  for (const q of READINESS) {
    const value = find(answers, q.id, q.legacy);
    if (!value) continue;
    if (q.cold?.some((o) => norm(o) === norm(value))) {
      rated = cold = true;
      reasons.push(`${q.name}: ${value} (rules out)`);
      continue;
    }
    const points = Object.entries(q.points).find(([o]) => norm(o) === norm(value))?.[1];
    if (points === undefined) continue;
    rated = true;
    score += points;
    reasons.push(`${q.name}: ${value} (+${points})`);
    if (q.notHot?.some((o) => norm(o) === norm(value))) notHot = true;
  }
  if (!rated) return null;

  for (const b of BONUSES) {
    const value = find(answers, b.id, []);
    if (value && b.earns(value)) {
      score += 1;
      reasons.push(`${b.reason} (+1)`);
    }
  }

  const age = Number(find(answers, "age", ["Age"]));
  if (age > 0 && age < 18) {
    cold = true;
    reasons.push("Under 18 (rules out)");
  }

  const temperature = cold ? "cold" : score >= HOT && !notHot ? "hot" : score >= WARM ? "warm" : "cold";
  return { temperature, score, reasons };
}
