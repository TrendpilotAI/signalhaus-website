import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import MicrosoftClarity from "@/components/MicrosoftClarity";
import LinkedInInsight from "@/components/LinkedInInsight";
import JsonLd from "@/components/JsonLd";

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://www.signalhaus.ai/#organization",
  name: "SignalHaus",
  alternateName: "SignalHaus AI",
  url: "https://www.signalhaus.ai",
  logo: {
    "@type": "ImageObject",
    url: "https://www.signalhaus.ai/logo.png",
    width: 200,
    height: 60,
  },
  description:
    "SignalHaus builds custom AI automations, data integrations, and intelligent agents for growth-stage B2B companies. Founded by Nathan Stevenson.",
  founder: {
    "@type": "Person",
    name: "Nathan Stevenson",
    jobTitle: "Founder & CEO",
    url: "https://www.signalhaus.ai/about",
  },
  foundingDate: "2023",
  areaServed: { "@type": "Country", name: "United States" },
  address: {
    "@type": "PostalAddress",
    addressLocality: "Fort Lauderdale",
    addressRegion: "FL",
    addressCountry: "US",
  },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "sales",
    email: "hello@signalhaus.ai",
    url: "https://www.signalhaus.ai/contact",
  },
  sameAs: [
    "https://www.linkedin.com/company/signalhaus",
  ],
  award: [
    "AI Hot 100",
    "WealthTech 100",
    "AI Fintech 100",
    "KPMG Top 50 Fintechs",
    "World Economic Forum Technology Pioneer",
  ],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://www.signalhaus.ai/#website",
  url: "https://www.signalhaus.ai",
  name: "SignalHaus",
  publisher: { "@id": "https://www.signalhaus.ai/#organization" },
  potentialAction: {
    "@type": "SearchAction",
    target: "https://www.signalhaus.ai/blog?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  metadataBase: new URL("https://www.signalhaus.ai"),
  title: {
    default: "SignalHaus — AI Automation for B2B Revenue Teams",
    template: "%s | SignalHaus",
  },
  description:
    "SignalHaus builds custom AI automations, data integrations, and intelligent agents for growth-stage B2B companies. Ship AI that drives revenue — in 30 days, not 6 months.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.signalhaus.ai",
    siteName: "SignalHaus",
<<<<<<< HEAD
    title: "SignalHaus — AI Automation & Data Integration for B2B Revenue Teams",
    description:
      "SignalHaus builds custom AI automations, data integrations, and intelligent agents for growth-stage B2B companies.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "SignalHaus — AI Automation for B2B Revenue Teams" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SignalHaus — AI Automation for B2B Revenue Teams",
    description:
      "Custom AI automations, data integrations, and intelligent agents for growth-stage B2B companies.",
    images: ["/og-image.png"],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "https://www.signalhaus.ai" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <JsonLd data={organizationSchema} />
        <JsonLd data={websiteSchema} />
        <link
          rel="alternate"
          type="application/rss+xml"
          title="SignalHaus Blog RSS Feed"
          href="https://www.signalhaus.ai/feed.xml"
        />
      </head>
      <body className="bg-gray-950 text-gray-100 font-sans antialiased">
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ''} />
        <MicrosoftClarity projectId={process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID || ''} />
        <LinkedInInsight partnerId={process.env.NEXT_PUBLIC_LINKEDIN_PARTNER_ID || ''} />
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
