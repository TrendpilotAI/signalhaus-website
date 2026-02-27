import type { Metadata } from "next";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact | SignalHaus",
  description:
    "Get in touch with SignalHaus. Book a free 30-minute AI consultation to discuss your business needs.",
  alternates: { canonical: "https://www.signalhaus.ai/contact" },
  openGraph: {
    title: "Contact SignalHaus",
    description: "Book a free 30-minute AI consultation.",
    images: ["/og-image.png"],
  },
};

export default function ContactPage() {
  return (
    <section className="pt-32 pb-24 px-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-6">
          Let&apos;s Talk
        </h1>
        <p className="text-center text-gray-400 text-lg mb-12">
          Let&apos;s discuss how AI can accelerate your business. Book a free
          30-minute consultation — no strings attached.
        </p>

        {/* Calendly inline booking widget */}
        <div className="mb-16">
          <h2 className="text-xl font-semibold text-center mb-4 text-gray-300">
            Book a Time Directly
          </h2>
          <div
            className="calendly-inline-widget rounded-2xl overflow-hidden border border-gray-800"
            data-url="https://calendly.com/signalhaus/30min"
            style={{ minWidth: "320px", height: "700px" }}
          />
          {/* Calendly widget script — loaded via Script component for performance */}
          <script
            type="text/javascript"
            src="https://assets.calendly.com/assets/external/widget.js"
            async
          />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-12">
          <div className="flex-1 h-px bg-gray-800" />
          <span className="text-gray-500 text-sm uppercase tracking-widest">or send a message</span>
          <div className="flex-1 h-px bg-gray-800" />
        </div>

        {/* Contact form */}
        <ContactForm />
      </div>
    </section>
  );
}
