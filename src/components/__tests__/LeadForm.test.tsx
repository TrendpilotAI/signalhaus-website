import { isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import LeadForm, { LeadFormThanks, LeadSubmitButton, failureFocusTarget, focusInForm } from "../LeadForm";

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

const NATIVE_DISABLED = /<button[^>]*\sdisabled[\s=>]/;

describe("LeadSubmitButton", () => {
  it("is marked as busy with aria-disabled while a lead is sending, and never with disabled", () => {
    const html = renderToStaticMarkup(<LeadSubmitButton sending label="Send it to Nathan" />);
    expect(html).toContain('aria-disabled="true"');
    expect(html).not.toMatch(NATIVE_DISABLED);
    expect(html).toContain("Sending...");
  });

  it("carries no disabled state at all when nothing is sending", () => {
    const html = renderToStaticMarkup(<LeadSubmitButton sending={false} label="Send it to Nathan" />);
    expect(html).not.toContain("aria-disabled");
    expect(html).not.toMatch(NATIVE_DISABLED);
    expect(html).toContain("Send it to Nathan");
  });

  it("stays a submit button, which is how the form finds it again", () => {
    const html = renderToStaticMarkup(<LeadSubmitButton sending label="Send it to Nathan" />);
    expect(html).toMatch(/^<button type="submit"/);
  });
});

describe("failureFocusTarget", () => {
  it("picks the first field with an error, in the order the fields appear on the page", () => {
    expect(failureFocusTarget({ workingOn: "Too short.", email: "Not an email." })).toBe("email");
    expect(failureFocusTarget({ topic: "Pick one.", name: "Tell me your name." })).toBe("name");
    expect(failureFocusTarget({ workingOn: "Too short." })).toBe("workingOn");
  });

  it("picks the submit button when the send failed and no field is at fault", () => {
    expect(failureFocusTarget({})).toBe("submit");
  });

  it("picks the submit button for an error that belongs to the form as a whole", () => {
    expect(failureFocusTarget({ form: "Send the form fields as a JSON object." })).toBe("submit");
  });

  it("ignores a field whose error has been cleared", () => {
    expect(failureFocusTarget({ name: undefined, email: "Not an email." })).toBe("email");
    expect(failureFocusTarget({ name: undefined })).toBe("submit");
  });
});

describe("focusInForm", () => {
  // Stands in for the form element. It only answers the selector it is told to.
  function fakeForm(selector: string) {
    const node = { focus: vi.fn() };
    const querySelector = vi.fn((asked: string) => (asked === selector ? node : null));
    return { form: { querySelector } as unknown as HTMLFormElement, node, querySelector };
  }

  it("focuses the field with the error by its name", () => {
    const { form, node } = fakeForm('[name="email"]');
    focusInForm(form, "email");
    expect(node.focus).toHaveBeenCalledTimes(1);
  });

  it("focuses the submit button when that is the target", () => {
    const { form, node } = fakeForm('button[type="submit"]');
    focusInForm(form, "submit");
    expect(node.focus).toHaveBeenCalledTimes(1);
  });

  it("leaves focus alone when the target is not in the form", () => {
    const { form, node, querySelector } = fakeForm('[name="email"]');
    expect(() => focusInForm(form, "topic")).not.toThrow();
    expect(querySelector).toHaveBeenCalledWith('[name="topic"]');
    expect(node.focus).not.toHaveBeenCalled();
  });

  it("does nothing when the form is no longer on the page", () => {
    expect(() => focusInForm(null, "submit")).not.toThrow();
  });
});

describe("LeadForm", () => {
  it("renders every field a failed submission can send focus to, and the submit button", () => {
    const html = renderToStaticMarkup(<LeadForm source="contact" />);
    for (const field of ["name", "email", "company", "topic", "workingOn"]) {
      expect(html).toContain(`name="${field}"`);
    }
    expect(html.match(/<button type="submit"/g)).toHaveLength(1);
  });

  it("has no natively disabled control", () => {
    const html = renderToStaticMarkup(<LeadForm source="contact" />);
    expect(html).not.toMatch(/<(button|input|select|textarea)[^>]*\sdisabled[\s=>]/);
  });


  it("starts as the form, with nothing focused for the visitor", () => {
    const html = renderToStaticMarkup(<LeadForm source="contact" />);
    expect(html).toContain("<form");
    expect(html).toContain("Send it to Nathan");
    expect(html).not.toContain("Your note came through");
    expect(html).not.toContain("autofocus");
  });
});
