import { isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import LeadForm, { LeadFormThanks } from "../LeadForm";

type ElementProps = { children?: ReactNode; ref?: unknown; tabIndex?: number };

/** Finds the first host element of a given tag in what a component returned. */
function findHostElement(node: ReactNode, tag: string): ReactElement<ElementProps> | null {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findHostElement(child, tag);
      if (found) return found;
    }
    return null;
  }
  if (!isValidElement<ElementProps>(node)) return null;
  if (node.type === tag) return node;
  return findHostElement(node.props.children, tag);
}

describe("LeadFormThanks", () => {
  // The suite has no DOM, so this plays React's part: React calls an element's
  // ref with the node once it is on the page.
  it("moves focus to the thank-you heading when it appears", () => {
    const heading = findHostElement(LeadFormThanks({ firstName: "Ada" }), "h3");
    expect(heading).not.toBeNull();

    const ref = heading?.props.ref;
    expect(ref).toBeTypeOf("function");

    const node = { focus: vi.fn() };
    (ref as (node: unknown) => void)(node);
    expect(node.focus).toHaveBeenCalledTimes(1);
  });

  it("does nothing when React clears the ref on the way out", () => {
    const heading = findHostElement(LeadFormThanks({ firstName: "Ada" }), "h3");
    expect(() => (heading?.props.ref as (node: unknown) => void)(null)).not.toThrow();
  });

  it("makes the heading focusable from script without adding it to the tab order", () => {
    const html = renderToStaticMarkup(<LeadFormThanks firstName="Ada" />);
    expect(html).toMatch(/<h3[^>]*\stabindex="-1"[^>]*>Thanks, Ada\. Your note came through\.<\/h3>/);
  });

  it("does not lean on a live region that is only added to the page on success", () => {
    const html = renderToStaticMarkup(<LeadFormThanks firstName="Ada" />);
    expect(html).not.toContain("aria-live");
    expect(html).not.toContain('role="status"');
  });

  it("still reads well when there is no name to greet", () => {
    const html = renderToStaticMarkup(<LeadFormThanks firstName="" />);
    expect(html).toContain("Thanks. Your note came through.");
  });
});

describe("LeadForm", () => {
  it("starts as the form, with nothing focused for the visitor", () => {
    const html = renderToStaticMarkup(<LeadForm source="contact" />);
    expect(html).toContain("<form");
    expect(html).toContain("Send it to Nathan");
    expect(html).not.toContain("Your note came through");
    expect(html).not.toContain("autofocus");
  });
});
