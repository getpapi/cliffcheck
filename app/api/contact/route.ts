/**
 * POST /api/contact — inbound "get in touch" messages from the footer form.
 *
 * Delivers via Resend, sending FROM the already-verified getpapi.ai domain
 * (CONTACT_FROM) TO the owner inbox (CONTACT_TO). No new Resend domain is
 * needed, so this stays on the existing plan. The reply-to is set to the
 * sender's address so a reply goes straight back to them.
 *
 * Env:
 *   RESEND_API_KEY  — Resend API key (shared with getpapi.ai)
 *   CONTACT_TO      — owner inbox (default cathal@getpapi.ai)
 *   CONTACT_FROM    — verified sender (default CliffCheck <noreply@getpapi.ai>)
 */
import { Resend } from "resend";

export const runtime = "nodejs";

const CONTACT_TO = process.env.CONTACT_TO ?? "cathal@getpapi.ai";
const CONTACT_FROM = process.env.CONTACT_FROM ?? "CliffCheck <noreply@getpapi.ai>";

const MAX = { name: 120, email: 200, org: 160, message: 4000, role: 40, source: 60 } as const;

// Allowed B2B lead roles — anything else is coerced to "other" so the emailed
// body can never carry arbitrary attacker-controlled label text.
const ROLES = new Set(["counselor", "employer", "nonprofit", "other"]);

// Basic per-IP in-memory rate limit. Best-effort only: Fluid Compute may run
// multiple instances so the window is per-instance, but it blunts a naive flood
// of this public POST without adding infra. Sliding window: MAX_HITS per WINDOW_MS.
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_HITS = 5;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  // Opportunistic cleanup so the map does not grow unbounded.
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
    }
  }
  return recent.length > MAX_HITS;
}

function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function clean(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function escapeHtml(v: string): string {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(request: Request) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return Response.json(
      { error: "Contact is not configured yet. Please try again later." },
      { status: 503 }
    );
  }

  if (rateLimited(clientIp(request))) {
    return Response.json(
      { error: "Too many requests. Please try again in a few minutes." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const data = body as Record<string, unknown>;

  // Honeypot: bots fill hidden fields, humans never see them.
  if (clean(data.company_website, 200)) {
    return Response.json({ ok: true });
  }

  const name = clean(data.name, MAX.name);
  const email = clean(data.email, MAX.email);
  const org = clean(data.org, MAX.org);
  const message = clean(data.message, MAX.message);
  // B2B lead capture (manager-brief CTA): role from a fixed allow-list, and a
  // source tag so leads are triageable. role/source carry NO financial or
  // calculator state — email + role only, per AD-8.
  const rawRole = clean(data.role, MAX.role).toLowerCase();
  const role = rawRole ? (ROLES.has(rawRole) ? rawRole : "other") : "";
  const source = clean(data.source, MAX.source);

  if (!email || !isEmail(email)) {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  // A submission is valid with either a free-text message (footer form) or a
  // role (B2B lead form) — one of the two must be present.
  if (!message && !role) {
    return Response.json({ error: "Add a short message." }, { status: 400 });
  }

  const isB2B = source === "manager-brief-b2b" || (!!role && !message);
  const subject = isB2B
    ? `CliffCheck B2B lead${role ? ` (${role})` : ""}`
    : `CliffCheck contact${org ? ` from ${org}` : ""}${name ? ` (${name})` : ""}`;
  const header: string[] = [];
  if (name) header.push(`Name: ${name}`);
  header.push(`Email: ${email}`);
  if (org) header.push(`Org: ${org}`);
  if (role) header.push(`Role: ${role}`);
  if (source) header.push(`Source: ${source}`);
  const lines = [...header, "", message || `B2B tool request from a ${role}.`];

  try {
    const resend = new Resend(key);
    const { error } = await resend.emails.send({
      from: CONTACT_FROM,
      to: CONTACT_TO,
      replyTo: email,
      subject,
      text: lines.join("\n"),
      html: `<pre style="font:14px/1.6 ui-monospace,monospace;white-space:pre-wrap">${escapeHtml(
        lines.join("\n")
      )}</pre>`,
    });
    if (error) {
      return Response.json({ error: "Could not send. Please try again." }, { status: 502 });
    }
  } catch {
    return Response.json({ error: "Could not send. Please try again." }, { status: 502 });
  }

  return Response.json({ ok: true });
}
