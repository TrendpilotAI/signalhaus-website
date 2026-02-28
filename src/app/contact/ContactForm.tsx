"use client";
import { useState } from "react";

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [budget, setBudget] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, company, budget, message }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || "Something went wrong. Please try again.");
      } else {
        setSubmitted(true);
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="text-center p-12 bg-gray-900 rounded-2xl border border-gray-800">
        <span className="text-5xl mb-4 block">✅</span>
        <h2 className="text-2xl font-bold mb-2">Message Sent</h2>
        <p className="text-gray-400">We&apos;ll get back to you within 24 hours.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">Name</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-indigo-500 focus:outline-none transition"
          placeholder="Company name"
        />
      </div>
      <div>
        <label htmlFor="budget" className="block text-sm font-medium mb-2">Budget Range</label>
        <select
          id="budget"
          name="budget"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-indigo-500 focus:outline-none transition"
        >
          <option value="">Select a range</option>
          <option value="Under $10K">QuickStart ($1,250)</option>
          <option value="$10K–$50K">Growth ($4,800/mo)</option>
          <option value="$50K–$150K">Enterprise ($25K–$100K+)</option>
          <option value="Not sure">Not sure yet</option>
        </select>
      </div>
      <div>
        <label htmlFor="message" className="block text-sm font-medium mb-2">How can we help?</label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-indigo-500 focus:outline-none transition resize-none"
          placeholder="Tell us about your project, goals, and timeline..."
        />
      </div>

      {error && (
        <div className="p-4 bg-red-900/30 border border-red-800 rounded-xl text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl text-lg font-semibold transition"
      >
        {loading ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}
