/**
 * Which state a ZIP code belongs to, by its first three digits.
 *
 * This only powers a gentle "double-check this?" hint, never a hard error,
 * so a few odd edge cases (ZIPs that cross state lines) are acceptable.
 * Ranges are inclusive. Earlier entries win, so the small exceptions come first.
 */
const RANGES: ReadonlyArray<readonly [from: number, to: number, states: string]> = [
  // exceptions carved out of a bigger neighbor
  [55, 55, 'MA'], [201, 201, 'VA'], [340, 340, 'AA'], [569, 569, 'DC'], [733, 733, 'TX'], [885, 885, 'TX'],
  [5, 5, 'NY'], [6, 7, 'PR'], [8, 8, 'VI'], [9, 9, 'PR'],
  [10, 27, 'MA'], [28, 29, 'RI'], [30, 38, 'NH'], [39, 49, 'ME'], [50, 59, 'VT'],
  [60, 69, 'CT'], [70, 89, 'NJ'], [90, 99, 'AE'], [100, 149, 'NY'], [150, 196, 'PA'],
  [197, 199, 'DE'], [200, 205, 'DC'], [206, 219, 'MD'], [220, 246, 'VA'], [247, 268, 'WV'],
  [270, 289, 'NC'], [290, 299, 'SC'], [300, 319, 'GA'], [320, 349, 'FL'], [350, 369, 'AL'],
  [370, 385, 'TN'], [386, 397, 'MS'], [398, 399, 'GA'], [400, 427, 'KY'], [430, 459, 'OH'],
  [460, 479, 'IN'], [480, 499, 'MI'], [500, 528, 'IA'], [530, 549, 'WI'], [550, 567, 'MN'],
  [570, 577, 'SD'], [580, 588, 'ND'], [590, 599, 'MT'], [600, 629, 'IL'], [630, 658, 'MO'],
  [660, 679, 'KS'], [680, 693, 'NE'], [700, 714, 'LA'], [716, 729, 'AR'], [730, 749, 'OK'],
  [750, 799, 'TX'], [800, 816, 'CO'], [820, 831, 'WY'], [832, 838, 'ID'], [840, 847, 'UT'],
  [850, 865, 'AZ'], [870, 884, 'NM'], [889, 898, 'NV'], [900, 961, 'CA'], [962, 966, 'AP'],
  [967, 968, 'HI'], [969, 969, 'GU MP AS'], [970, 979, 'OR'], [980, 994, 'WA'], [995, 999, 'AK'],
];

/** The state codes a ZIP's prefix belongs to, or null when the prefix isn't one we know. */
export function statesForZip(zip: string): string[] | null {
  const prefix = Number.parseInt(zip.slice(0, 3), 10);
  if (!/^\d{3}/.test(zip) || Number.isNaN(prefix)) return null;
  const hit = RANGES.find(([from, to]) => prefix >= from && prefix <= to);
  return hit ? hit[2].split(' ') : null;
}

/** True when we know the ZIP's state and it isn't the one given. */
export function zipStateMismatch(zip: string, state: string): string | null {
  const states = statesForZip(zip);
  if (!states || states.includes(state)) return null;
  return states[0];
}
