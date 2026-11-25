"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { IconClose, IconMenu, LogoMark } from "@/components/icons";
import { PRIMARY_CTA, SITE } from "@/lib/site";

const NAV = [
  { label: "Services", href: "/services" },
  { label: "Guides", href: "/blog" },
  { label: "About", href: "/about" },
];

function isCurrent(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function subscribeToScroll(onChange: () => void): () => void {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}

const hasScrolled = () => window.scrollY > 4;
const hasScrolledOnServer = () => false;

/** True when a key press should close the open mobile menu. */
export function isMenuCloseKey(key: string): boolean {
  return key === "Escape";
}

export default function Header() {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const scrolled = useSyncExternalStore(subscribeToScroll, hasScrolled, hasScrolledOnServer);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (isMenuCloseKey(event.key)) setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header
      className={`sticky top-0 z-40 border-b bg-paper ${scrolled || open ? "border-navy/15" : "border-transparent"}`}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:bg-light focus:px-4 focus:py-2"
      >
        Skip to the content
      </a>
      <div className="page flex h-16 items-center justify-between gap-6">
        <Link href="/" className="link-quiet flex items-center gap-3" aria-label={`${SITE.name} home`}>
          <span className="icon-tile">
            <LogoMark />
          </span>
          <span className="font-serif text-[1.6rem] leading-none tracking-[-0.02em] text-navy">
            {SITE.name}
          </span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-8 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isCurrent(pathname, item.href) ? "page" : undefined}
              className="link-quiet body-sm font-medium text-navy aria-[current=page]:underline aria-[current=page]:decoration-accent aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-8"
            >
              {item.label}
            </Link>
          ))}
          <Link href={PRIMARY_CTA.href} className="btn btn-primary btn-compact">
            {PRIMARY_CTA.label}
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close the menu" : "Open the menu"}
          className="-mr-3 flex h-12 w-12 items-center justify-center text-navy lg:hidden"
        >
          {open ? <IconClose /> : <IconMenu />}
        </button>
      </div>

      {open ? (
        <nav
          id="mobile-nav"
          aria-label="Main"
          className="page flex max-h-[calc(100dvh-64px)] flex-col gap-2 overflow-y-auto pb-6 lg:hidden"
        >
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
          <Link href={PRIMARY_CTA.href} onClick={() => setOpen(false)} className="btn btn-primary mt-2">
            {PRIMARY_CTA.label}
          </Link>
        </nav>
      ) : null}
    </header>
  );
}
