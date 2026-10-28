import { and, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { db } from "../db";
import { leads } from "../db/schema";
import { rateLead, type LeadRating, type LeadTemperature } from "./lead-score";

/**
 * Leads — applications submitted on the landing sites. The visitor's browser
 * posts the form here and, in the same click, opens WhatsApp with the same
 * answers; `ref` appears in both so the team can match message to record.
 */

/** The follow-up pipeline, in order. Add or rename a stage here — nothing else lists them. */
export const LEAD_STATUSES = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "no_response", label: "No response" },
  { value: "call_booked", label: "Call booked" },
  { value: "call_done", label: "Call done" },
  { value: "joined", label: "Joined" },
  { value: "not_joining", label: "Not joining" },
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number]["value"];

export const isLeadStatus = (v: unknown): v is LeadStatus => LEAD_STATUSES.some((s) => s.value === v);

export interface LeadAnswer {
  /** The form's question id; absent on leads from the form before October 2026. */
  id?: string;
  label: string;
  value: string;
}

export interface NewLead {
  ref: string;
  source: string;
  name: string;
  phone: string;
  email: string;
  answers: LeadAnswer[];
  rating: LeadRating | null;
}

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/**
 * Validates an untrusted request body. Over-long values are truncated rather
 * than rejected — a clipped answer is still a lead, a 400 is a lost one.
 * Returns null when the body is not a usable application.
 */
export function parseLead(input: unknown): NewLead | null {
  if (!input || typeof input !== "object") return null;
  const o = input as Record<string, unknown>;

  const ref = clean(o.ref, 12).toUpperCase();
  const name = clean(o.name, 120);
  const phone = clean(o.phone, 24);
  const email = clean(o.email, 200).toLowerCase();
  const answers = (Array.isArray(o.answers) ? o.answers.slice(0, 30) : [])
    .map((a) => {
      const id = clean(a?.id, 40);
      return { ...(id ? { id } : {}), label: clean(a?.label, 200), value: clean(a?.value, 1000) };
    })
    .filter((a) => a.label && a.value);

  if (
    !/^[A-Z0-9]{6,12}$/.test(ref) ||
    !name ||
    phone.replace(/\D/g, "").length < 8 ||
    !/^\S+@\S+\.\S+$/.test(email) ||
    answers.length === 0
  ) {
    return null;
  }

  return { ref, source: clean(o.source, 40) || "unknown", name, phone, email, answers, rating: rateLead(answers) };
}

/**
 * Idempotent on `ref`: a retried or doubled submit does not create a second
 * row. Returns whether this call stored the lead, so the caller notifies the
 * team once rather than once per retry.
 */
export async function saveLead({ rating, ...lead }: NewLead): Promise<boolean> {
  const stored = await db()
    .insert(leads)
    .values({
      ...lead,
      temperature: rating?.temperature,
      score: rating?.score,
      scoreReasons: rating?.reasons,
    })
    .onConflictDoNothing({ target: leads.ref })
    .returning({ id: leads.id });
  return stored.length > 0;
}

export async function listLeads(opts?: {
  q?: string;
  status?: LeadStatus | "";
  temperature?: LeadTemperature | "";
  limit?: number;
  offset?: number;
}) {
  const q = opts?.q?.trim();
  const where = and(
    opts?.status ? eq(leads.status, opts.status) : undefined,
    opts?.temperature ? eq(leads.temperature, opts.temperature) : undefined,
    q
      ? or(
          ilike(leads.name, `%${q}%`),
          ilike(leads.phone, `%${q}%`),
          ilike(leads.email, `%${q}%`),
          ilike(leads.ref, `%${q}%`)
        )
      : undefined
  );

  const [rows, totals] = await Promise.all([
    db()
      .select()
      .from(leads)
      .where(where)
      .orderBy(desc(leads.createdAt))
      .limit(opts?.limit ?? 50)
      .offset(opts?.offset ?? 0),
    db().select({ n: sql<number>`count(*)::int` }).from(leads).where(where),
  ]);

  return { leads: rows, total: totals[0].n };
}

/** Lead counts for the 1-to-1 screen: per pipeline stage, per rating, overall, and new arrivals this week. */
export async function leadStats() {
  const rows = await db()
    .select({
      status: leads.status,
      temperature: leads.temperature,
      n: sql<number>`count(*)::int`,
      recent: sql<number>`count(*) filter (where ${leads.createdAt} > now() - interval '7 days')::int`,
    })
    .from(leads)
    .groupBy(leads.status, leads.temperature);

  const byStatus: Record<string, number> = {};
  const byTemperature: Record<string, number> = {};
  let hotToContact = 0;
  for (const r of rows) {
    byStatus[r.status] = (byStatus[r.status] ?? 0) + r.n;
    if (r.temperature) byTemperature[r.temperature] = (byTemperature[r.temperature] ?? 0) + r.n;
    if (r.status === "new" && r.temperature === "hot") hotToContact += r.n;
  }
  return {
    byStatus,
    byTemperature,
    hotToContact,
    total: rows.reduce((sum, r) => sum + r.n, 0),
    last7Days: rows.reduce((sum, r) => sum + r.recent, 0),
  };
}

export async function updateLeadFollowUp(
  id: string,
  status: LeadStatus,
  temperature: LeadTemperature | null,
  summary: string,
  by: string
) {
  await db()
    .update(leads)
    .set({ status, temperature, summary: summary || null, updatedAt: new Date(), updatedBy: by })
    .where(eq(leads.id, id));
}

/**
 * Rates the leads saved before rating existed. Leads the rules can't rate keep
 * a null temperature and are looked at again on the next run, which is harmless.
 * Run once after migration 0014: `npx tsx scripts/rate-leads.mts`.
 */
export async function rateUnratedLeads() {
  const rows = await db()
    .select({ id: leads.id, answers: leads.answers })
    .from(leads)
    .where(isNull(leads.score));
  let rated = 0;
  for (const row of rows) {
    const rating = rateLead(row.answers);
    if (!rating) continue;
    await db()
      .update(leads)
      .set({ temperature: rating.temperature, score: rating.score, scoreReasons: rating.reasons })
      .where(eq(leads.id, row.id));
    rated++;
  }
  return { checked: rows.length, rated };
}
