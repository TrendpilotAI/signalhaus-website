"use client";
import Link from "next/link";
import { useState } from "react";

const nav = [
  { label: "Services", href: "/services" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Signal<span className="text-indigo-400">Haus</span>
        </Link>
        <nav className="hidden md:flex gap-8">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="text-sm text-gray-300 hover:text-white transition">
              {n.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/contact"
          className="hidden md:inline-flex px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition"
        >
          Book a Call
        </Link>
        <button onClick={() => setOpen(!open)} className="md:hidden p-2" aria-label="Toggle menu">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>
      {open && (
        <nav className="md:hidden border-t border-gray-800 bg-gray-950 px-6 py-4 flex flex-col gap-4">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="text-gray-300 hover:text-white">
              {n.label}
            </Link>
          ))}
          <Link href="/contact" onClick={() => setOpen(false)} className="px-4 py-2 bg-indigo-600 rounded-lg text-center text-sm font-medium">
            Book a Call
          </Link>
        </nav>
      )}
    </header>
  );
}
