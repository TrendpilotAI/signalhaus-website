import type { Metadata } from "next";
import Link from "next/link";
import { NoteOnItsWay } from "@/components/illustrations";
import JsonLd from "@/components/JsonLd";
import LeadForm from "@/components/LeadForm";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { alternatesFor, shareMetadataFor } from "@/lib/metadata";

const DESCRIPTION =
  "Tell Nathan what you're working on. A few plain sentences about what you're building and where you're stuck is plenty.";

export const metadata: Metadata = {
  title: "Get in touch",
  description: DESCRIPTION,
  alternates: alternatesFor("/contact"),
  ...shareMetadataFor({ title: "Get in touch", description: DESCRIPTION, path: "/contact" }),
};

const NOTES = [
  "Say what you're building and where you're stuck.",
  "Pick the topic that's closest. If none of them fit, pick \"Something else\".",
  "I'm selective about who I take on. It has to be someone I can actually help.",
];

export default function ContactPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Get in touch", path: "/contact" },
        ])}
      />

      <section className="page grid gap-10 pb-16 pt-10 md:pb-24 md:pt-16 lg:grid-cols-[5fr_7fr] lg:gap-16">
        <div className="flex flex-col gap-8">
          <p className="eyebrow">Get in touch</p>
          <h1 className="h1">Tell me what you&apos;re working on</h1>
          <p className="lead">A few plain sentences is plenty.</p>
          <ol className="flex flex-col gap-4">
            {NOTES.map((note, index) => (
              <li key={note} className="flex gap-4">
                <span className="marker pt-[5px]">{String(index + 1).padStart(2, "0")}</span>
                <span>{note}</span>
              </li>
            ))}
          </ol>
          <p className="caption">
            Want to read first? The <Link href="/blog">guides</Link> cover the same four topics.
          </p>
          <NoteOnItsWay className="hidden h-auto w-full max-w-[320px] lg:block" />
        </div>
        <div className="tile self-start !p-6 md:!p-8">
          <LeadForm source="contact" />
        </div>
      </section>
    </>
  );
}
