import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the PDF-rendering deps as real Node dependencies rather than
  // letting Next.js try to bundle them (they ship native/binary bits).
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium"],
  // @sparticuz/chromium locates its bundled Chromium binary at runtime via
  // `path.join(__dirname, ...)`, so Next's static file-tracer never sees a
  // reference to `bin/` and drops it from the deployed function — causing
  // "input directory .../bin does not exist" on Vercel. Force it to be
  // included alongside the PDF route.
  outputFileTracingIncludes: {
    "/api/generate-pdf": ["./node_modules/@sparticuz/chromium/bin/**/*"],
  },
};

export default nextConfig;
