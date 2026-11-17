import fs from "node:fs";
import path from "node:path";

/**
 * World-top publications: full paper lists of CORE A* conferences and Q1 journals, crawled from the
 * venues' official sources by scripts/crawl-papers.mjs into content/papers/papers.json.
 */

export type Venue = { slug: string; name: string; full: string; kind: "journal" | "conference"; tier: "Q1" | "A*" };
export type Paper = {
  id: string;
  title: string;
  authors: string;
  venue: string; // venue slug
  eventYear: number;
  year: number;
  month: number;
  domains: string[];
  url: string;
};
type PapersFile = { generated: string; venues: Venue[]; items: Paper[] };

// Paper titles come with LaTeX ("$\alpha$-DPO", "$10^{6}$") and sometimes emoji; show them as plain text.
const GREEK: Record<string, string> = {
  alpha: "α", beta: "β", gamma: "γ", delta: "δ", epsilon: "ε", varepsilon: "ε", zeta: "ζ", eta: "η", theta: "θ",
  iota: "ι", kappa: "κ", lambda: "λ", mu: "μ", nu: "ν", xi: "ξ", pi: "π", rho: "ρ", sigma: "σ", tau: "τ",
  phi: "φ", varphi: "φ", chi: "χ", psi: "ψ", omega: "ω", Gamma: "Γ", Delta: "Δ", Theta: "Θ", Lambda: "Λ",
  Xi: "Ξ", Pi: "Π", Sigma: "Σ", Phi: "Φ", Psi: "Ψ", Omega: "Ω",
  times: "×", cdot: "·", leq: "≤", geq: "≥", le: "≤", ge: "≥", neq: "≠", approx: "≈", pm: "±", infty: "∞",
  rightarrow: "→", to: "→", leftarrow: "←", leftrightarrow: "↔", Rightarrow: "⇒", ell: "ℓ", partial: "∂",
  nabla: "∇", sim: "∼", star: "⋆", ldots: "…", dots: "…", cdots: "⋯", circ: "∘", in: "∈", sum: "∑", prod: "∏",
};
const SUP: Record<string, string> = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "+": "⁺", "-": "⁻", n: "ⁿ", i: "ⁱ" };
const SUB: Record<string, string> = { "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉", "+": "₊", "-": "₋", n: "ₙ", i: "ᵢ", t: "ₜ", k: "ₖ", x: "ₓ" };
const script = (s: string, map: Record<string, string>, mark: string) =>
  [...s].every((c) => map[c]) ? [...s].map((c) => map[c]).join("") : s.length === 1 ? `${mark}${s}` : `${mark}(${s})`;

export function plainTitle(raw: string): string {
  if (!/[$\\\u{1F300}-\u{1FAFF}]/u.test(raw)) return raw;
  const math = (m: string) =>
    m
      .replace(/\\(?:text|textit|textbf|mathrm|mathbf|mathit|mathcal|mathbb|mathsf|operatorname|boldsymbol)\{([^{}]*)\}/g, "$1")
      .replace(/\\([A-Za-z]+)/g, (_, c: string) => GREEK[c] ?? c)
      .replace(/\^\{([^{}]*)\}|\^(\w)/g, (_, a: string, b: string) => script(a ?? b, SUP, "^"))
      .replace(/_\{([^{}]*)\}|_(\w)/g, (_, a: string, b: string) => script(a ?? b, SUB, "_"))
      .replace(/\\[ ,;!]/g, " ")
      .replace(/[{}]/g, "");
  return raw
    .replace(/\$\$?([^$]+)\$\$?/g, (_, m: string) => math(m))
    .replace(/\\\$/g, "$")
    .replace(/[\u{1F300}-\u{1FAFF}☀-➿️]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

let cache: PapersFile | null = null;
export function loadPapers(): PapersFile {
  if (cache) return cache;
  try {
    const file = JSON.parse(fs.readFileSync(path.join(process.cwd(), "content", "papers", "papers.json"), "utf8")) as PapersFile;
    for (const p of file.items) p.title = plainTitle(p.title);
    cache = file;
  } catch {
    cache = { generated: "", venues: [], items: [] };
  }
  return cache;
}

export const PAGE_SIZE = 30;

export type PaperQuery = { q?: string; kind?: string; venue?: string; domain?: string; year?: number; page?: number };

/** Year shown in the badge: the conference edition, or the publication year for journals. */
export const paperYear = (p: Paper, kind: Venue["kind"] | undefined) => (kind === "journal" ? p.year : p.eventYear);
/** Short label like "ICLR'25". */
export const paperLabel = (p: Paper, v: Venue | undefined) => `${v?.name ?? p.venue}'${String(paperYear(p, v?.kind)).slice(-2)}`;

/** Filter + paginate on the server so the 40k-row list never reaches the browser. */
export function queryPapers({ q, kind, venue, domain, year, page = 1 }: PaperQuery) {
  const { venues, items } = loadPapers();
  const vmap = new Map(venues.map((v) => [v.slug, v]));
  const needle = q?.trim().toLowerCase();
  const base = items.filter((p) => {
    if (kind && vmap.get(p.venue)?.kind !== kind) return false;
    if (venue && p.venue !== venue) return false;
    if (needle && !(p.title.toLowerCase().includes(needle) || p.authors.toLowerCase().includes(needle))) return false;
    return true;
  });
  const yearOk = (p: Paper) => !year || paperYear(p, vmap.get(p.venue)?.kind) === year;
  const filtered = base.filter((p) => (!domain || p.domains.includes(domain)) && yearOk(p));

  const domainCounts: Record<string, number> = {};
  for (const p of base) if (yearOk(p)) for (const d of p.domains) domainCounts[d] = (domainCounts[d] || 0) + 1;
  const yearCounts: Record<number, number> = {};
  for (const p of base) {
    if (domain && !p.domains.includes(domain)) continue;
    const y = paperYear(p, vmap.get(p.venue)?.kind);
    yearCounts[y] = (yearCounts[y] || 0) + 1;
  }

  const counts = new Map<string, number>();
  for (const p of items) counts.set(p.venue, (counts.get(p.venue) || 0) + 1);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const cur = Math.min(Math.max(1, page), pages);
  return {
    total: filtered.length,
    all: items.length,
    page: cur,
    pages,
    rows: filtered.slice((cur - 1) * PAGE_SIZE, cur * PAGE_SIZE).map((p) => ({ ...p, venueInfo: vmap.get(p.venue)! })),
    domainCounts,
    yearCounts,
    venueCounts: venues.map((v) => ({ ...v, count: counts.get(v.slug) || 0 })),
    generated: loadPapers().generated,
  };
}

export type HomePaper = Paper & { venueInfo: Venue };

/** Round-robin over venues (items are newest first) so one venue does not fill the whole list. */
function diverse(list: Paper[], n: number): Paper[] {
  const groups = new Map<string, Paper[]>();
  for (const p of list) {
    const g = groups.get(p.venue) || [];
    if (g.length < n) g.push(p);
    groups.set(p.venue, g);
  }
  const out: Paper[] = [];
  for (let i = 0; out.length < n; i++) {
    let any = false;
    for (const g of groups.values()) {
      if (g[i]) {
        out.push(g[i]);
        any = true;
        if (out.length === n) break;
      }
    }
    if (!any) break;
  }
  return out;
}

/** Homepage panel "Bài báo quốc tế": a few diverse recent papers for "all" and for every topic. */
export function homePapers(perTopic = 4): { byTopic: Record<string, HomePaper[]>; topics: string[]; total: number } {
  const { venues, items } = loadPapers();
  const vmap = new Map(venues.map((v) => [v.slug, v]));
  const wrap = (ps: Paper[]) => ps.map((p) => ({ ...p, venueInfo: vmap.get(p.venue)! })).filter((p) => p.venueInfo);
  const counts = new Map<string, number>();
  for (const p of items) for (const d of p.domains) counts.set(d, (counts.get(d) || 0) + 1);
  const topics = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([d]) => d);
  const byTopic: Record<string, HomePaper[]> = { "": wrap(diverse(items, perTopic)) };
  for (const t of topics) byTopic[t] = wrap(diverse(items.filter((p) => p.domains.includes(t)), perTopic));
  return { byTopic, topics, total: items.length };
}
