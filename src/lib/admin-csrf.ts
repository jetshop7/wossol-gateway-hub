export function readCsrfToken() {
  return document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("wossol_export_csrf="))
    ?.slice("wossol_export_csrf=".length);
}
