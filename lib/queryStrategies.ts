export const BRAND_STREAM_RULES = (brand: string) => [
  { value: `${brand} OR @${brand}`, tag: "brand_direct" },
  { value: `${brand} (love OR amazing OR awesome OR great OR recommend)`, tag: "brand_positive" },
  { value: `${brand} (sucks OR broken OR refund OR issue OR terrible OR hate)`, tag: "brand_negative" },
  { value: `#${brand.toLowerCase()}`, tag: "brand_hashtag" },
  { value: `${brand} (vs OR better than OR worse than)`, tag: "brand_comparison" },
];

export function buildQuery(brand: string): string {
  const lowercaseBrand = brand.toLowerCase();

  return [
    `(${brand} OR @${brand})`,                                                // Basic direct mentions
    `(#${lowercaseBrand})`,                                                   // Hashtag mentions
    `(${brand} (love OR amazing OR awesome OR great OR recommend))`,          // Positive sentiment
    `(${brand} (sucks OR broken OR refund OR issue OR terrible OR hate))`,    // Negative sentiment
    `(${brand} (vs OR "better than" OR "worse than"))`                        // Comparison sentiment
  ]
    .join(" OR ")
    .concat(" -is:retweet lang:en");
}

