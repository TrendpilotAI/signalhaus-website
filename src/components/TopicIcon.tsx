import { IconChart, IconCompass, IconFlag, IconQuestions, IconTalk } from "@/components/icons";
import type { LeadTopic } from "@/lib/leads/schema";

export default function TopicIcon({ topic }: { topic?: LeadTopic }) {
  switch (topic) {
    case "due-diligence":
      return <IconQuestions />;
    case "positioning":
      return <IconCompass />;
    case "prioritization":
      return <IconFlag />;
    case "data-driven-decisions":
      return <IconChart />;
    case "other":
    case undefined:
      return <IconTalk />;
    default: {
      const unhandled: never = topic;
      return unhandled;
    }
  }
}
