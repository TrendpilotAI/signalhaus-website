import type { Metadata } from "next";
import Link from "next/link";
import ClosingCard from "@/components/ClosingCard";
import JsonLd from "@/components/JsonLd";
import PostList from "@/components/PostList";
import ToolkitCallout from "@/components/ToolkitCallout";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { getAllPostsMeta } from "@/lib/mdx";
import { alternatesFor, shareMetadataFor } from "@/lib/metadata";

const DESCRIPTION =
  "Plain how-to guides for founders on investor due diligence, positioning, priorities and data-driven decisions. Each one answers the question in the first couple of sentences.";

export const metadata: Metadata = {
  title: "How-to guides for founders",
  description: DESCRIPTION,
  alternates: alternatesFor("/blog"),
  ...shareMetadataFor({ title: "How-to guides for founders", description: DESCRIPTION, path: "/blog" }),
};

export default function BlogIndexPage() {
  const posts = getAllPostsMeta();

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Guides", path: "/blog" },
        ])}
      />

      <section className="page flex flex-col gap-6 pb-12 pt-10 md:pt-16">
        <p className="eyebrow">Guides</p>
        <h1 className="h1 max-w-[18ch]">How-to guides for founders</h1>
        <p className="lead max-w-[60ch]">
          Every heading is a question a founder asked or one I asked them. The answer is in the
          first sentence or two, and the rest is how to do it.
        </p>
      </section>

      <section className="page pb-16" aria-label="All guides">
        <PostList posts={posts} />
      </section>

      <section className="page flex flex-col gap-6 pb-16 md:pb-24">
        <ToolkitCallout />
        <p className="caption">
          New guides also go out on the <a href="/feed.xml">RSS feed</a>. If your question
          isn&apos;t here, <Link href="/contact">send it to me</Link>.
        </p>
      </section>

      <ClosingCard
        heading="Got a question that isn't here?"
        cta={{ label: "Tell me what you're working on", href: "/contact" }}
      />
    </>
  );
}
