"use client";

/**
 * ManagerBrief — the shareable negotiation artifact (DESIGN.md Manager Brief,
 * DESIGN-DIRECTION.md §13). Cream artifact card, copy-to-clipboard, real
 * negotiation-ready sentences in the v1 three-line format. NEVER empty — when
 * there's no cliff, the brief says the raise genuinely improves total pay.
 *
 * The brief is the differentiator: it turns "here's your cliff" into "here's
 * what to send your manager." Voice follows PRODUCT.md — name the system, plain
 * first, agency-forward ("here's the number I need").
 */
import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import type { Profile } from "@/lib/profile-url";
import { encodeProfileHash } from "@/lib/profile-url";
import type { DerivedResults } from "./derive";
import { fmtDollars } from "./derive";
import { Button } from "@/components/ui/button";
import { B2BLeadCapture } from "./B2BLeadCapture";

export function ManagerBrief({
  profile,
  results,
}: {
  profile: Profile;
  results: DerivedResults;
}) {
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const { current, offered, diff, isWorse, safeExit, currentBenefitValue } =
    results;

  const matchSuffix =
    profile.matchRate > 0
      ? `, including a ${profile.matchRate}% employer 401(k) match (${fmtDollars(
          offered.matchValue
        )}/yr at the offered salary)`
      : "";
  const totalMagiReduction =
    profile.hsaContribution + profile.pretax401k + profile.dependentCareFsa;
  const magiSuffix =
    totalMagiReduction > 0
      ? `. Note: ${fmtDollars(
          totalMagiReduction
        )}/yr in pre-tax contributions (HSA/401k/dependent-care FSA) lower taxable income, which affects ACA savings and Medicaid in this model`
      : "";

  const line1 = `Currently earning ${fmtDollars(
    profile.currentIncome
  )}/yr with ${fmtDollars(
    Math.abs(currentBenefitValue)
  )} in annual benefit value, ${fmtDollars(
    current.totalEffective
  )} total effective${matchSuffix}${magiSuffix}`;

  const line2 = isWorse
    ? `The ${fmtDollars(profile.offeredIncome)} offer would give ${fmtDollars(
        offered.totalEffective
      )} total effective, that's ${fmtDollars(
        Math.abs(diff)
      )} less than today`
    : `The ${fmtDollars(profile.offeredIncome)} offer would give ${fmtDollars(
        offered.totalEffective
      )} total effective, ${fmtDollars(diff)} more than today`;

  const line3 = safeExit
    ? `To clear all benefit cliffs, I need ~${fmtDollars(
        safeExit
      )}/yr, that's where I permanently stay ahead`
    : `The offered income clears all benefit cliffs, so this raise genuinely improves total pay`;

  const lines = [line1, line2, line3];
  const briefText = lines.join("\n");

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(briefText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (insecure context / permissions) — the text is still
      // on screen to copy by hand. Fail quietly, no scary error.
    }
  }

  // Share the CURRENT scenario as a self-contained link. Built at click time
  // from the live profile via the same hash encoding the calculator already
  // syncs to the URL (lib/profile-url.ts) — no backend, no data egress: only the
  // scenario shape the user entered travels, exactly as it does in the URL today.
  async function handleShare() {
    const hash = encodeProfileHash(profile);
    const { origin, pathname } = window.location;
    const url = `${origin}${pathname}#${hash}`;
    const shareData = {
      title: "CliffCheck",
      text: "See what a raise would actually cost after lost benefits:",
      url,
    };

    // Native share sheet where supported (mobile-primary audience, DESIGN.md).
    const canNativeShare =
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function" &&
      (typeof navigator.canShare !== "function" || navigator.canShare(shareData));
    if (canNativeShare) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        // User dismissed the sheet — leave it, don't also copy.
        if (err instanceof DOMException && err.name === "AbortError") return;
        // Any other failure falls through to the clipboard path below.
      }
    }

    // Desktop / no-share fallback: copy the link with clear feedback.
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // Clipboard blocked (insecure context) — fail quietly.
    }
  }

  return (
    <section
      aria-label="Manager brief"
      style={{
        backgroundColor: "var(--color-surface-cream)",
        border: "1.5px solid var(--color-border-stone)",
        borderRadius: "var(--radius-xl)",
        boxShadow: "var(--elevation-card)",
        padding: "var(--space-lg)",
      }}
    >
      <div style={{ marginBottom: "var(--space-md)" }}>
        <h2
          style={{
            margin: 0,
            fontSize: "var(--type-heading)",
            fontWeight: 700,
            color: "var(--color-text-primary)",
          }}
        >
          Manager brief
        </h2>
        <p
          style={{
            margin: "4px 0 0",
            fontSize: "var(--type-caption)",
            color: "var(--color-text-muted)",
          }}
        >
          Copy and paste into a message to your manager or HR.
        </p>
      </div>

      <Button
        type="button"
        onClick={handleCopy}
        className="mb-2 h-12 w-full rounded-lg text-sm font-bold hover:bg-cta-hover-amber"
      >
        {copied ? (
          <>
            <Check aria-hidden className="size-4" /> Copied
          </>
        ) : (
          <>
            <Copy aria-hidden className="size-4" /> Copy brief
          </>
        )}
      </Button>

      <Button
        type="button"
        variant="outline"
        onClick={handleShare}
        className="mb-4 h-12 w-full rounded-lg text-sm font-semibold"
      >
        {linkCopied ? (
          <>
            <Check aria-hidden className="size-4" /> Link copied
          </>
        ) : (
          <>
            <Share2 aria-hidden className="size-4" /> Share this scenario
          </>
        )}
      </Button>

      <ol
        style={{
          margin: 0,
          padding: 0,
          listStyle: "none",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-sm)",
        }}
      >
        {lines.map((line, i) => (
          <li
            key={i}
            style={{ display: "flex", gap: "var(--space-sm)" }}
          >
            <span
              aria-hidden
              style={{
                flexShrink: 0,
                width: 20,
                height: 20,
                marginTop: 2,
                borderRadius: "999px",
                backgroundColor: "var(--color-amber-badge-bg)",
                color: "var(--color-amber-badge-text)",
                fontSize: "var(--type-caption)",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {i + 1}
            </span>
            <p
              style={{
                margin: 0,
                fontSize: "var(--type-body)",
                lineHeight: 1.6,
                color: "var(--color-text-secondary)",
              }}
            >
              {line}
            </p>
          </li>
        ))}
      </ol>

      <B2BLeadCapture />
    </section>
  );
}
