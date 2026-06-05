import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const SITE = "https://context-lens.vercel.app";
const DESCRIPTION =
  "Paste a Claude prompt — see how it tokenizes, where caching boundaries are, and what each call will cost. Pre-flight token visualization, browser-only, BYOK.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "context-lens — see a Claude prompt before you ship it",
    template: "%s · context-lens",
  },
  description: DESCRIPTION,
  applicationName: "context-lens",
  keywords: [
    "Claude tokens",
    "prompt analysis",
    "context window",
    "prompt caching",
    "Anthropic API",
    "token counter",
    "BYOK",
    "AI developer tools",
    "Anthropic",
    "LLM observability",
  ],
  authors: [{ name: "Ferhat Atagün", url: "https://ferhatatagun.com" }],
  creator: "Ferhat Atagün",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE,
    siteName: "context-lens",
    title: "context-lens — see a Claude prompt before you ship it",
    description:
      "Token breakdown, context-window position, prompt-caching boundaries, cost estimate — all on a paste.",
  },
  twitter: {
    card: "summary_large_image",
    title: "context-lens — see a Claude prompt before you ship it",
    description: "Tokens, caching boundaries, cost — all on a paste. BYOK.",
    creator: "@ferhatatagun",
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "context-lens",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any (web browser)",
  description: DESCRIPTION,
  url: SITE,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  author: { "@type": "Person", name: "Ferhat Atagün", url: "https://ferhatatagun.com" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
