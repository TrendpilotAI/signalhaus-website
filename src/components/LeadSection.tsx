import type { ReactNode } from "react";
import LeadForm, { type LeadFormProps } from "@/components/LeadForm";
import { PRIMARY_CTA } from "@/lib/site";

interface LeadSectionProps extends LeadFormProps {
  id?: string;
  children?: ReactNode;
}

/** The one call to action as a heading, a short note beside it, and the lead form in a tile. */
export default function LeadSection({ id, children, ...form }: LeadSectionProps) {
  return (
    <section id={id} className="section scroll-mt-16" aria-labelledby={id ? `${id}-heading` : undefined}>
      <div className="page grid gap-10 lg:grid-cols-[5fr_7fr] lg:gap-16">
        <div className="flex flex-col gap-6">
          <h2 id={id ? `${id}-heading` : undefined} className="h2">
            {PRIMARY_CTA.label}
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
