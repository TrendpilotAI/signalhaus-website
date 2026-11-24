import type { Metadata } from "next";
import Link from "next/link";
import { IconArrowRight } from "@/components/icons";
import { SignalHouse } from "@/components/illustrations";
import LeadSection from "@/components/LeadSection";
import ToolkitCallout from "@/components/ToolkitCallout";
import { PRIMARY_CTA, SITE } from "@/lib/site";
import { alternatesFor } from "@/lib/metadata";

export const metadata: Metadata = {
  title: { absolute: `${SITE.name} - ${SITE.tagline}` },
  description: SITE.description,
  alternates: alternatesFor("/"),
};

const QUESTIONS = [
  {
    question: "How do I get through investor due diligence?",
    answer:
      "Investors ask about four things, which are the vision, the customers, you and the competition. You can practise all four before the meeting.",
    href: "/blog/how-to-survive-vc-due-diligence-meetings",
    guide: "How to survive VC due diligence meetings",
  },
  {
    question: "Where do we position?",
    answer:
      "Start where the conversations are already easy. Then lead with the one thing a buyer can say yes or no to straight away.",
    href: "/blog/how-to-position-a-startup",
    guide: "How to position a startup",
  },
  {
    question: "What do we do first?",
    answer:
      "Ask where the need is greatest right now and start there. Two short meetings a week are enough to keep it moving.",
    href: "/blog/how-to-prioritize-as-a-startup-founder",
    guide: "How to prioritize as a startup founder",
  },
  {
    question: "Which numbers matter?",
    answer:
      "Pick one number, write it down every week, and let it change what you do next. It takes about an hour to set up.",
    href: "/blog/data-driven-decision-making-for-startups",
    guide: "Data-driven decision making for startups",
  },
];

const STEPS = [
  {
    title: "We talk it through",
    body: "We start with a conversation about what you're building and where you're stuck. I ask a lot of questions, and most of them are the ones an investor would ask.",
  },
  {
    title: "We pick one number",
    body: "We agree on the number you most want to see change and put it in a sheet. You don't need special tools for this.",
  },
  {
    title: "Agents do the legwork",
    body: "AI agents gather the information and work through the tasks during the week, so it doesn't all land on you.",
  },
  {
    title: "Your team owns it",
    body: "A short weekly review shows what worked and what didn't. It all gets written down, so your team can keep running it.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Title: eyebrow, serif heading, one promise, one action, illustration. */}
      <section className="page grid items-center gap-10 pb-8 pt-10 md:pb-12 md:pt-16 lg:grid-cols-[7fr_5fr]">
        <div className="flex flex-col items-start gap-8">
          <p className="eyebrow">Services-as-Software for founders</p>
          <h1 className="display max-w-[13ch]">You don&apos;t have to have every answer yet.</h1>
          <p className="lead max-w-[52ch]">
            I&apos;m Nathan, and I help founders work out where to position, what to do first, which
            numbers to watch and how to get through investor due diligence. AI agents take on a lot
            of the legwork, so you still have help between our calls.
          </p>
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:gap-8">
            <a href="#talk" className="btn btn-primary">
              {PRIMARY_CTA.label}
            </a>
            <Link href="/blog" className="link-arrow">
              Read the guides
              <IconArrowRight width={18} height={18} />
            </Link>
          </div>
          <p className="caption w-full max-w-[52ch] border-t border-navy pt-4">
            {SITE.founder.name}. {SITE.founder.bio}
          </p>
        </div>
        <SignalHouse className="mx-auto h-auto w-full max-w-[560px]" />
      </section>

      {/* Heading on the left, a hairline-divided list on the right. */}
      <section className="section" aria-labelledby="questions-heading">
        <div className="page grid gap-10 lg:grid-cols-[4fr_8fr] lg:gap-16">
          <div className="flex flex-col gap-6">
            <h2 id="questions-heading" className="h2">
              Four questions founders ask
            </h2>
            <p>
              These all came up in one long conversation with the founder of a seed-stage AI
              startup. I wrote the answers down so you can use them without talking to me.
            </p>
          </div>
          <ol className="border-b border-navy/20">
            {QUESTIONS.map((item, index) => (
              <li
                key={item.href}
                className="group relative grid grid-cols-[2rem_1fr_1.5rem] gap-x-4 border-t border-navy/20 py-6 md:grid-cols-[2.5rem_1fr_1.5rem] md:gap-x-6 md:py-8"
              >
                <span className="marker pt-[0.55em]">{String(index + 1).padStart(2, "0")}</span>
                <div className="flex flex-col gap-3">
                  <h3 className="h3">
                    <Link href={item.href} className="link-quiet after:absolute after:inset-0">
                      {item.question}
                      <span className="sr-only">. Read the guide, {item.guide}.</span>
                    </Link>
                  </h3>
                  <p className="max-w-[58ch]">{item.answer}</p>
                </div>
                <IconArrowRight className="mt-[0.3em] text-navy transition-colors group-hover:text-accent" />
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* The one tinted band on the page: heading and lead, four step pills, then the three ways in a line. */}
      <section className="band" aria-labelledby="how-heading">
        <div className="page flex flex-col gap-10 md:gap-12">
          <div className="grid gap-6 lg:grid-cols-2 lg:items-end lg:gap-16">
            <div className="flex flex-col gap-6">
              <p className="eyebrow">How it works</p>
              <h2 id="how-heading" className="h2">
                What Services-as-Software means here
              </h2>
            </div>
            <p className="lead">
              Services can scale like software now. For you that means the advice comes from a
              person, and AI agents and a simple tracker do the legwork between calls.
            </p>
          </div>
          <ol className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex flex-col gap-4">
                <h3 className={index === 0 ? "step-pill step-pill-primary" : "step-pill"}>
                  <span className="step-pill-marker">{String(index + 1).padStart(2, "0")}</span>
                  {step.title}
                </h3>
                <p className="body-sm">{step.body}</p>
              </li>
            ))}
          </ol>
          <p className="caption max-w-[70ch]">
            The weekly rhythm is a starting point. We set the days and times with your team.
          </p>
          <div className="flex flex-col items-start gap-4 border-t border-navy/20 pt-8 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
            <p className="lead max-w-[60ch]">
              There are three ways to work together: advisory, advisory and build, or hands-on.
            </p>
            <Link href="/services" className="link-arrow flex-none">
              See how the work runs
              <IconArrowRight width={18} height={18} />
            </Link>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="who-heading">
        <div className="page grid gap-8 lg:grid-cols-[4fr_8fr] lg:gap-16">
          <div className="flex flex-col gap-6">
            <p className="eyebrow">Who you&apos;d be working with</p>
            <h2 id="who-heading" className="h2">
              {SITE.founder.name}
            </h2>
          </div>
          <div className="flex max-w-[58ch] flex-col items-start gap-6">
            <p className="lead">{SITE.founder.bio}</p>
            <p>
              I&apos;m selective about who I take on. It has to be someone I can actually help.
            </p>
            <Link href="/about" className="link-arrow">
              More about Signalhaus
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

      <LeadSection id="talk" source="landing">
        <p>
          A few plain sentences is plenty. Tell me what you&apos;re building and where you&apos;re
          stuck, and pick the topic that&apos;s closest.
        </p>
        <p>
          If you&apos;d rather read first, the <Link href="/blog">guides</Link> cover the same
          ground.
        </p>
      </LeadSection>
    </>
  );
}
