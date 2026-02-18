"use client";
import type { Metadata } from "next";
import { useState } from "react";

// export const metadata: Metadata — can't use with "use client", handled via head

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <>
      <head>
        <title>Contact | SignalHaus</title>
        <meta name="description" content="Get in touch with SignalHaus. Book a free 30-minute AI consultation to discuss your business needs." />
        <link rel="canonical" href="https://www.signalhaus.ai/contact" />
        <meta property="og:title" content="Contact SignalHaus" />
        <meta property="og:description" content="Book a free 30-minute AI consultation." />
        <meta property="og:image" content="/og-image.png" />
      </head>
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-6">
            Let&apos;s Talk
          </h1>
          <p className="text-center text-gray-400 text-lg mb-12">
            Let&apos;s discuss how AI can accelerate your business. Book a free 30-minute consultation — no strings attached.
          </p>

          {submitted ? (
            <div className="text-center p-12 bg-gray-900 rounded-2xl border border-gray-800">
              <span className="text-5xl mb-4 block">✅</span>
              <h2 className="text-2xl font-bold mb-2">Message Sent</h2>
              <p className="text-gray-400">We&apos;ll get back to you within 24 hours.</p>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSubmitted(true);
              }}
              className="space-y-6"
            >
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">Name</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-indigo-500 focus:outline-none transition"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-indigo-500 focus:outline-none transition"
                    placeholder="you@company.com"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="company" className="block text-sm font-medium mb-2">Company</label>
                <input
                  id="company"
                  name="company"
                  type="text"
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-indigo-500 focus:outline-none transition"
                  placeholder="Company name"
                />
              </div>
              <div>
                <label htmlFor="budget" className="block text-sm font-medium mb-2">Budget Range</label>
                <select
                  id="budget"
                  name="budget"
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-indigo-500 focus:outline-none transition"
                >
                  <option value="">Select a range</option>
                  <option value="quickstart">QuickStart ($1,250)</option>
                  <option value="growth">Growth ($4,800/mo)</option>
                  <option value="enterprise">Enterprise ($25K–$100K+)</option>
                  <option value="unsure">Not sure yet</option>
                </select>
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-2">How can we help?</label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  required
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-indigo-500 focus:outline-none transition resize-none"
                  placeholder="Tell us about your project, goals, and timeline..."
                />
              </div>
              <button
                type="submit"
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-lg font-semibold transition"
              >
                Send Message
              </button>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
