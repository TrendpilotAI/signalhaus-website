"use client";

import { useState, useEffect } from "react";

const testimonials = [
  {
    quote:
      "We went from dreading quarter-end to not noticing it. The pipeline just runs. SignalHaus delivered in 14 days what our internal team had been scoping for 18 months.",
    author: "SVP of Operations",
    company: "Fortune 500 Wealth Manager",
    industry: "Financial Services",
    initials: "SO",
  },
  {
    quote:
      "Our reps went from guessing to knowing. The signal layer is now core to how we sell. First-call conversions are up 22% and the team actually looks forward to prospecting again.",
    author: "Head of Distribution",
    company: "Mid-Market Asset Manager",
    industry: "Investment Management",
    initials: "HD",
  },
  {
    quote:
      "Prospects that ghosted us during POC are now live customers. Cutting onboarding from 6 weeks to 3 days was a competitive moat we didn't realize we needed.",
    author: "VP of Customer Success",
    company: "Series C Enterprise SaaS",
    industry: "B2B Software",
    initials: "VC",
  },
  {
    quote:
      "Our compliance team now actually does compliance work instead of data entry. That was the whole point. SignalHaus understood the problem before we finished explaining it.",
    author: "Chief Compliance Officer",
    company: "Regional Insurance Group",
    industry: "Insurance",
    initials: "CC",
  },
  {
    quote:
      "The ROI conversation was a non-issue. We saw measurable impact within the first month. I've worked with a lot of consultants — SignalHaus is the rare kind that ships.",
    author: "Chief Data Officer",
    company: "Global Financial Institution",
    industry: "Financial Services",
    initials: "CD",
  },
];

export default function TestimonialCarousel() {
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const goTo = (index: number) => {
    if (isAnimating || index === current) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrent(index);
      setIsAnimating(false);
    }, 200);
  };

  const next = () => goTo((current + 1) % testimonials.length);
  const prev = () => goTo((current - 1 + testimonials.length) % testimonials.length);

  // Auto-advance
  useEffect(() => {
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  const t = testimonials[current];

  return (
    <section className="py-24 px-6 bg-gray-900/50">
      <div className="max-w-4xl mx-auto">
        <p className="text-center text-sm uppercase tracking-widest text-indigo-400 mb-12">
          What Clients Say
        </p>

        <div
          className={`transition-opacity duration-200 ${isAnimating ? "opacity-0" : "opacity-100"}`}
        >
          {/* Quote */}
          <blockquote className="text-center">
            <div className="text-4xl text-indigo-500 mb-6 leading-none">&ldquo;</div>
            <p className="text-xl md:text-2xl text-gray-200 leading-relaxed font-light max-w-3xl mx-auto">
              {t.quote}
            </p>
            <div className="mt-8 flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold text-white">
                {t.initials}
              </div>
              <div>
                <p className="font-semibold text-white">{t.author}</p>
                <p className="text-sm text-gray-400">{t.company} &middot; {t.industry}</p>
              </div>
            </div>
          </blockquote>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-6 mt-12">
          <button
            onClick={prev}
            className="w-10 h-10 rounded-full border border-gray-700 hover:border-indigo-500 flex items-center justify-center text-gray-400 hover:text-white transition"
            aria-label="Previous testimonial"
          >
            ←
          </button>

          <div className="flex gap-2">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i === current
                    ? "bg-indigo-400 w-6"
                    : "bg-gray-600 hover:bg-gray-400"
                }`}
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={next}
            className="w-10 h-10 rounded-full border border-gray-700 hover:border-indigo-500 flex items-center justify-center text-gray-400 hover:text-white transition"
            aria-label="Next testimonial"
          >
            →
          </button>
        </div>
      </div>
    </section>
  );
}
