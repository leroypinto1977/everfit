// Rate the 1-to-1 leads saved before rating existed (migration 0014).
// DATABASE_URL must be passed explicitly, so it is never the wrong database by accident:
//   DATABASE_URL=<url> npx tsx scripts/rate-leads.mts
import { rateUnratedLeads } from "../packages/core/src/lib/leads";

const { checked, rated } = await rateUnratedLeads();
console.log(`Checked ${checked} unrated leads, rated ${rated}.`);
process.exit(0);
