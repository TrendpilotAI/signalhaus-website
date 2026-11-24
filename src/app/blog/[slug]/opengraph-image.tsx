import { notFound } from "next/navigation";
import { topicLabel } from "@/lib/leads/schema";
import { getAllPostsMeta, getPostBySlug } from "@/lib/mdx";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og/card";

export const alt = "Signalhaus guide";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export function generateStaticParams() {
  return getAllPostsMeta().map((post) => ({ slug: post.slug }));
}

export default async function OpengraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return renderOgCard({
    eyebrow: post.topic ? topicLabel(post.topic) : "Guide",
    title: post.title,
    footnote: `${post.author} · signalhaus.ai`,
  });
}
