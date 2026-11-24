import Link from "next/link";
import type { SVGProps } from "react";
import { IconArrowRight } from "@/components/icons";
import { BlankSignpost, OneNumberSheet, QuestionCards, SignalHouse } from "@/components/illustrations";
import { topicLabel, type LeadTopic } from "@/lib/leads/schema";
import { formatDate, type PostMeta } from "@/lib/mdx";

function GuideIllustration({ topic, ...props }: { topic?: LeadTopic } & SVGProps<SVGSVGElement>) {
  switch (topic) {
    case "due-diligence":
      return <QuestionCards {...props} />;
    case "positioning":
      return <BlankSignpost {...props} />;
    case "data-driven-decisions":
      return <OneNumberSheet {...props} />;
    case "prioritization":
    case "other":
    case undefined:
      return <SignalHouse {...props} />;
    default: {
      const unhandled: never = topic;
      return unhandled;
    }
  }
}

/** The guide at the top of the list, as one wide row with an illustration. */
export default function FeaturedGuide({ post }: { post: PostMeta }) {
  const href = `/blog/${post.slug}`;
  return (
    <article className="grid items-center gap-8 pb-10 md:grid-cols-[1fr_280px] md:gap-16 md:pb-12">
      <div className="flex flex-col items-start gap-5">
        <p className="caption">{post.topic ? topicLabel(post.topic) : "Guide"}</p>
        <h2 className="h2 max-w-[20ch]">
          <Link href={href} className="link-quiet">
            {post.title}
          </Link>
        </h2>
        <p className="max-w-[58ch]">{post.excerpt}</p>
        <p className="caption">
          <time dateTime={post.date}>{formatDate(post.date)}</time> · {post.readingTime}
        </p>
        <Link href={href} className="link-arrow" aria-label={`Read the guide, ${post.title}`}>
          Read the guide
          <IconArrowRight width={18} height={18} />
        </Link>
      </div>
      <GuideIllustration topic={post.topic} className="order-first h-auto w-full max-w-[200px] md:order-none md:max-w-[280px]" />
    </article>
  );
}
