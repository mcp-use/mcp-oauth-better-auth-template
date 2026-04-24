import type { ReactElement } from "react";
import { renderToString } from "react-dom/server";

export function renderPage(element: ReactElement): string {
  return "<!DOCTYPE html>" + renderToString(element);
}

/**
 * JSON.stringify a value for safe interpolation into an inline <script>.
 * Escapes characters that could terminate the script tag (e.g. `</script>`)
 * or be read as HTML entities by the browser parser.
 */
export function safeJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}
