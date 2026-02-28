import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import {
  getAllPostsMeta,
  getPostBySlug,
  getAdjacentPosts,
  formatDate,
} from "@/lib/mdx";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = getAllPostsMeta();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: `${post.title} | SignalHaus Blog`,
    description: post.excerpt,
    alternates: { canonical: `https://www.signalhaus.ai/blog/${slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    },
  };
}

const mdxComponents = {
  h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className="text-3xl font-bold text-white mt-12 mb-4" {...props} />
  ),
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="text-2xl font-bold text-white mt-12 mb-4" {...props} />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="text-xl font-semibold text-white mt-8 mb-3" {...props} />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="text-gray-300 leading-relaxed mb-4" {...props} />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="list-disc list-inside space-y-2 ml-4 text-gray-300 mb-4" {...props} />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="list-decimal list-inside space-y-2 ml-4 text-gray-300 mb-4" {...props} />
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="text-gray-300" {...props} />
  ),
  strong: (props: React.HTMLAttributes<HTMLElement>) => (
    <strong className="text-white font-semibold" {...props} />
  ),
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a className="text-indigo-400 hover:text-indigo-300 underline" {...props} />
  ),
  blockquote: (props: React.HTMLAttributes<HTMLElement>) => (
    <blockquote
      className="border-l-4 border-indigo-500 pl-6 italic text-gray-400 my-6"
      {...props}
    />
  ),
  code: (props: React.HTMLAttributes<HTMLElement>) => (
    <code
      className="bg-gray-800 text-indigo-300 px-1.5 py-0.5 rounded text-sm font-mono"
      {...props}
    />
  ),
  pre: (props: React.HTMLAttributes<HTMLPreElement>) => (
    <pre
      className="bg-gray-800 rounded-xl p-6 overflow-x-auto text-sm font-mono text-gray-300 my-6"
      {...props}
    />
  ),
  hr: () => <hr className="border-gray-800 my-12" />,
};

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const { prev, next } = getAdjacentPosts(slug);

  return (
    <article className="pt-32 pb-24 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Back link */}
        <Link
          href="/blog"
          className="text-indigo-400 hover:text-indigo-300 text-sm mb-8 inline-block"
        >
          ← Back to Blog
        </Link>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-4">
          <span>{formatDate(post.date)}</span>
          <span>·</span>
          <span>{post.readingTime}</span>
          <span>·</span>
          <span className="text-gray-400">{post.author}</span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {post.tags.map((tag) => (
            <Link
              key={tag}
              href={`/blog?tag=${encodeURIComponent(tag)}`}
              className="px-3 py-1 bg-indigo-900/40 text-indigo-400 text-xs rounded-full hover:bg-indigo-900/70 transition"
            >
              {tag}
            </Link>
          ))}
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold mb-10">{post.title}</h1>

        {/* Content */}
        <div className="prose prose-invert max-w-none">
          <MDXRemote source={post.content} components={mdxComponents} />
        </div>

        {/* CTA */}
        <div className="mt-16 p-8 bg-gray-900 rounded-2xl border border-gray-800 text-center">
          <p className="text-lg font-semibold text-white mb-4">
            Ready to deploy AI that actually works?
          </p>
          <Link
            href="/contact"
            className="inline-flex px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold transition"
          >
            Book a Free Consultation
          </Link>
        </div>

        {/* Prev/Next */}
        {(prev || next) && (
          <nav className="mt-16 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {prev ? (
              <Link
                href={`/blog/${prev.slug}`}
                className="p-6 bg-gray-900 rounded-2xl border border-gray-800 hover:border-indigo-500/50 transition group"
              >
                <p className="text-xs text-gray-500 mb-2">← Newer</p>
                <p className="text-sm font-medium group-hover:text-indigo-400 transition line-clamp-2">
                  {prev.title}
                </p>
              </Link>
            ) : (
              <div />
            )}
            {next ? (
              <Link
                href={`/blog/${next.slug}`}
                className="p-6 bg-gray-900 rounded-2xl border border-gray-800 hover:border-indigo-500/50 transition group text-right"
              >
                <p className="text-xs text-gray-500 mb-2">Older →</p>
                <p className="text-sm font-medium group-hover:text-indigo-400 transition line-clamp-2">
                  {next.title}
                </p>
              </Link>
            ) : (
              <div />
            )}
          </nav>
        )}
      </div>
    </article>
  );
}
