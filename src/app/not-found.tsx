import type { Metadata } from "next";
import Link from "next/link";
import { BlankSignpost } from "@/components/illustrations";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <section className="page grid items-center gap-10 py-16 md:py-24 lg:grid-cols-[7fr_5fr]">
      <div className="flex flex-col items-start gap-6">
        <p className="eyebrow">404</p>
        <h1 className="h1">That page isn&apos;t here.</h1>
        <p className="lead max-w-[48ch]">
          It may have moved when the site was rebuilt. Here are two places to start.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link href="/" className="btn btn-primary">
            Go to the home page
          </Link>
          <Link href="/blog" className="btn btn-secondary">
            Read the guides
          </Link>
        </div>
      </div>
      <BlankSignpost className="mx-auto h-auto w-full max-w-[280px]" />
    </section>
  );
}
