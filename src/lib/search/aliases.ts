/**
 * Other ways people write the same thing: English ↔ BM food words (for
 * tourists) and place abbreviations. A search also runs for each variant.
 * Keys and values are lowercase; matching is whole-word.
 */
const ALIASES: Record<string, string[]> = {
  // Places
  kl: ["kuala lumpur"],
  pj: ["petaling jaya"],
  sa: ["shah alam"],
  // Food (English → BM, and common spellings)
  satay: ["sate"],
  sate: ["satay"],
  chicken: ["ayam"],
  beef: ["daging"],
  meat: ["daging"],
  fish: ["ikan"],
  rice: ["nasi"],
  noodle: ["mee"],
  noodles: ["mee"],
  mi: ["mee"],
  grilled: ["bakar"],
  bbq: ["bakar"],
  fried: ["goreng"],
  drink: ["air"],
  drinks: ["air"],
  juice: ["jus", "air"],
  dessert: ["pencuci mulut"],
  cake: ["kek"],
  cakes: ["kek"],
  fruit: ["buah"],
  egg: ["telur"],
  coconut: ["kelapa"],
  corn: ["jagung"],
  peanut: ["kacang"],
  durian: ["durian"],
};

/** The query plus its alternative spellings, e.g. "chicken satay" → also "ayam sate". */
export function queryVariants(query: string): string[] {
  const q = query.trim().toLowerCase();
  const words = q.split(/\s+/);
  const variants = new Set([q]);
  words.forEach((word, i) => {
    for (const alt of ALIASES[word] ?? []) {
      // Swap just this word, and also try the alternative on its own.
      variants.add(
        [...words.slice(0, i), alt, ...words.slice(i + 1)].join(" "),
      );
      variants.add(alt);
    }
  });
  // Every word swapped at once ("chicken satay" → "ayam sate").
  const allSwapped = words.map((w) => ALIASES[w]?.[0] ?? w).join(" ");
  variants.add(allSwapped);
  return [...variants].slice(0, 6);
}
