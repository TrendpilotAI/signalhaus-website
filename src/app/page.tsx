import type { Metadata } from "next";
import Link from "next/link";
import ClosingCard from "@/components/ClosingCard";
import { IconAgent, IconArrowRight, IconHands, IconSheet, IconTalk, IconWrench } from "@/components/icons";
import { SignalHouse } from "@/components/illustrations";
import LeadSection from "@/components/LeadSection";
import ToolkitCallout from "@/components/ToolkitCallout";
import TopicIcon from "@/components/TopicIcon";
import type { LeadTopic } from "@/lib/leads/schema";
import { SITE } from "@/lib/site";
import { alternatesFor } from "@/lib/metadata";

export const metadata: Metadata = {
  title: { absolute: `${SITE.name} - ${SITE.tagline}` },
  description: SITE.description,
  alternates: alternatesFor("/"),
};

const QUESTIONS: Array<{
  topic: LeadTopic;
  question: string;
  answer: string;
  href: string;
  linkLabel: string;
}> = [
  {
    topic: "due-diligence",
    question: "How do I get through investor due diligence?",
    answer:
      "Investors ask about four things, which are the vision, the customers, you and the competition. You can practise all four before the meeting.",
    href: "/blog/how-to-survive-vc-due-diligence-meetings",
    linkLabel: "How to survive VC due diligence meetings",
  },
  {
    topic: "positioning",
    question: "Where do we position?",
    answer:
      "Start where the conversations are already easy. Then lead with the one thing a buyer can say yes or no to straight away.",
    href: "/blog/how-to-position-a-startup",
    linkLabel: "How to position a startup",
  },
  {
    topic: "prioritization",
    question: "What do we do first?",
    answer:
      "Ask where the need is greatest right now and start there. Two short meetings a week are enough to keep it moving.",
    href: "/blog/how-to-prioritize-as-a-startup-founder",
    linkLabel: "How to prioritize as a startup founder",
  },
  {
    topic: "data-driven-decisions",
    question: "Which numbers matter?",
    answer:
      "Pick one number, write it down every week, and let it change what you do next. It takes about an hour to set up.",
    href: "/blog/data-driven-decision-making-for-startups",
    linkLabel: "Data-driven decision making for startups",
  },
];

const STEPS = [
  {
    icon: <IconTalk />,
    title: "We talk it through",
    body: "We start with a conversation about what you're building and where you're stuck. I ask a lot of questions, and most of them are the ones an investor would ask.",
  },
  {
    icon: <IconSheet />,
    title: "We pick one number",
    body: "We agree on the number you most want to see change and put it in a sheet. You don't need special tools for this.",
  },
  {
    icon: <IconAgent />,
    title: "Agents do the legwork",
    body: "AI agents gather the information and work through the tasks during the week, so it doesn't all land on you.",
  },
  {
    icon: <IconHands />,
    title: "Your team owns it",
    body: "A short weekly review shows what worked and what didn't. It all gets written down, so your team can keep running it.",
  },
];

const WAYS = [
  {
    icon: <IconTalk />,
    title: "Advisory",
    body: "I advise, and your team does the work.",
  },
  {
    icon: <IconWrench />,
    title: "Advisory and build",
    body: "Advice, and I take on some of the implementation with you.",
  },
  {
    icon: <IconHands />,
    title: "Hands-on",
    body: "I do more of the building myself, so you get moving faster.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Title: eyebrow, serif heading, subtitle, illustration. */}
      <section className="page grid items-center gap-10 pb-16 pt-10 md:pb-24 md:pt-16 lg:grid-cols-[7fr_5fr]">
        <div className="flex flex-col items-start gap-8">
          <p className="eyebrow">Services-as-Software for founders</p>
          <h1 className="display max-w-[13ch]">You don&apos;t have to have every answer yet.</h1>
          <p className="lead max-w-[54ch]">
            I&apos;m Nathan, and Signalhaus is my consulting firm. I help founders work out where
            to position, what to do first, which numbers to watch and how to get through investor
            due diligence. Then AI agents take on a lot of the legwork, so you still have help
            between our calls.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <a href="#talk" className="btn btn-primary">
              Tell me what you&apos;re working on
            </a>
            <Link href="/blog" className="btn btn-secondary">
              Read the guides
            </Link>
          </div>
          <p className="caption max-w-[60ch]">
            {SITE.founder.name}. {SITE.founder.bio}
          </p>
        </div>
        <SignalHouse className="mx-auto h-auto w-full max-w-[560px]" />
      </section>

      {/* Heading plus tiles: icon tile, h3, paragraph. */}
      <section className="section" aria-labelledby="questions-heading">
        <div className="page flex flex-col gap-10">
          <div className="flex max-w-[62ch] flex-col gap-6">
            <h2 id="questions-heading" className="h2">
              Four questions founders ask
            </h2>
            <p>
              These all came up in one long conversation with the founder of a seed-stage AI
              startup. I wrote the answers down so you can use them without talking to me.
            </p>
          </div>
          <ul className="grid gap-6 md:grid-cols-2">
            {QUESTIONS.map((item) => (
              <li key={item.href} className="tile flex flex-col items-start gap-4 md:!p-8">
                <span className="icon-tile">
                  <TopicIcon topic={item.topic} />
                </span>
                <h3 className="h3">{item.question}</h3>
                <p>{item.answer}</p>
                <Link
                  href={item.href}
                  className="link-arrow mt-auto pt-2 text-[1.0625rem]"
                >
                  {item.linkLabel}
                  <IconArrowRight width={18} height={18} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Heading, one-line lead, four numbered steps. */}
      <section className="section" aria-labelledby="how-heading">
        <div className="page flex flex-col gap-10">
          <div className="flex max-w-[62ch] flex-col gap-6">
            <p className="eyebrow">How it works</p>
            <h2 id="how-heading" className="h2">
              What Services-as-Software means here
            </h2>
            <p className="lead">
              Services can scale like software now. For you that means the advice comes from a
              person, and AI agents and a simple tracker do the legwork between calls.
            </p>
          </div>
          <ol className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex flex-col items-start gap-4">
                <div className="flex items-center gap-3">
                  <span className="marker">{String(index + 1).padStart(2, "0")}</span>
                  <span className="text-accent">{step.icon}</span>
                </div>
                <h3 className="h3">{step.title}</h3>
                <p className="text-[1.0625rem]">{step.body}</p>
              </li>
            ))}
          </ol>
          <p className="caption max-w-[70ch]">
            The weekly rhythm is a starting point. We set the days and times with your team.
          </p>
        </div>
      </section>

      {/* Three delivery models. No prices on purpose. */}
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
          <ul className="grid gap-6 md:grid-cols-3">
            {WAYS.map((way) => (
              <li key={way.title} className="tile flex flex-col items-start gap-4">
                <span className="icon-tile">{way.icon}</span>
                <h3 className="h3">{way.title}</h3>
                <p>{way.body}</p>
              </li>
            ))}
          </ul>
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <Link href="/services" className="btn btn-secondary">
              See how the work runs
            </Link>
            <p className="caption">All three are built around a weekly call.</p>
          </div>
        </div>
      </section>

      {/* Quote bar on the left, the person on the right. */}
      <section className="section" aria-labelledby="who-heading">
        <div className="page grid gap-12 lg:grid-cols-2 lg:gap-16">
          <figure className="quote flex flex-col gap-4 self-start">
            <blockquote className="lead">
              Three or four years into my own company I was still asking which numbers mattered,
              and pricing felt like the Bermuda Triangle. So if you haven&apos;t worked it all out
              yet, give yourself a break.
            </blockquote>
            <figcaption className="caption">{SITE.founder.name}, Signalhaus</figcaption>
          </figure>
          <div className="flex flex-col items-start gap-6">
            <p className="eyebrow">Who you&apos;d be working with</p>
            <h2 id="who-heading" className="h2">
              {SITE.founder.name}
            </h2>
            <p>{SITE.founder.bio}</p>
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

      <LeadSection id="talk" source="landing" heading="Tell me what you're working on">
        <p>
          A few plain sentences is plenty. Tell me what you&apos;re building and where you&apos;re
          stuck, and pick the topic that&apos;s closest.
        </p>
        <p>
          If you&apos;d rather read first, the <Link href="/blog">guides</Link> cover the same
          ground.
        </p>
      </LeadSection>

      <ClosingCard
        heading="Give yourself a break. Then pick one number."
        cta={{
          label: "Read how to pick it",
          href: "/blog/data-driven-decision-making-for-startups",
        }}
      />
    </>
  );
}
