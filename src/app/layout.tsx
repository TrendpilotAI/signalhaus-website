import type { Metadata, Viewport } from "next";
import { DM_Mono, Hanken_Grotesk, Newsreader } from "next/font/google";
import "./globals.css";
import AttributionTracker from "@/components/AttributionTracker";
import Footer from "@/components/Footer";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import Header from "@/components/Header";
import JsonLd from "@/components/JsonLd";
import LinkedInInsight from "@/components/LinkedInInsight";
import MicrosoftClarity from "@/components/MicrosoftClarity";
import { organizationJsonLd, websiteJsonLd } from "@/lib/jsonld";
import { alternatesFor, shareMetadataFor } from "@/lib/metadata";
import { SITE, SITE_URL } from "@/lib/site";

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-newsreader",
  display: "swap",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hanken",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-dm-mono",
  display: "swap",
});

const DEFAULT_TITLE = `${SITE.name} - ${SITE.tagline}`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  authors: [{ name: SITE.founder.name, url: `${SITE_URL}/about` }],
  ...shareMetadataFor({ title: DEFAULT_TITLE, description: SITE.description, path: "/" }),
  robots: { index: true, follow: true },
  alternates: alternatesFor("/"),
};

export const viewport: Viewport = {
  themeColor: "#F5EFE3",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${newsreader.variable} ${hanken.variable} ${dmMono.variable}`}>
      <body className="antialiased">
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
        {/* Each analytics tag renders nothing unless its env var is set. */}
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ""} />
        <MicrosoftClarity projectId={process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID || ""} />
        <LinkedInInsight partnerId={process.env.NEXT_PUBLIC_LINKEDIN_PARTNER_ID || ""} />
        <AttributionTracker />
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
