import type { ReactNode } from "react";
import LeadForm, { type LeadFormProps } from "@/components/LeadForm";

interface LeadSectionProps extends LeadFormProps {
  id?: string;
  heading: ReactNode;
  children?: ReactNode;
}

/** Heading and a short note on the left, the lead form in a tile on the right. */
export default function LeadSection({ id, heading, children, ...form }: LeadSectionProps) {
  return (
    <section id={id} className="section scroll-mt-8" aria-labelledby={id ? `${id}-heading` : undefined}>
      <div className="page grid gap-10 lg:grid-cols-[5fr_7fr] lg:gap-16">
        <div className="flex flex-col gap-6">
          <h2 id={id ? `${id}-heading` : undefined} className="h2">
            {heading}
          </h2>
          {children}
        </div>
        <div className="tile !p-6 md:!p-8">
          <LeadForm {...form} />
        </div>
      </div>
    </section>
  );
}
