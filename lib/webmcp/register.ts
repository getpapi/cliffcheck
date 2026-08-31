/**
 * lib/webmcp/register.ts — client-side registration of the CliffCheck WebMCP
 * tools with the browser's `document.modelContext`.
 *
 * This is the ONLY module in lib/webmcp that touches the DOM. It is a no-op in
 * any browser without WebMCP (the API is behind a Chrome origin trial / flag),
 * so it is safe to call unconditionally on mount.
 */

import { buildTools } from "./tools";

/**
 * Register every CliffCheck tool. Returns an AbortController; call `.abort()` to
 * unregister them all (in-flight executions are allowed to finish). Returns null
 * when WebMCP is unavailable.
 */
export function registerCliffCheckTools(): AbortController | null {
  if (typeof document === "undefined" || !document.modelContext) return null;

  const controller = new AbortController();
  const tools = buildTools();

  for (const tool of tools) {
    document.modelContext
      .registerTool(tool, { signal: controller.signal })
      .catch((err: unknown) => {
        // Registration is best-effort — a spec revision or a duplicate name
        // should not break the page. Log and move on.
        console.warn(`[CliffCheck WebMCP] failed to register "${tool.name}":`, err);
      });
  }

  return controller;
}
