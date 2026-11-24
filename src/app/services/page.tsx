import type { Metadata } from "next";
import Link from "next/link";
import ClosingCard from "@/components/ClosingCard";
import { IconAgent, IconCalendar, IconChart, IconCheck, IconHands, IconTalk, IconWrench } from "@/components/icons";
import JsonLd from "@/components/JsonLd";
import ToolkitCallout from "@/components/ToolkitCallout";
import { breadcrumbJsonLd } from "@/lib/jsonld";

const DESCRIPTION =
  "How Signalhaus works with founders. Advice from a person, AI agents doing the legwork between calls, a simple weekly rhythm, and three ways to work together.";

export const metadata: Metadata = {
  title: "Services",
  description: DESCRIPTION,
  alternates: { canonical: "/services" },
  openGraph: { title: "Services", description: DESCRIPTION, url: "/services" },
};

const WORK = [
  {
    title: "Target",
    body: "Work out who you're selling to. Who the buyers are, who else they could pick, and what they say in their own words.",
  },
  {
    title: "Reach",
    body: "Reach more of them. AI agents research each person first, so the message is written for that person.",
  },
  {
    title: "Message",
    body: "Find the story that's true and that stands out. Test a few versions and keep the ones that get replies.",
  },
  {
    title: "Convert",
    body: "Track what happens from first contact to customer. Look at it every week and work on the step where people drop off.",
  },
  {
    title: "Run",
    body: "Set a simple weekly rhythm and write the playbooks down, so your team owns the system.",
  },
];

const WEEK = [
  {
    icon: <IconCalendar />,
    title: "Start of the week",
    body: "A short team meeting to set the week's priorities and agree who is doing what.",
  },
  {
    icon: <IconAgent />,
    title: "During the week",
    body: "Agents gather information, work through each person's tasks and put the results into one shared sheet.",
  },
  {
    icon: <IconChart />,
    title: "End of the week",
    body: "A short review. Each person walks through their own numbers, what worked, what didn't and what moved.",
  },
];

const WAYS = [
  {
    icon: <IconTalk />,
    title: "Advisory",
    summary: "I advise, and your team does the work.",
    points: [
      "I guide the research on customers and competitors.",
      "I recommend how to set up outreach and tracking.",
      "We plan and review the weekly experiments together.",
      "I give you message frameworks and feedback.",
    ],
  },
  {
    icon: <IconWrench />,
    title: "Advisory and build",
    summary: "Advice, and I take on some of the implementation with you.",
    points: [
      "I lead the research with your input.",
      "I set up the outreach workflow and tracking with you.",
      "We plan the experiments together and I run some of them.",
      "We develop the story and the message versions together.",
    ],
  },
  {
    icon: <IconHands />,
    title: "Hands-on",
    summary: "I do more of the building myself, so you get moving faster.",
    points: [
      "I lead the work and hand you a playbook you can use.",
      "I build and run the outreach system and tracking with you.",
      "I design, run and tune the experiments with you.",
      "I draft the story, the versions, the outreach and the follow-up.",
    ],
  },
];

export default function ServicesPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Services", path: "/services" },
        ])}
      />

      <section className="page flex flex-col gap-6 pb-12 pt-10 md:pt-16">
        <p className="eyebrow">Services</p>
        <h1 className="h1 max-w-[18ch]">Advice from a person. Legwork from agents.</h1>
        <p className="lead max-w-[60ch]">
          Signalhaus is a Services-as-Software consulting firm. You get advice from me, and AI
          agents and a simple weekly rhythm carry the work between our calls.
        </p>
      </section>

      <section className="section !pt-8" aria-labelledby="what-heading">
        <div className="page grid gap-10 lg:grid-cols-[5fr_7fr] lg:gap-16">
          <h2 id="what-heading" className="h2">
            What is Services-as-Software?
          </h2>
          <div className="flex flex-col gap-6">
            <p>
              It&apos;s a service that runs on software and AI agents, so it can scale the way a
              software company does. You still talk to a person. The difference is that the
              research, the tracking and a lot of the follow-up get done by agents during the week.
            </p>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="work-heading">
        <div className="page flex flex-col gap-10">
          <div className="flex max-w-[62ch] flex-col gap-6">
            <h2 id="work-heading" className="h2">
              What we work on
            </h2>
            <p>
              Most of it comes down to growth. Finding the right buyers, getting in front of them
              and learning from every conversation.
            </p>
          </div>
          <ol className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {WORK.map((item, index) => (
              <li key={item.title} className="tile flex flex-col gap-4">
                <span className="marker">{String(index + 1).padStart(2, "0")}</span>
                <h3 className="h3">{item.title}</h3>
                <p className="text-[1.0625rem]">{item.body}</p>
              </li>
            ))}
            <li className="callout flex flex-col gap-4 !p-6">
              <span className="text-accent">
                <IconCheck />
              </span>
              <h3 className="h3">Practical tools</h3>
              <p className="text-[1.0625rem]">
                We use practical, affordable tools and skip the heavy stack. A sheet is fine to
                start with.
              </p>
            </li>
          </ol>
        </div>
      </section>

      <section className="section" aria-labelledby="week-heading">
        <div className="page flex flex-col gap-10">
          <div className="flex max-w-[62ch] flex-col gap-6">
            <p className="eyebrow">The weekly rhythm</p>
            <h2 id="week-heading" className="h2">
              How does a week run?
            </h2>
            <p>
              Two short meetings, with agents working in between. Each week is a set of small
              experiments, and real conversations with buyers shape the next one.
            </p>
          </div>
          <ol className="grid gap-x-6 gap-y-10 md:grid-cols-3">
            {WEEK.map((step) => (
              <li key={step.title} className="flex flex-col items-start gap-4">
                <span className="icon-tile">{step.icon}</span>
                <h3 className="h3">{step.title}</h3>
                <p className="text-[1.0625rem]">{step.body}</p>
              </li>
            ))}
          </ol>
          <p className="caption max-w-[70ch]">
            The rhythm is a starting point. We set the days and times with your team. There is more
            on it in{" "}
            <Link href="/blog/how-to-prioritize-as-a-startup-founder">
              how to prioritize as a startup founder
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="section" aria-labelledby="ways-heading">
        <div className="page flex flex-col gap-10">
          <div className="flex max-w-[62ch] flex-col gap-6">
            <h2 id="ways-heading" className="h2">
              Three ways to work together
            </h2>
            <p>
              The work is the same in each one. What changes is how much of it I do and how much
              your team does.
            </p>
          </div>
          <ul className="grid gap-6 lg:grid-cols-3">
            {WAYS.map((way) => (
              <li key={way.title} className="tile flex flex-col items-start gap-4 md:!p-8">
                <span className="icon-tile">{way.icon}</span>
                <h3 className="h3">{way.title}</h3>
                <p>{way.summary}</p>
                <ul className="flex flex-col gap-3 pt-2 text-[1.0625rem]">
                  {way.points.map((point) => (
                    <li key={point} className="flex gap-3">
                      <IconCheck width={18} height={18} className="mt-[5px] flex-none text-accent" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          <p className="caption max-w-[70ch]">
            All three are built around a weekly call. I&apos;m selective about who I take on,
            because it has to be someone I can actually help.
          </p>
        </div>
      </section>

      <section className="section" aria-label="The free toolkit">
        <div className="page">
          <ToolkitCallout />
        </div>
      </section>

      <ClosingCard
        heading="Not sure which one fits?"
        body="Tell me what you're working on and we can work it out from there."
        cta={{ label: "Get in touch", href: "/contact" }}
      />
    </>
  );
}
