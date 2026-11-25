import { describe, expect, it, vi } from "vitest";
import { closeMobileMenuOnEscape, isMenuCloseKey } from "../Header";

describe("isMenuCloseKey", () => {
  it("closes the mobile menu on Escape", () => {
    expect(isMenuCloseKey("Escape")).toBe(true);
  });

  it("leaves the menu alone for other keys", () => {
    expect(isMenuCloseKey("Enter")).toBe(false);
    expect(isMenuCloseKey("Tab")).toBe(false);
    expect(isMenuCloseKey(" ")).toBe(false);
  });
});

describe("closeMobileMenuOnEscape", () => {
  function setup(activeInsideMenu: boolean) {
    const link = {} as Element;
    const outside = {} as Element;
    const menu = {
      contains: (node: Node) => activeInsideMenu && node === (link as unknown as Node),
    };
    const toggle = { focus: vi.fn() };
    const close = vi.fn();
    const preventDefault = vi.fn();
    return {
      link,
      outside,
      menu,
      toggle,
      close,
      preventDefault,
      run: (key: string, activeElement: Element | null) =>
        closeMobileMenuOnEscape({
          key,
          activeElement,
          menu,
          toggle,
          close,
          preventDefault,
        }),
    };
  }

  it("returns focus to the toggle after Escape when focus was inside the menu", () => {
    const { link, toggle, close, preventDefault, run } = setup(true);

    expect(run("Escape", link)).toBe(true);
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
    expect(toggle.focus).toHaveBeenCalledTimes(1);
  });

  it("closes on Escape without moving focus when focus was outside the menu", () => {
    const { outside, toggle, close, preventDefault, run } = setup(false);

    expect(run("Escape", outside)).toBe(true);
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
    expect(toggle.focus).not.toHaveBeenCalled();
  });

  it("ignores keys that are not Escape", () => {
    const { link, toggle, close, preventDefault, run } = setup(true);

    expect(run("Tab", link)).toBe(false);
    expect(preventDefault).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();
    expect(toggle.focus).not.toHaveBeenCalled();
  });
});
