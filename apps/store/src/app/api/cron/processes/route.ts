import { readdirSync, readFileSync } from "node:fs";
import { cpus } from "node:os";
import { NextResponse } from "next/server";

/**
 * What is using the hosting account's process limit. Hostinger counts every
 * process and thread of the account against "Max Processes", and the account
 * sits near the cap, so a deploy leaves no room for the new build to start.
 * This lists the account's processes (all CageFS lets the app see) with their
 * thread counts. Read-only; protected by CRON_SECRET like the reconcile job.
 *
 * ponytail: diagnostic for the process-cap investigation of 2026-10-29 —
 * delete once the cause is fixed.
 */

export const dynamic = "force-dynamic";

function authorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret) && req.headers.get("authorization") === `Bearer ${secret}`;
}

const read = (path: string) => {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return "";
  }
};

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let pids: string[] = [];
  try {
    pids = readdirSync("/proc").filter((p) => /^\d+$/.test(p));
  } catch {
    return NextResponse.json({ error: "No /proc here" }, { status: 501 });
  }

  const processes = pids
    .map((pid) => {
      const status = read(`/proc/${pid}/status`);
      const field = (name: string) => status.match(new RegExp(`^${name}:\\s*(.+)$`, "m"))?.[1]?.trim() ?? "";
      // Only the program and its first argument: later arguments could carry configuration.
      const cmd = read(`/proc/${pid}/cmdline`).split("\0").filter(Boolean).slice(0, 2).join(" ").slice(0, 120);
      // Thread names show which runtime owns them (tokio-runtime-w, rayon, V8 Worker, libuv-worker…).
      const threadNames: Record<string, number> = {};
      try {
        for (const tid of readdirSync(`/proc/${pid}/task`)) {
          const name = read(`/proc/${pid}/task/${tid}/comm`).trim().replace(/\d+$/, "#") || "?";
          threadNames[name] = (threadNames[name] ?? 0) + 1;
        }
      } catch {
        // The process ended while being read.
      }
      return {
        pid: Number(pid),
        ppid: Number(field("PPid")),
        name: field("Name"),
        threads: Number(field("Threads")) || 1,
        rssMb: Math.round((parseInt(field("VmRSS")) || 0) / 1024),
        cmd,
        threadNames,
      };
    })
    .filter((p) => p.name);

  return NextResponse.json({
    self: process.pid,
    hostCpus: cpus().length,
    caps: {
      UV_THREADPOOL_SIZE: process.env.UV_THREADPOOL_SIZE ?? null,
      RAYON_NUM_THREADS: process.env.RAYON_NUM_THREADS ?? null,
      TOKIO_WORKER_THREADS: process.env.TOKIO_WORKER_THREADS ?? null,
    },
    processCount: processes.length,
    threadTotal: processes.reduce((n, p) => n + p.threads, 0),
    processes: processes.sort((a, b) => b.threads - a.threads),
  });
}
