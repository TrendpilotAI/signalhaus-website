import Link from "next/link";
import { IconFeed, LogoMark } from "@/components/icons";
import { getAllPostsMeta } from "@/lib/mdx";
import { PRIMARY_CTA, SITE, TOOLKIT_URL } from "@/lib/site";

const SITE_LINKS = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Guides", href: "/blog" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export default function Footer() {
  const posts = getAllPostsMeta();

  return (
    <footer className="bg-tile">
      <div className="page">
        <div className="flex flex-col items-start gap-6 border-b border-navy/15 py-12 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
          <p className="h2 max-w-[22ch]">Advice from a person. Legwork from agents.</p>
          <Link href={PRIMARY_CTA.href} className="btn btn-primary flex-none">
            {PRIMARY_CTA.label}
          </Link>
        </div>
      </div>

      <div className="page grid gap-12 py-12 md:grid-cols-[1.3fr_1fr_1.8fr]">
        <div className="flex flex-col gap-4">
          <Link href="/" className="link-quiet flex items-center gap-3" aria-label={`${SITE.name} home`}>
            <span className="icon-tile">
              <LogoMark />
            </span>
            <span className="font-serif text-[1.6rem] leading-none tracking-[-0.02em] text-navy">
              {SITE.name}
            </span>
          </Link>
          <p className="max-w-[34ch] text-base">
            Nathan Stevenson&apos;s Services-as-Software consulting firm. An AI growth advisory for
            founders.
          </p>
        </div>

        <nav aria-labelledby="footer-site" className="flex flex-col gap-4">
          <h2 id="footer-site" className="eyebrow">
            Site
          </h2>
          <ul className="flex flex-col gap-2 text-base">
            {SITE_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="link-quiet">
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <a href={TOOLKIT_URL} target="_blank" rel="noopener" className="link-quiet">
                The free toolkit
              </a>
            </li>
          </ul>
        </nav>

        <nav aria-labelledby="footer-guides" className="flex flex-col gap-4">
          <h2 id="footer-guides" className="eyebrow">
            Guides
          </h2>
          <ul className="flex flex-col gap-3 text-base">
            {posts.map((post) => (
              <li key={post.slug} className="flex flex-col gap-x-4 sm:flex-row sm:items-baseline sm:justify-between">
                <Link href={`/blog/${post.slug}`} className="link-quiet">
                  {post.title}
                </Link>
                <span className="caption flex-none">{post.readingTime}</span>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="page flex flex-col gap-3 pb-10 sm:flex-row sm:items-center sm:justify-between">
        <p className="caption">
          © {new Date().getFullYear()} {SITE.legalName}
        </p>
        <a href="/feed.xml" className="caption link-quiet inline-flex items-center gap-2">
          <IconFeed width={16} height={16} />
          RSS feed
        </a>
      </div>
    </footer>
  );
}
