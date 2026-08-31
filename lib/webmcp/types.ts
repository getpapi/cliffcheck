/**
 * lib/webmcp/types.ts — minimal ambient typing for the WebMCP browser API.
 *
 * WebMCP (https://webmachinelearning.github.io/webmcp/, Chrome 149+ origin
 * trial) exposes `window.document.modelContext`. It is not yet in the TS DOM
 * lib, so we declare the slice we use. Keep this narrow — widen only when a
 * tool needs more of the surface.
 */

/** JSON Schema fragment for a tool's input. Loose on purpose — the spec takes
 *  any valid JSON Schema object. */
export interface WebMcpInputSchema {
  type: "object";
  properties: Record<string, unknown>;
  required?: string[];
}

/** A tool definition passed to `document.modelContext.registerTool`. */
export interface WebMcpTool {
  name: string;
  description: string;
  inputSchema: WebMcpInputSchema;
  /** Runs in-page when an agent invokes the tool. Must return a string
   *  (we return JSON-encoded results). `signal` aborts long work. */
  execute: (args: Record<string, unknown>, ctx: { signal: AbortSignal }) => Promise<string>;
  annotations?: {
    /** No side effects — safe for an agent to call speculatively. */
    readOnlyHint?: boolean;
    /** Output is derived from page data, not user-authored prose. */
    untrustedContentHint?: boolean;
  };
}

interface ModelContext {
  registerTool: (tool: WebMcpTool, options?: { signal?: AbortSignal }) => Promise<void>;
  getTools?: () => Promise<WebMcpTool[]>;
}

declare global {
  interface Document {
    modelContext?: ModelContext;
  }
}

export {};
