import Link from "next/link";
import TopicIcon from "@/components/TopicIcon";
import { topicLabel } from "@/lib/leads/schema";
import { formatDate, type PostMeta } from "@/lib/mdx";

/** Guides as flat tiles: icon tile, topic, title, excerpt and a mono caption. */
export default function PostList({ posts, headingLevel = "h2" }: { posts: PostMeta[]; headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;
  return (
    <ul className="grid gap-6 md:grid-cols-2">
      {posts.map((post) => (
        <li key={post.slug} className="tile flex flex-col gap-4 md:!p-8">
          <div className="flex items-center gap-3">
            <span className="icon-tile">
              <TopicIcon topic={post.topic} />
            </span>
            {post.topic ? <p className="eyebrow">{topicLabel(post.topic)}</p> : null}
          </div>
          <Heading className="h3">
            <Link href={`/blog/${post.slug}`} className="link-quiet">
              {post.title}
            </Link>
          </Heading>
          <p className="body-sm">{post.excerpt}</p>
          <p className="caption mt-auto pt-2">
            <time dateTime={post.date}>{formatDate(post.date)}</time> · {post.readingTime}
          </p>
        </li>
      ))}
    </ul>
  );
}
