import type { Unit } from '../constants/units';

export interface ParsedIngredient {
  name: string;
  quantity: string; // empty string if not found
  unit: string;     // empty string if not found
}

// Maps text aliases (lowercase) → app Unit value + sort priority.
// Priority: 1=weight, 2=volume, 3=cooking-measure, 4=container/count
// Empty value '' means: strip from name but do not use as a unit (e.g. "pkt")
type UnitEntry = { value: Unit | ''; priority: number };

const UNIT_ALIAS_MAP: Record<string, UnitEntry> = {
  // ── Weight ───────────────────────────────────────────────────────── priority 1
  g:             { value: 'g',      priority: 1 },
  gr:            { value: 'g',      priority: 1 },
  gram:          { value: 'g',      priority: 1 },
  gramm:         { value: 'g',      priority: 1 },
  grammaa:       { value: 'g',      priority: 1 },
  grammat:       { value: 'g',      priority: 1 },
  kg:            { value: 'kg',     priority: 1 },
  kilo:          { value: 'kg',     priority: 1 },
  kiloa:         { value: 'kg',     priority: 1 },
  kilogramma:    { value: 'kg',     priority: 1 },
  kilogrammaa:   { value: 'kg',     priority: 1 },
  // ── Volume ───────────────────────────────────────────────────────── priority 2
  ml:            { value: 'ml',     priority: 2 },
  millilitra:    { value: 'ml',     priority: 2 },
  millilitraa:   { value: 'ml',     priority: 2 },
  cl:            { value: 'ml',     priority: 2 }, // centiliter → ml
  dl:            { value: 'dl',     priority: 2 },
  desilitraa:    { value: 'dl',     priority: 2 },
  l:             { value: 'l',      priority: 2 },
  litra:         { value: 'l',      priority: 2 },
  litraa:        { value: 'l',      priority: 2 },
  // ── Cooking measures ─────────────────────────────────────────────── priority 3
  tl:                { value: 'tsp',  priority: 3 },
  tsp:               { value: 'tsp',  priority: 3 },
  teelusikka:        { value: 'tsp',  priority: 3 },
  teelusikallista:   { value: 'tsp',  priority: 3 },
  rkl:               { value: 'tbsp', priority: 3 },
  tbsp:              { value: 'tbsp', priority: 3 },
  ruokalusikka:      { value: 'tbsp', priority: 3 },
  ruokalusikallista: { value: 'tbsp', priority: 3 },
  cup:               { value: 'cup',  priority: 3 },
  kuppi:             { value: 'cup',  priority: 3 },
  kuppia:            { value: 'cup',  priority: 3 },
  oz:                { value: 'oz',   priority: 3 },
  lb:                { value: 'lb',   priority: 3 },
  // ── Container / count ────────────────────────────────────────────── priority 4
  kpl:        { value: 'piece', priority: 4 },
  kappale:    { value: 'piece', priority: 4 },
  kappaletta: { value: 'piece', priority: 4 },
  pcs:        { value: 'piece', priority: 4 },
  prk:        { value: 'jar',   priority: 4 },
  purkki:     { value: 'jar',   priority: 4 },
  purkkia:    { value: 'jar',   priority: 4 },
  cm:         { value: 'cm',    priority: 4 },
  // ── Strip-only (known packaging, but no matching app Unit) ────────── priority 5
  // These are stripped from the name and can donate their qty when no better match exists.
  pkt:        { value: '', priority: 5 },
  ps:         { value: '', priority: 5 },
  pss:        { value: '', priority: 5 },
  rs:         { value: '', priority: 5 },
  rasia:      { value: '', priority: 5 },
  pussi:      { value: '', priority: 5 },
  pussia:     { value: '', priority: 5 },
  paketti:    { value: '', priority: 5 },
  pakettia:   { value: '', priority: 5 },
  annos:      { value: '', priority: 5 },
  annosta:    { value: '', priority: 5 },
};

const UNICODE_FRACTIONS: Record<string, string> = {
  '½': '1/2', '¼': '1/4', '¾': '3/4',
  '⅓': '1/3', '⅔': '2/3',
  '⅛': '1/8', '⅜': '3/8', '⅝': '5/8', '⅞': '7/8',
};

function normalizeInput(s: string): string {
  return s.replace(/[½¼¾⅓⅔⅛⅜⅝⅞]/g, (c) => UNICODE_FRACTIONS[c] ?? c);
}

function normalizeQuantity(q: string): string {
  // Finnish uses comma as decimal separator — normalise to dot
  return q.replace(',', '.');
}

// Matches integers, decimals (1.5 or 1,5), fractions (1/2), and ranges (2-3)
const NUM_PAT = '\\d+(?:[,.]\\d+)?(?:[/\\-]\\d+(?:[,.]\\d+)?)?';

interface FoundPair {
  qty: string;
  unitValue: Unit | '';
  priority: number;
  start: number;
  end: number;
}

/**
 * Parse a single ingredient line (already stripped of list prefixes) into
 * { name, quantity, unit }.
 *
 * Examples:
 *   "2 dl kaurakermaa"           → { name: "kaurakermaa", quantity: "2", unit: "dl" }
 *   "1 sipuli"                   → { name: "sipuli", quantity: "1", unit: "" }
 *   "1 pkt/230 g tomaattimurskaa"→ { name: "tomaattimurskaa", quantity: "230", unit: "g" }
 *   "130 g/1 prk vegaanista pestoa"→{ name: "vegaanista pestoa", quantity: "130", unit: "g" }
 *   "1 rs (250 g) kirsikkatomaatteja" → { name: "kirsikkatomaatteja", quantity: "250", unit: "g" }
 */
export function parseIngredientLine(rawLine: string): ParsedIngredient {
  // Strip common list prefixes, normalise unicode fractions
  const line = normalizeInput(
    rawLine.replace(/^(\d+[.)]\s*|[-*•–]\s*)/, '').trim()
  );

  if (!line) return { name: rawLine.trim(), quantity: '', unit: '' };

  // Build regex from alias map — sort longest-first to avoid partial matches
  const sortedAliases = Object.keys(UNIT_ALIAS_MAP).sort((a, b) => b.length - a.length);
  const aliasRxStr = sortedAliases.join('|');

  // Match: NUMBER (optional space) KNOWN_ALIAS, followed by separator or end
  const pairRx = new RegExp(
    `(${NUM_PAT})\\s*(${aliasRxStr})(?=[\\s,./()\\[\\]]|$)`,
    'gi'
  );

  const found: FoundPair[] = [];
  let m: RegExpExecArray | null;

  pairRx.lastIndex = 0;
  while ((m = pairRx.exec(line)) !== null) {
    const alias = m[2].toLowerCase();
    const entry = UNIT_ALIAS_MAP[alias];
    if (entry) {
      found.push({
        qty: normalizeQuantity(m[1]),
        unitValue: entry.value,
        priority: entry.priority,
        start: m.index,
        end: m.index + m[0].length,
      });
    }
  }

  if (found.length === 0) {
    // No unit match at all — try a leading number as the quantity
    const leadRx = new RegExp(`^(${NUM_PAT})(?:\\s+([\\s\\S]*))?$`);
    const lm = line.match(leadRx);
    if (lm && lm[2]) {
      return { name: lm[2].trim(), quantity: normalizeQuantity(lm[1]), unit: '' };
    }
    return { name: line, quantity: '', unit: '' };
  }

  // Pick the best known-unit match (lowest priority number, i.e. most precise)
  const known = found.filter((p) => p.unitValue !== '');
  const best = known.length > 0
    ? known.reduce((a, b) => (a.priority <= b.priority ? a : b))
    : null;

  // Fallback qty when no known unit: use qty from the first strip-only match
  const stripOnly = found.filter((p) => p.unitValue === '');
  const fallbackQty = !best && stripOnly.length > 0 ? stripOnly[0].qty : null;

  // The name is everything after the rightmost matched pair end
  const rightEnd = found.reduce((max, p) => Math.max(max, p.end), 0);
  let name = line.slice(rightEnd).replace(/^[\s,./\-–()[\]]+/, '').trim();

  // If name is empty (e.g. unit appeared at the very end), strip all pairs and cleanup
  if (!name) {
    name = line
      .replace(new RegExp(`(${NUM_PAT})\\s*(${aliasRxStr})(?=[\\s,./()\\[\\]]|$)`, 'gi'), ' ')
      .replace(/\([^)]*\)/g, ' ')
      .replace(/[/\-–]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  if (best) {
    return { name: name || line, quantity: best.qty, unit: best.unitValue as string };
  }

  // Strip-only match: we have a qty but no app unit
  if (fallbackQty) {
    return { name: name || line, quantity: fallbackQty, unit: '' };
  }

  return { name: name || line, quantity: '', unit: '' };
}
