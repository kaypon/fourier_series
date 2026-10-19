import {
  clampFreq,
  formatAmp,
  parseAmp,
  recipeTerms,
  toDegrees,
  MAX_TERMS,
  type Recipe,
  type Term,
} from "./fourier.ts";
import { preset, type Playground } from "./steps.ts";

/* The playground lives in the URL so a wave can be shared:
     ?r=saw&n=25             a recipe and how many circles
     ?t=1:1,1/2:2,1/3:3      hand-built terms as size:speed pairs
     ?t=0.62:1:90,0.2:2      …with a starting angle in degrees when not flat
   The opening state (square, 5 circles) is a clean URL. */

const RECIPES: Recipe[] = ["square", "saw", "triangle"];

function shareAmp(amp: number): string {
  const friendly = formatAmp(amp);
  const exact = Math.abs((parseAmp(friendly) ?? NaN) - Math.abs(amp)) < 1e-9;
  return (amp < 0 ? "-" : "") + (exact ? friendly : String(Number(Math.abs(amp).toFixed(4))));
}

export function toQuery(p: Playground): string {
  // A drawing travels as its terms; the faint drawing itself stays behind.
  if (p.recipe === "custom" || p.recipe === "drawn") {
    const terms = p.terms.slice(0, p.count).map((t) => {
      const deg = toDegrees(t.phase ?? 0);
      return `${shareAmp(t.amp)}:${t.freq}${deg ? `:${deg}` : ""}`;
    });
    return `t=${terms.join(",")}`;
  }
  if (p.recipe === "square" && p.count === 5) return "";
  return `r=${p.recipe}&n=${p.count}`;
}

function parseTerm(text: string): Term | null {
  const [a, f, d] = text.split(":");
  const amp = parseAmp(a ?? "");
  const freq = Number(f);
  const deg = d === undefined ? 0 : Number(d);
  if (amp === null || f === undefined || f.trim() === "" || !Number.isFinite(freq)) return null;
  if (!Number.isFinite(deg)) return null;
  const term: Term = { amp, freq: clampFreq(freq) };
  if (deg) term.phase = (deg * Math.PI) / 180;
  return term;
}

/* null when the URL doesn't describe a playground (or describes it badly). */
export function fromQuery(params: URLSearchParams): Playground | null {
  const t = params.get("t");
  if (t) {
    const terms = t.split(",").slice(0, MAX_TERMS).map(parseTerm);
    if (terms.some((x) => x === null)) return null;
    const given = terms as Term[];
    const rest = recipeTerms("square").slice(given.length);
    return { recipe: "custom", terms: [...given, ...rest].slice(0, MAX_TERMS), count: given.length };
  }
  const r = params.get("r") as Recipe | null;
  if (r && RECIPES.includes(r)) {
    const n = Math.round(Number(params.get("n") ?? 5));
    return preset(r, Number.isFinite(n) ? Math.min(MAX_TERMS, Math.max(1, n)) : 5);
  }
  return null;
}
