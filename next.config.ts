import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the PDF-rendering deps as real Node dependencies rather than
  // letting Next.js try to bundle them (they ship native/binary bits).
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium"],
};

export default nextConfig;
