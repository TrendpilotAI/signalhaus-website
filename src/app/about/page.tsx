import type { Metadata } from "next";
import Link from "next/link";
import ClosingCard from "@/components/ClosingCard";
import { IconArrowRight, IconChart, IconHands, IconSheet, IconTalk } from "@/components/icons";
import JsonLd from "@/components/JsonLd";
import ToolkitCallout from "@/components/ToolkitCallout";
import { breadcrumbJsonLd, personJsonLd } from "@/lib/jsonld";
import { SITE } from "@/lib/site";

const DESCRIPTION =
  "Signalhaus LLC is Nathan Stevenson's Services-as-Software consulting firm, an AI growth advisory for founders.";

export const metadata: Metadata = {
  title: "About",
  description: DESCRIPTION,
  alternates: { canonical: "/about" },
  openGraph: { title: "About Signalhaus", description: DESCRIPTION, url: "/about" },
};

const PRINCIPLES = [
  {
    icon: <IconTalk />,
    title: "Plain words",
    body: "If a line needs explaining, I rewrite it until it doesn't. You should be able to repeat it to your team.",
  },
  {
    icon: <IconChart />,
    title: "One number first",
    body: "We start with the number you most want to see change. More can come later.",
  },
  {
    icon: <IconSheet />,
    title: "Small tests",
    body: "A test should take less than two weeks. Then we look at what happened and decide what to do next.",
  },
  {
    icon: <IconHands />,
    title: "Your team owns it",
    body: "The rhythm and the playbooks get written down, so the work carries on when I'm not in the room.",
  },
];

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={[
          { "@context": "https://schema.org", ...personJsonLd() },
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "About", path: "/about" },
          ]),
        ]}
      />

      <section className="page flex flex-col gap-6 pb-12 pt-10 md:pt-16">
        <p className="eyebrow">About</p>
        <h1 className="h1 max-w-[18ch]">About Signalhaus</h1>
        <p className="lead max-w-[60ch]">
          {SITE.legalName} is {SITE.founder.name}&apos;s Services-as-Software consulting firm.
          It&apos;s an AI growth advisory for founders.
        </p>
      </section>

      <section className="section !pt-8" aria-labelledby="nathan-heading">
        <div className="page grid gap-10 lg:grid-cols-[5fr_7fr] lg:gap-16">
          <div className="flex flex-col gap-6">
            <p className="eyebrow">Who you&apos;d be working with</p>
            <h2 id="nathan-heading" className="h2">
              {SITE.founder.name}
            </h2>
            <p id="nathan-stevenson">{SITE.founder.bio}</p>
          </div>
          <div className="flex flex-col gap-6">
            <figure className="quote flex flex-col gap-4">
              <blockquote className="lead">
                Three or four years into my own company I was still asking which numbers mattered.
                Pricing was a real challenge for me. It felt like the Bermuda Triangle.
              </blockquote>
              <figcaption className="caption">{SITE.founder.name}</figcaption>
            </figure>
            <p>
              So when a founder tells me they haven&apos;t worked it all out yet, I tell them to
              give themselves a break. That&apos;s why you have a team, and that&apos;s what
              advisors are for.
            </p>
            <p>
              I&apos;m selective about who I take on. It has to be someone I can actually help.
            </p>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="how-heading">
        <div className="page flex flex-col gap-10">
          <h2 id="how-heading" className="h2">
            How I work
          </h2>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PRINCIPLES.map((item) => (
              <li key={item.title} className="tile flex flex-col items-start gap-4">
                <span className="icon-tile">{item.icon}</span>
                <h3 className="h3">{item.title}</h3>
                <p className="text-[1.0625rem]">{item.body}</p>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
            <Link href="/services" className="link-arrow">
              See how the work runs
              <IconArrowRight width={18} height={18} />
            </Link>
            <Link href="/blog" className="link-arrow">
              Read the guides
              <IconArrowRight width={18} height={18} />
            </Link>
          </div>
        </div>
      </section>

      <section className="section" aria-label="The free toolkit">
        <div className="page">
          <ToolkitCallout />
        </div>
      </section>

      <ClosingCard
        heading="Tell me what you're working on."
        cta={{ label: "Get in touch", href: "/contact" }}
      />
    </>
  );
}
