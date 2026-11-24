import Link from "next/link";
import { IconFeed, LogoMark } from "@/components/icons";
import { getAllPostsMeta } from "@/lib/mdx";
import { SITE, TOOLKIT_URL } from "@/lib/site";

const SITE_LINKS = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Guides", href: "/blog" },
  { label: "About", href: "/about" },
  { label: "Get in touch", href: "/contact" },
];

export default function Footer() {
  const posts = getAllPostsMeta();

  return (
    <footer className="bg-tile">
      <div className="page grid gap-12 py-16 md:grid-cols-[1.3fr_1fr_1.6fr]">
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

        <nav aria-label="Site" className="flex flex-col gap-3">
          <p className="eyebrow">Site</p>
          <ul className="flex flex-col gap-2 text-base">
            {SITE_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="link-quiet">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Guides" className="flex flex-col gap-3">
          <p className="eyebrow">Guides</p>
          <ul className="flex flex-col gap-2 text-base">
            {posts.map((post) => (
              <li key={post.slug}>
                <Link href={`/blog/${post.slug}`} className="link-quiet">
                  {post.title}
                </Link>
              </li>
            ))}
            <li>
              <a href={TOOLKIT_URL} target="_blank" rel="noopener" className="link-quiet">
                The Data-Driven Decision-Making Toolkit
              </a>
            </li>
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
