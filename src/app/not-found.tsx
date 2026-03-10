import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Page Not Found | SignalHaus",
  description: "The page you're looking for doesn't exist. Explore SignalHaus AI consulting services.",
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Glowing 404 */}
        <div className="relative mb-8">
          <span className="text-[10rem] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-purple-700 leading-none select-none opacity-20">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-8xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-600">
              404
            </span>
          </div>
        </div>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-violet-900/30 border border-violet-700/50 flex items-center justify-center">
            <svg className="w-8 h-8 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white mb-3">
          Signal Lost in the Noise
        </h1>
        <p className="text-gray-400 text-lg mb-8 leading-relaxed">
          We couldn&apos;t find the page you&apos;re looking for. It may have moved,
          been removed, or the URL might be incorrect.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-lg transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Back to Home
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold rounded-lg border border-gray-700 transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Contact Us
          </Link>
        </div>

        {/* Quick links */}
        <div className="border-t border-gray-800 pt-8">
          <p className="text-sm text-gray-500 mb-4">Explore SignalHaus</p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
            {[
              { href: "/services", label: "Services" },
              { href: "/about", label: "About" },
              { href: "/blog", label: "Blog" },
              { href: "/pricing", label: "Pricing" },
              { href: "/case-studies", label: "Case Studies" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-violet-400 hover:text-violet-300 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
