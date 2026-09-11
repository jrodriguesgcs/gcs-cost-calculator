// Shared password gate for this internal tool. Deliberately simple for the
// actual threat model here — one shared password keeping an internal sales
// tool off casual/opportunistic public access, not a hardened multi-user
// auth system — the same posture as the sibling b2b-ir-kpis and
// gcs-hubspot-funnel-reporting dashboards' own password gates. Adapted for
// a live Next.js app (middleware in front of real pages *and* the
// generate-pdf API route) rather than a single static HTML bundle, so
// there's no single "encrypt the whole page" payload to wrap — this uses a
// signed cookie instead.
//
// Uses the Web Crypto API (`crypto.subtle`), not Node's `crypto` module, so
// the exact same code runs unchanged in both the Edge runtime
// (middleware.ts always runs on Edge in Next.js) and the Node runtime (the
// API route).

export const AUTH_COOKIE_NAME = "gcs_cc_auth";
// 30 days, not session-only like the sibling dashboards — this is a tool
// sales reps return to throughout the workday, not a once-in-a-while
// report glance, so a longer-lived cookie is the better trade-off here.
export const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function getPassword(): string {
  const password = process.env.APP_PASSWORD;
  if (!password) {
    throw new Error("APP_PASSWORD environment variable is not set.");
  }
  return password;
}

async function hmacHex(message: string, key: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * The cookie value set once the correct password has been submitted — an
 * HMAC keyed by the real password, not the password itself, so the cookie
 * never carries the plaintext password around (defense in depth on top of
 * it already being HttpOnly).
 */
export async function computeAuthToken(): Promise<string> {
  return hmacHex("gcs-cost-calculator-authenticated", getPassword());
}

export async function isValidAuthToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  return token === (await computeAuthToken());
}

export function isCorrectPassword(candidate: string): boolean {
  return candidate === getPassword();
}
