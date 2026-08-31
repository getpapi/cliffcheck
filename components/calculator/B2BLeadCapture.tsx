"use client";

/**
 * B2BLeadCapture — the AD-8 B2B beachhead intake, shown at the manager-brief
 * moment (the value peak). A quiet opt-in CTA that expands into a tiny form:
 * work email + role only. Posts to /api/contact with source "manager-brief-b2b".
 *
 * PRIVACY SPINE (AD-8): captures email + role ONLY. It NEVER receives or sends
 * the user's profile / financial inputs — the component takes no such props, so
 * there is nothing to leak. Opt-in, no gating of the free tool. A hidden honeypot
 * (company_website) + the route's rate limit blunt bots. Voice/tokens per
 * PRODUCT.md / DESIGN.md (no em-dash, design tokens only).
 */
import { useId, useState } from "react";

type Status = "idle" | "sending" | "sent" | "error";

const ROLES: Array<{ value: string; label: string }> = [
  { value: "counselor", label: "Benefits counselor / caseworker" },
  { value: "employer", label: "Employer / HR" },
  { value: "nonprofit", label: "Nonprofit / community org" },
  { value: "other", label: "Something else" },
];

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "var(--type-subheading)",
  fontWeight: 600,
  color: "var(--color-text-secondary)",
  marginBottom: "6px",
};

const controlStyle: React.CSSProperties = {
  width: "100%",
  padding: "0 12px",
  height: 48,
  backgroundColor: "var(--color-surface-white)",
  border: "1px solid var(--color-border-stone)",
  borderRadius: "var(--radius-lg)",
  color: "var(--color-text-primary)",
  fontSize: "16px",
  fontFamily: "var(--font-sans)",
};

export function B2BLeadCapture() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const emailId = useId();
  const roleId = useId();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;
    const form = e.currentTarget;
    const fd = new FormData(form);
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: fd.get("email"),
          role: fd.get("role"),
          source: "manager-brief-b2b",
          company_website: fd.get("company_website"),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setStatus("error");
        setError(data.error ?? "Could not send. Please try again.");
        return;
      }
      setStatus("sent");
      form.reset();
    } catch {
      setStatus("error");
      setError("Could not send. Please check your connection and try again.");
    }
  }

  if (status === "sent") {
    return (
      <p
        style={{
          margin: "var(--space-md) 0 0",
          fontSize: "var(--type-caption)",
          lineHeight: 1.6,
          color: "var(--color-text-secondary)",
        }}
      >
        Thanks. We&rsquo;ll be in touch about bringing CliffCheck to your team.
      </p>
    );
  }

  return (
    <div style={{ marginTop: "var(--space-md)" }}>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            minHeight: 44,
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            textAlign: "left",
            fontSize: "var(--type-caption)",
            fontWeight: 600,
            color: "var(--color-text-muted)",
            fontFamily: "var(--font-sans)",
            textDecoration: "underline",
            textUnderlineOffset: "3px",
          }}
        >
          Are you a counselor or employer? Get CliffCheck for your team
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}
        >
          {/* Honeypot — hidden from humans, tempting to bots. */}
          <div aria-hidden="true" style={{ position: "absolute", left: "-9999px" }}>
            <label htmlFor="company_website">Company website</label>
            <input
              id="company_website"
              name="company_website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <div>
            <label htmlFor={emailId} style={labelStyle}>
              Work email
            </label>
            <input
              id={emailId}
              name="email"
              type="email"
              required
              autoComplete="email"
              style={controlStyle}
            />
          </div>

          <div>
            <label htmlFor={roleId} style={labelStyle}>
              Your role
            </label>
            <select id={roleId} name="role" defaultValue="counselor" style={controlStyle}>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {status === "error" && (
            <p
              role="alert"
              style={{
                margin: 0,
                fontSize: "var(--type-caption)",
                color: "var(--color-negative-delta)",
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={status === "sending"}
            style={{
              minHeight: 48,
              padding: "0 var(--space-lg)",
              borderRadius: "var(--radius-lg)",
              border: "none",
              backgroundColor: "var(--color-brand-amber)",
              color: "var(--color-text-primary)",
              fontSize: "var(--type-subheading)",
              fontWeight: 700,
              cursor: status === "sending" ? "default" : "pointer",
              opacity: status === "sending" ? 0.7 : 1,
            }}
          >
            {status === "sending" ? "Sending…" : "Request team access"}
          </button>
          <p
            style={{
              margin: 0,
              fontSize: "var(--type-caption)",
              color: "var(--color-text-muted)",
              lineHeight: 1.5,
            }}
          >
            Email and role only. We never see or store the numbers you entered.
          </p>
        </form>
      )}
    </div>
  );
}
