import Link from "next/link";
import type { ReactNode } from "react";

interface ClosingCardProps {
  heading: ReactNode;
  body?: ReactNode;
  cta: { label: string; href: string };
}

/** The closing card: full terracotta, white serif heading, one action. */
export default function ClosingCard({ heading, body, cta }: ClosingCardProps) {
  return (
    <section className="bg-accent text-on-accent">
      <div className="page flex flex-col items-start gap-8 py-16 md:py-24">
        <h2 className="h1 max-w-[18ch] !text-on-accent">{heading}</h2>
        {body ? <p className="lead max-w-[52ch] !text-on-accent">{body}</p> : null}
        <Link href={cta.href} className="btn btn-on-accent">
          {cta.label}
        </Link>
      </div>
    </section>
  );
}
