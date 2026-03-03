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
    "SignalHaus helps enterprises accelerate growth with custom AI strategy, data integrations, and intelligent automation. Founded by Nathan Stevenson.",
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
    default: "SignalHaus — AI Strategy, Data Integration & Automation Consultancy",
    template: "%s | SignalHaus",
  },
  description:
    "SignalHaus helps enterprises accelerate growth with custom AI strategy, data integrations, and intelligent automation. From rapid prototypes to enterprise-scale AI orchestration. Founded by Nathan Stevenson.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.signalhaus.ai",
    siteName: "SignalHaus",
    title: "SignalHaus — AI Strategy, Data Integration & Automation Consultancy",
    description:
      "SignalHaus helps enterprises accelerate growth with custom AI strategy, data integrations, and intelligent automation.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "SignalHaus — Pragmatic AI. Real Impact." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SignalHaus — AI Strategy, Data Integration & Automation Consultancy",
    description:
      "Custom AI strategy, data integrations, and intelligent automation for enterprises.",
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
