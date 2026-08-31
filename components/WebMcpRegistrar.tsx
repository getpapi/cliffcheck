"use client";

import { useEffect } from "react";
import { registerCliffCheckTools } from "@/lib/webmcp/register";

/**
 * Mounts the CliffCheck WebMCP tools on the client so an in-browser agent
 * (ChatGPT in-app browser, or Chrome with WebMCP enabled) can call the benefit
 * engine directly. Renders nothing. No-ops in browsers without WebMCP.
 *
 * Placed in the root layout so the tools are available on every route — the
 * calculator, the per-state SEO pages, and the landing page alike.
 */
export function WebMcpRegistrar() {
  useEffect(() => {
    const controller = registerCliffCheckTools();
    return () => controller?.abort();
  }, []);

  return null;
}
