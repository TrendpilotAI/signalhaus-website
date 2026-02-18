import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-gray-950">
      <div className="max-w-7xl mx-auto px-6 py-12 grid md:grid-cols-4 gap-8">
        <div>
          <span className="text-lg font-bold">Signal<span className="text-indigo-400">Haus</span></span>
          <p className="mt-2 text-sm text-gray-400">Pragmatic AI. Real Impact.</p>
        </div>
        <div>
          <h4 className="font-semibold text-sm mb-3">Services</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li><Link href="/services" className="hover:text-white transition">AI Strategy</Link></li>
            <li><Link href="/services" className="hover:text-white transition">Data Integration</Link></li>
            <li><Link href="/services" className="hover:text-white transition">Automation</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-sm mb-3">Company</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li><Link href="/about" className="hover:text-white transition">About</Link></li>
            <li><Link href="/blog" className="hover:text-white transition">Blog</Link></li>
            <li><Link href="/pricing" className="hover:text-white transition">Pricing</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-sm mb-3">Get Started</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li><Link href="/contact" className="hover:text-white transition">Contact</Link></li>
            <li><a href="https://www.linkedin.com/company/signalhaus" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">LinkedIn</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-800 py-6 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} SignalHaus. All rights reserved.
      </div>
    </footer>
  );
}
