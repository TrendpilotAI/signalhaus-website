import Link from "next/link";
import { IconArrowRight } from "@/components/icons";
import { topicLabel } from "@/lib/leads/schema";
import { formatDate, type PostMeta } from "@/lib/mdx";

interface GuideRowsProps {
  posts: PostMeta[];
  headingLevel?: "h2" | "h3";
}

/** Guides as hairline-divided rows: mono topic, serif title, excerpt, then the date and read time. */
export default function GuideRows({ posts, headingLevel = "h2" }: GuideRowsProps) {
  const Heading = headingLevel;
  return (
    <ul className="border-b border-navy/20">
      {posts.map((post) => (
        <li
          key={post.slug}
          className="group relative grid gap-x-8 gap-y-3 border-t border-navy/20 py-8 md:grid-cols-[11rem_1fr_1.5rem]"
        >
          <p className="caption md:pt-[0.55em]">{post.topic ? topicLabel(post.topic) : "Guide"}</p>
          <div className="flex flex-col gap-3">
            <Heading className="h3">
              <Link href={`/blog/${post.slug}`} className="link-quiet after:absolute after:inset-0">
                {post.title}
              </Link>
            </Heading>
            <p className="body-sm max-w-[64ch]">{post.excerpt}</p>
            <p className="caption">
              <time dateTime={post.date}>{formatDate(post.date)}</time> · {post.readingTime}
            </p>
          </div>
          <IconArrowRight className="mt-[0.3em] hidden text-navy transition-colors group-hover:text-accent md:block" />
        </li>
      ))}
    </ul>
  );
}

/** The short version for the end of a post: topic, title and read time on one line. */
export function CompactGuideRows({ posts, headingLevel = "h3" }: GuideRowsProps) {
  const Heading = headingLevel;
  return (
    <ul className="border-b border-navy/20">
      {posts.map((post) => (
        <li
          key={post.slug}
          className="relative grid gap-x-8 gap-y-2 border-t border-navy/20 py-5 md:grid-cols-[14rem_1fr_auto] md:items-baseline"
        >
          <p className="eyebrow">{post.topic ? topicLabel(post.topic) : "Guide"}</p>
          <Heading className="font-serif text-[1.375rem] leading-[1.2] tracking-[-0.01em] text-pretty">
            <Link href={`/blog/${post.slug}`} className="link-quiet after:absolute after:inset-0">
              {post.title}
            </Link>
          </Heading>
          <p className="caption">{post.readingTime}</p>
        </li>
      ))}
    </ul>
  );
}
