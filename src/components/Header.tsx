"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
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

interface CloseMobileMenuOnEscapeArgs {
  key: string;
  /** Where focus is when the key fires. */
  activeElement: Element | null;
  /** The open mobile nav, or null when it is not on the page. */
  menu: Pick<HTMLElement, "contains"> | null;
  /** The button that opened the menu. */
  toggle: Pick<HTMLElement, "focus"> | null;
  close: () => void;
  preventDefault: () => void;
}

/**
 * Closes the mobile menu on Escape. When focus was inside the menu, moves it
 * back to the toggle before React unmounts the nav, so it does not fall to
 * <body>.
 */
export function closeMobileMenuOnEscape({
  key,
  activeElement,
  menu,
  toggle,
  close,
  preventDefault,
}: CloseMobileMenuOnEscapeArgs): boolean {
  if (!isMenuCloseKey(key)) return false;
  preventDefault();
  // activeElement is an Element in the browser (and so a Node). The suite has
  // no DOM globals, so we avoid `instanceof Node` and ask the menu directly.
  const focusWasInMenu =
    menu != null && activeElement != null && menu.contains(activeElement as Node);
  close();
  // Focus while this handler is still running: setState has not re-rendered yet,
  // so the menu is still mounted, but the toggle already holds focus for the
  // unmount that follows.
  if (focusWasInMenu) toggle?.focus();
  return true;
}

export default function Header() {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const scrolled = useSyncExternalStore(subscribeToScroll, hasScrolled, hasScrolledOnServer);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      closeMobileMenuOnEscape({
        key: event.key,
        activeElement: document.activeElement,
        menu: document.getElementById("mobile-nav"),
        toggle: menuToggleRef.current,
        close: () => setOpen(false),
        preventDefault: () => event.preventDefault(),
      });
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
          ref={menuToggleRef}
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
