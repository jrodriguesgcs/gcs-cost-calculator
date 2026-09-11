"use client";

import { useRef, useState } from "react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        setError("Wrong password.");
        passwordInputRef.current?.focus();
        passwordInputRef.current?.select();
        return;
      }

      // Return to whatever page the middleware redirected the visitor from.
      const from = new URLSearchParams(window.location.search).get("from");
      window.location.href = from && from.startsWith("/") ? from : "/";
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-10">
      <div className="w-full max-w-sm rounded-none border border-border bg-white p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <img src="/letterhead/GCS-Symbol-Blue.svg" alt="Global Citizen Solutions" width={36} height={36.5} />
          <h1 className="font-serif text-2xl font-normal text-foreground">Password Required</h1>
          <p className="text-sm text-foreground-secondary">Internal Global Citizen Solutions tool.</p>
        </div>

        <form className="mt-6" onSubmit={handleSubmit}>
          <label htmlFor="password" className="block text-sm font-medium text-foreground-secondary">
            Password
          </label>
          <input
            id="password"
            ref={passwordInputRef}
            type="password"
            autoFocus
            autoComplete="current-password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              if (error) setError(null);
            }}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? "password-error" : undefined}
            className={`mt-1 w-full rounded-none border px-4 py-3 text-sm focus:outline-none focus:ring-[3px] ${
              error
                ? "border-destructive focus:border-destructive focus:ring-destructive/35"
                : "border-border focus:border-ring focus:ring-accent/35"
            }`}
          />
          {error && (
            <p id="password-error" className="mt-1 text-xs text-destructive">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-none bg-primary px-4 text-sm font-medium uppercase tracking-[0.02em] text-white hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <span
                  aria-hidden="true"
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                />
                Checking…
              </>
            ) : (
              "Enter"
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
