import Link from "next/link";
import type { ReactNode } from "react";
import { PRIMARY_CTA } from "@/lib/site";

interface ClosingCardProps {
  heading: ReactNode;
  body?: ReactNode;
}

/** The closing card: full terracotta, white serif heading, and the one call to action. */
export default function ClosingCard({ heading, body }: ClosingCardProps) {
  return (
    <section className="mt-[calc(var(--spacing-section)/2)] bg-accent text-on-accent">
      <div className="page flex flex-col items-start gap-8 py-16 md:py-24">
        <h2 className="h1 max-w-[18ch] !text-on-accent">{heading}</h2>
        {body ? <p className="lead max-w-[52ch] !text-on-accent">{body}</p> : null}
        <Link href={PRIMARY_CTA.href} className="btn btn-on-accent">
          {PRIMARY_CTA.label}
        </Link>
      </div>
    </section>
  );
}
