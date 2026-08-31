"use client";

/**
 * ContactModal — the footer "Have an idea? Get in touch" surface. Renders a
 * quiet footer trigger link (styled to match the other footer links) that opens
 * a warm, phone-first modal with a short form: name (optional), email, org
 * (optional), message. Posts to /api/contact, which relays via Resend.
 *
 * Voice per PRODUCT.md: warm, direct, no em-dash. Design tokens only (globals.css).
 * The modal traps nothing exotic — Escape closes, backdrop click closes, focus
 * lands on the first field. A hidden honeypot field (company_website) catches bots.
 */
import { useEffect, useId, useRef, useState } from "react";

type Status = "idle" | "sending" | "sent" | "error";

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

export function ContactModal() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const firstFieldRef = useRef<HTMLInputElement>(null);

  const nameId = useId();
  const emailId = useId();
  const orgId = useId();
  const messageId = useId();
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    firstFieldRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  function close() {
    setOpen(false);
    // Reset a moment later so the closing modal doesn't flash the idle state.
    setTimeout(() => {
      setStatus("idle");
      setError("");
    }, 200);
  }

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
          name: fd.get("name"),
          email: fd.get("email"),
          org: fd.get("org"),
          message: fd.get("message"),
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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cc-footer-link"
        style={{
          display: "inline-flex",
          alignItems: "center",
          minHeight: 44,
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          fontSize: "var(--type-caption)",
          fontWeight: 600,
          color: "var(--color-text-muted)",
          fontFamily: "var(--font-sans)",
        }}
      >
        Have an idea? Get in touch
      </button>

      {open && (
        <div
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close();
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            padding: "var(--space-md)",
            backgroundColor: "rgba(28, 25, 23, 0.45)",
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            style={{
              width: "100%",
              maxWidth: 480,
              maxHeight: "90vh",
              overflowY: "auto",
              backgroundColor: "var(--color-surface-white)",
              border: "1px solid var(--color-border-stone)",
              borderRadius: "var(--radius-lg)",
              padding: "var(--space-lg)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "var(--space-md)",
                marginBottom: "var(--space-sm)",
              }}
            >
              <h2
                id={titleId}
                style={{
                  margin: 0,
                  fontSize: "var(--type-heading)",
                  fontWeight: 700,
                  color: "var(--color-text-primary)",
                }}
              >
                Get in touch
              </h2>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                style={{
                  flexShrink: 0,
                  width: 40,
                  height: 40,
                  marginTop: -4,
                  marginRight: -8,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "20px",
                  lineHeight: 1,
                  color: "var(--color-text-muted)",
                }}
              >
                ✕
              </button>
            </div>

            {status === "sent" ? (
              <div style={{ paddingTop: "var(--space-sm)" }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: "var(--type-body)",
                    lineHeight: 1.6,
                    color: "var(--color-text-secondary)",
                  }}
                >
                  Thank you. Your message is on its way and I read every one. If it
                  needs a reply, I&rsquo;ll get back to you at the email you gave.
                </p>
                <button
                  type="button"
                  onClick={close}
                  style={{
                    minHeight: 48,
                    marginTop: "var(--space-lg)",
                    padding: "0 var(--space-lg)",
                    borderRadius: "var(--radius-lg)",
                    border: "none",
                    backgroundColor: "var(--color-brand-amber)",
                    color: "var(--color-text-primary)",
                    fontSize: "var(--type-subheading)",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <p
                  style={{
                    margin: "0 0 var(--space-md)",
                    fontSize: "var(--type-body)",
                    lineHeight: 1.55,
                    color: "var(--color-text-secondary)",
                  }}
                >
                  Ideas, a state you want covered, or want to put CliffCheck in front
                  of your people? Send a note. It comes straight to me.
                </p>

                <form
                  onSubmit={handleSubmit}
                  style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}
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
                    <label htmlFor={nameId} style={labelStyle}>
                      Name <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(optional)</span>
                    </label>
                    <input
                      ref={firstFieldRef}
                      id={nameId}
                      name="name"
                      type="text"
                      autoComplete="name"
                      style={controlStyle}
                    />
                  </div>

                  <div>
                    <label htmlFor={emailId} style={labelStyle}>
                      Email
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
                    <label htmlFor={orgId} style={labelStyle}>
                      Organisation <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(optional)</span>
                    </label>
                    <input
                      id={orgId}
                      name="org"
                      type="text"
                      autoComplete="organization"
                      style={controlStyle}
                    />
                  </div>

                  <div>
                    <label htmlFor={messageId} style={labelStyle}>
                      Message
                    </label>
                    <textarea
                      id={messageId}
                      name="message"
                      required
                      rows={4}
                      style={{
                        ...controlStyle,
                        height: "auto",
                        padding: "12px",
                        resize: "vertical",
                        lineHeight: 1.5,
                      }}
                    />
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
                    {status === "sending" ? "Sending…" : "Send message"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
