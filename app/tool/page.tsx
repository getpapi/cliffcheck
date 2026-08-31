/**
 * /tool — legacy route. The calculator now lives on the home page (/), so this
 * redirects there. The redirect target has no fragment, so the browser preserves
 * the shared-scenario hash: /tool#<scenario> → /#<scenario>.
 */
import { redirect } from "next/navigation";

export default function ToolRedirect() {
  redirect("/");
}
