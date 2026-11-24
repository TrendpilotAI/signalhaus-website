import { IconArrowUpRight } from "@/components/icons";
import { OneNumberSheet } from "@/components/illustrations";
import { TOOLKIT_URL } from "@/lib/site";

/** Points at the free toolkit, which is the method behind the guides. */
export default function ToolkitCallout() {
  return (
    <div className="callout grid items-center gap-6 !p-6 md:grid-cols-[180px_1fr] md:!p-8">
      <OneNumberSheet className="hidden h-auto w-[180px] md:block" />
      <div className="flex flex-col items-start gap-4">
        <h3 className="h3">Start with the free toolkit</h3>
        <p className="max-w-[58ch] text-ink">
          My Data-Driven Decision-Making Toolkit is the method behind most of what&apos;s on this
          site. One primary goal, five metrics at most, one owner for each, and tests that take less
          than two weeks.
        </p>
        <a href={TOOLKIT_URL} target="_blank" rel="noopener" className="btn btn-secondary">
          Open the toolkit
          <IconArrowUpRight width={18} height={18} />
        </a>
      </div>
    </div>
  );
}
