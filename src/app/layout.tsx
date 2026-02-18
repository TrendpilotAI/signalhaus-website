import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ProfessionalService",
              name: "SignalHaus",
              alternateName: "SignalHaus AI",
              url: "https://www.signalhaus.ai",
              logo: "https://www.signalhaus.ai/logo.png",
              description: "AI strategy, data integration, and workflow automation consultancy for enterprises",
              founder: {
                "@type": "Person",
                name: "Nathan Stevenson",
                jobTitle: "Founder & CEO",
                alumniOf: { "@type": "Organization", name: "Harvard University" },
              },
              areaServed: { "@type": "Country", name: "United States" },
              address: {
                "@type": "PostalAddress",
                addressLocality: "Fort Lauderdale",
                addressRegion: "FL",
                addressCountry: "US",
              },
              priceRange: "$1,250 - $100,000+",
              serviceType: ["AI Strategy", "Data Integration", "Workflow Automation", "AI Consulting"],
              knowsAbout: ["Artificial Intelligence", "Data Integration", "Enterprise Automation", "Financial Technology"],
              award: ["AI Hot 100", "WealthTech 100", "AI Fintech 100", "KPMG Top 50 Fintechs", "World Economic Forum Technology Pioneer"],
            }),
          }}
        />
      </head>
      <body className="bg-gray-950 text-gray-100 font-sans antialiased">
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
