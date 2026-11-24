import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import type { AnchorHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import ClosingCard from "@/components/ClosingCard";
import JsonLd from "@/components/JsonLd";
import LeadSection from "@/components/LeadSection";
import PostList from "@/components/PostList";
import ToolkitCallout from "@/components/ToolkitCallout";
import { extractFaq } from "@/lib/faq";
import { extractHeadings, headingId } from "@/lib/headings";
import { articleJsonLd, articleUrl, breadcrumbJsonLd, faqPageJsonLd, type JsonLdObject } from "@/lib/jsonld";
import { topicLabel } from "@/lib/leads/schema";
import { formatDate, getAllPostsMeta, getPostBySlug } from "@/lib/mdx";
import { alternatesFor } from "@/lib/metadata";
import { SITE } from "@/lib/site";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPostsMeta().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    authors: [{ name: post.author, url: "/about" }],
    alternates: alternatesFor(`/blog/${slug}`),
    openGraph: {
      type: "article",
      locale: "en_US",
      siteName: SITE.name,
      title: post.title,
      description: post.excerpt,
      url: `/blog/${slug}`,
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
      authors: [post.author],
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
    },
  };
}

function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (node && typeof node === "object" && "props" in node) {
    return textOf((node.props as { children?: ReactNode }).children);
  }
  return "";
}

const mdxComponents = {
  // The page title is the only h1, so a stray "# heading" in a post becomes an h2.
  h1: ({ children, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
    <h2 id={headingId(textOf(children))} {...props}>
      {children}
    </h2>
  ),
  h2: ({ children, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
    <h2 id={headingId(textOf(children))} {...props}>
      {children}
    </h2>
  ),
  a: ({ href = "", children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) =>
    href.startsWith("/") || href.startsWith("#") ? (
      <Link href={href} {...props}>
        {children}
      </Link>
    ) : (
      <a href={href} target="_blank" rel="noopener" {...props}>
        {children}
      </a>
    ),
};

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const url = articleUrl(slug);
  const headings = extractHeadings(post.content);
  const faq = faqPageJsonLd(extractFaq(post.content), url);
  const otherPosts = getAllPostsMeta().filter((other) => other.slug !== slug);

  const jsonLd: JsonLdObject[] = [
    articleJsonLd(post),
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Guides", path: "/blog" },
      { name: post.title, path: `/blog/${slug}` },
    ]),
  ];
  if (faq) jsonLd.push(faq);

  return (
    <>
      <JsonLd data={jsonLd} />

      <article>
        <header className="page flex flex-col gap-6 pb-12 pt-10 md:pt-16">
          <nav aria-label="Breadcrumb" className="caption">
            <Link href="/" className="link-quiet">
              Home
            </Link>{" "}
            /{" "}
            <Link href="/blog" className="link-quiet">
              Guides
            </Link>
          </nav>
          {post.topic ? <p className="eyebrow">{topicLabel(post.topic)}</p> : null}
          <h1 className="h1 max-w-[20ch]">{post.title}</h1>
          <p className="lead max-w-[60ch]">{post.excerpt}</p>
          <p className="caption">
            <Link href="/about" className="link-quiet">
              {post.author}
            </Link>{" "}
            · <time dateTime={post.date}>{formatDate(post.date)}</time> · {post.readingTime}
          </p>
        </header>

        <div className="page grid gap-12 pb-16 lg:grid-cols-[minmax(0,720px)_1fr] lg:gap-16">
          <div className="prose-sh min-w-0">
            <MDXRemote source={post.content} components={mdxComponents} />
          </div>

          {headings.length > 0 ? (
            <aside className="order-first lg:order-none">
              <nav aria-label="On this page" className="tile lg:sticky lg:top-24">
                <p className="eyebrow mb-4">On this page</p>
                <ol className="flex flex-col gap-3">
                  {headings.map((heading, index) => (
                    <li key={heading.id} className="flex gap-3 text-base leading-snug">
                      <span className="marker pt-[3px] !text-base">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <a href={`#${heading.id}`} className="link-quiet">
                        {heading.text}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            </aside>
          ) : null}
        </div>

        <footer className="page pb-8">
          <div className="quote max-w-[720px]">
            <p className="body-sm">
              Written by <strong className="font-bold">{post.author}</strong>
              {post.author === SITE.founder.name ? `, an ${SITE.founder.bio}` : "."} Signalhaus is
              his Services-as-Software consulting firm, and there&apos;s more about it on the{" "}
              <Link href="/">home page</Link>.
            </p>
          </div>
        </footer>
      </article>

      <LeadSection
        id="talk"
        source="blog-post"
        postSlug={slug}
        defaultTopic={post.topic}
        heading="Stuck on this one?"
      >
        <p>
          Tell me what you&apos;re working on and where it&apos;s going wrong. A few plain sentences
          is plenty.
        </p>
      </LeadSection>

      <section className="section" aria-labelledby="more-heading">
        <div className="page flex flex-col gap-10">
          <h2 id="more-heading" className="h2">
            More guides
          </h2>
          <PostList posts={otherPosts} headingLevel="h3" />
          <ToolkitCallout />
        </div>
      </section>

      <ClosingCard
        heading="Give yourself a break. Then pick one number."
        cta={{ label: "See how I work with founders", href: "/services" }}
      />
    </>
  );
}
