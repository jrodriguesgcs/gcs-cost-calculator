import type { Metadata } from "next";
import { Heebo, Yrsa } from "next/font/google";
import "./globals.css";

// GCS Design System fonts (see gcsdesignsystemreference.md §2.1). Loaded via
// next/font/google, which self-hosts at build time — no runtime request to
// Google, unlike the source design system repo's own current live @import.
const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const yrsa = Yrsa({
  variable: "--font-yrsa",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "GCS Cost Calculator",
  description: "Internal Global Citizen Solutions tool",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${heebo.variable} ${yrsa.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
