import { describe, expect, it } from "vitest";
import { isMenuCloseKey } from "../Header";

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
