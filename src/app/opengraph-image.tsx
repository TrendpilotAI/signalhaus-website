import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og/card";
import { SITE } from "@/lib/site";

export const alt = `${SITE.name}. ${SITE.tagline}.`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function OpengraphImage() {
  return renderOgCard({
    eyebrow: SITE.tagline,
    title: "You don't have to have every answer yet.",
    footnote: "signalhaus.ai",
  });
}
