import { recipeTerms, MAX_TERMS, type Recipe, type Term } from "./fourier.ts";

/* The playground keeps a full list of MAX_TERMS circles and shows the first
   `count`. Hand edits change entries in that list (and flip the recipe to
   "custom"), so they survive sliding the circle count down and back up. */
export type Playground = {
  /** "drawn": terms fitted to a drawing, which is kept as `shape`. */
  recipe: Recipe | "custom" | "drawn";
  terms: Term[];
  count: number;
  /** One period of the drawing's heights (see fitDrawing). */
  shape?: number[];
};

export function preset(recipe: Recipe, count: number): Playground {
  return { recipe, terms: recipeTerms(recipe), count };
}

/* Custom terms up front, the square recipe after them for the slider to reveal. */
function custom(prefix: Term[], count: number): Playground {
  const rest = recipeTerms("square").slice(prefix.length);
  return { recipe: "custom", terms: [...prefix, ...rest].slice(0, MAX_TERMS), count };
}

/* What each ▶ button in the explanation sets the playground to. */
export const STEPS = {
  one: () => preset("square", 1),
  bigger: () => custom([{ amp: 2, freq: 1 }], 1),
  faster: () => custom([{ amp: 1, freq: 3 }], 1),
  two: () => preset("square", 2),
  five: () => preset("square", 5),
  nine: () => preset("square", 9),
  twentyFive: () => preset("square", 25),
  hundred: () => preset("square", 100),
  sneakTwo: (): Playground => {
    const [first, ...rest] = recipeTerms("square");
    return {
      recipe: "custom",
      terms: [first, { amp: 1 / 2, freq: 2 }, ...rest].slice(0, MAX_TERMS),
      count: 6,
    };
  },
  bigThird: () => custom([{ amp: 1, freq: 1 }, { amp: 1, freq: 3 }], 2),
  saw: () => preset("saw", 25),
  triangle: () => preset("triangle", 9),
} satisfies Record<string, () => Playground>;

export type StepId = keyof typeof STEPS;
