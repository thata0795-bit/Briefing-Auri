// Runs every 15 minutes (UTC) and sends WhatsApp reminders that are due:
// 48h and 24h before each meeting or filming, and new released scripts.
import { store, runDue } from "../lib/core.mjs";

export default async () => {
  const result = await runDue(store());
  console.log("reminders", JSON.stringify(result));
};

export const config = { schedule: "*/15 * * * *" };
