// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BracketView } from "./BracketView";
import { seedBracket } from "../tournament";
import type { Food } from "../types";

describe("BracketView", () => {
  it("renders every food in the seeded bracket", () => {
    const foods: Food[] = Array.from({ length: 4 }, (_, i) => ({
      id: `f${i}`,
      name: `Food${i}`,
      emoji: "🍽️",
      category: "fast-food" as const,
    }));
    const bracket = seedBracket(foods);
    render(<BracketView bracket={bracket} />);

    expect(screen.getAllByText(/Food[0-3]/)).toHaveLength(4);
  });
});
