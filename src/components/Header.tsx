"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { IconClose, IconMenu, LogoMark } from "@/components/icons";
import { SITE } from "@/lib/site";

const NAV = [
  { label: "Services", href: "/services" },
  { label: "Guides", href: "/blog" },
  { label: "About", href: "/about" },
];

function isCurrent(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Header() {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-paper">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-light focus:px-4 focus:py-2"
      >
        Skip to the content
      </a>
      <div className="page flex min-h-[76px] items-center justify-between gap-6">
        <Link href="/" className="link-quiet flex items-center gap-3" aria-label={`${SITE.name} home`}>
          <span className="icon-tile">
            <LogoMark />
          </span>
          <span className="font-serif text-[1.6rem] leading-none tracking-[-0.02em] text-navy">
            {SITE.name}
          </span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isCurrent(pathname, item.href) ? "page" : undefined}
              className="link-quiet text-[1.0625rem] font-medium text-navy aria-[current=page]:underline aria-[current=page]:decoration-accent aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-8"
            >
              {item.label}
            </Link>
          ))}
          <Link href="/contact" className="btn btn-primary">
            Get in touch
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close the menu" : "Open the menu"}
          className="flex h-12 w-12 items-center justify-center text-navy md:hidden"
        >
          {open ? <IconClose /> : <IconMenu />}
        </button>
      </div>

      {open ? (
        <nav id="mobile-nav" aria-label="Main" className="page flex flex-col gap-2 pb-6 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              aria-current={isCurrent(pathname, item.href) ? "page" : undefined}
              className="link-quiet flex min-h-12 items-center text-lg font-medium text-navy"
            >
              {item.label}
            </Link>
          ))}
          <Link href="/contact" onClick={() => setOpen(false)} className="btn btn-primary mt-2">
            Get in touch
          </Link>
        </nav>
      ) : null}
    </header>
  );
}
