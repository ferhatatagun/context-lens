import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const SITE = "https://context-lens-sigma.vercel.app";
const TITLE = "context-lens — see a Claude prompt before you ship it";
const DESCRIPTION =
  "Paste a Claude prompt — see how it tokenizes, where caching boundaries are, and what each call will cost. Pre-flight token visualization, browser-only, BYOK.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: TITLE,
    template: "%s · context-lens",
  },
  description: DESCRIPTION,
  applicationName: "context-lens",
  keywords: [
    "Claude tokens",
    "count_tokens",
    "prompt analysis",
    "context window",
    "prompt caching",
    "Anthropic API",
    "token counter",
    "prompt cost",
    "LLM observability",
    "BYOK",
    "developer tool",
    "Ferhat Atagun",
  ],
  authors: [{ name: "Ferhat Atagün", url: "https://ferhatatagun.com" }],
  creator: "Ferhat Atagün",
  publisher: "Ferhat Atagün",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE,
    siteName: "context-lens",
    title: TITLE,
    description:
      "Token breakdown, context-window position, prompt-caching boundaries, cost estimate — all on a paste.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: "@ferhatatagun",
    creator: "@ferhatatagun",
    title: TITLE,
    description: "Tokens, caching boundaries, cost — all on a paste. BYOK.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  category: "developer tools",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": "https://ferhatatagun.com/#person",
      name: "Ferhat Atagün",
      url: "https://ferhatatagun.com",
      jobTitle: "Frontend Team Lead",
      worksFor: { "@type": "Organization", name: "HangiKredi", url: "https://www.hangikredi.com" },
      sameAs: [
        "https://github.com/ferhatatagun",
        "https://www.linkedin.com/in/ferhatatagun/",
        "https://twitter.com/ferhatatagun",
        "https://medium.com/@ferhatatagun",
        "https://stackoverflow.com/users/20566734/",
      ],
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE}/#app`,
      name: "context-lens",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Any (web browser)",
      description: DESCRIPTION,
      url: SITE,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      author: { "@id": "https://ferhatatagun.com/#person" },
      creator: { "@id": "https://ferhatatagun.com/#person" },
      isPartOf: {
        "@type": "CollectionPage",
        "@id": "https://ferhatatagun.com/tools#suite",
        name: "Open-source Claude dev-tools",
        url: "https://ferhatatagun.com/tools",
      },
      softwareHelp: { "@type": "WebPage", url: "https://ferhatatagun.com/blog/see-the-prompt-before-you-ship-it" },
      keywords: "Claude tokens, count_tokens, prompt cost, context window",
    },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <link rel="author" href="https://ferhatatagun.com" />
        <link rel="me" href="https://ferhatatagun.com" />
        <link rel="me" href="https://github.com/ferhatatagun" />
      </head>
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
