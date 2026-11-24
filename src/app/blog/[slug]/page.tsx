import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import type { AnchorHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import AuthorCard from "@/components/AuthorCard";
import { CompactGuideRows } from "@/components/GuideRows";
import { IconChevronDown } from "@/components/icons";
import JsonLd from "@/components/JsonLd";
import LeadSection from "@/components/LeadSection";
import { extractFaq } from "@/lib/faq";
import { extractHeadings, headingId, type Heading } from "@/lib/headings";
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

function TableOfContents({ headings }: { headings: Heading[] }) {
  return (
    <ol className="flex flex-col gap-3">
      {headings.map((heading, index) => (
        <li key={heading.id} className="flex gap-3 text-base leading-snug">
          <span className="marker pt-[3px] !text-base">{String(index + 1).padStart(2, "0")}</span>
          <a href={`#${heading.id}`} className="link-quiet">
            {heading.text}
          </a>
        </li>
      ))}
    </ol>
  );
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const url = articleUrl(slug);
  const headings = extractHeadings(post.content);
  const faqItems = extractFaq(post.content);
  const faq = faqPageJsonLd(faqItems, url);
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
        <header className="page flex flex-col gap-6 pb-10 pt-10 md:pb-12 md:pt-16">
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

        <div className="page grid gap-8 lg:grid-cols-[minmax(0,720px)_minmax(0,1fr)] lg:gap-16">
          {headings.length > 0 ? (
            <details className="toc-details tile lg:hidden">
              <summary>
                On this page
                <IconChevronDown width={18} height={18} />
              </summary>
              <nav aria-label="On this page" className="pt-4">
                <TableOfContents headings={headings} />
              </nav>
            </details>
          ) : null}

          <div className="min-w-0">
            <div className="prose-sh">
              <MDXRemote source={post.content} components={mdxComponents} />
            </div>

            {faqItems.length > 0 ? (
              <section aria-labelledby="short-answers-heading" className="mt-16 max-w-[68ch]">
                <h2 id="short-answers-heading" className="h3">
                  The short answers
                </h2>
                <dl className="mt-6 border-b border-navy/20">
                  {faqItems.map((item) => {
                    const target = headings.find((heading) => heading.text === item.question);
                    return (
                      <div key={item.question} className="border-t border-navy/20 py-5">
                        <dt className="font-serif text-[1.25rem] leading-[1.25] text-navy">
                          {target ? (
                            <a href={`#${target.id}`} className="link-quiet">
                              {item.question}
                            </a>
                          ) : (
                            item.question
                          )}
                        </dt>
                        <dd className="body-sm mt-2">{item.answer}</dd>
                      </div>
                    );
                  })}
                </dl>
              </section>
            ) : null}

            <footer className="mt-16 max-w-[68ch]">
              <AuthorCard author={post.author} />
            </footer>
          </div>

          {headings.length > 0 ? (
            <aside className="hidden lg:block">
              <nav aria-label="On this page" className="tile sticky top-24">
                <p className="eyebrow mb-4">On this page</p>
                <TableOfContents headings={headings} />
              </nav>
            </aside>
          ) : null}
        </div>
      </article>

      <section className="section mt-[calc(var(--spacing-section)/2)]" aria-labelledby="more-heading">
        <div className="page flex flex-col gap-8">
          <h2 id="more-heading" className="h2">
            More guides
          </h2>
          <CompactGuideRows posts={otherPosts} />
        </div>
      </section>

      <LeadSection id="talk" source="blog-post" postSlug={slug} defaultTopic={post.topic}>
        <p>
          Stuck on this one? Tell me where it&apos;s going wrong. A few plain sentences is plenty.
        </p>
      </LeadSection>
    </>
  );
}
