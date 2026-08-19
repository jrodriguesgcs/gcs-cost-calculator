// HTTP header values (Content-Disposition included) are only reliably
// ASCII — a raw non-ASCII character (e.g. "ã" in "João") can get mangled by
// whatever saves the file downstream (browser/OS filename sanitizer), and
// in practice that same sanitizer pass can strip otherwise-safe characters
// like hyphens too. Normalize to ASCII ourselves so the filename we hand
// back is never at the mercy of that.
export function toAsciiFilenameSegment(value: string, fallback: string = "File"): string {
  const ascii = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip combining diacritics: João -> Joao
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^A-Za-z0-9-]/g, ""); // drop anything else unsafe in a filename/header

  return ascii || fallback;
}
