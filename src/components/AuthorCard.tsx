import Link from "next/link";
import { IconArrowRight } from "@/components/icons";
import { SITE } from "@/lib/site";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** Who wrote the post: a monogram tile, the name, the approved bio and a link to the about page. */
export default function AuthorCard({ author }: { author: string }) {
  return (
    <div className="tile flex flex-col gap-5 sm:flex-row sm:gap-6 md:!p-8">
      <span className="monogram" aria-hidden="true">
        {initials(author)}
      </span>
      <div className="flex flex-col items-start gap-3">
        <p className="caption">Written by</p>
        <p className="h3">{author}</p>
        {author === SITE.founder.name ? <p className="body-sm">{SITE.founder.bio}</p> : null}
        <Link href="/about" className="link-arrow body-sm">
          About {author.split(/\s+/)[0]} and {SITE.name}
          <IconArrowRight width={18} height={18} />
        </Link>
      </div>
    </div>
  );
}
