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
    `(@${brand})`,  // Direct @mentions for customer interactions
    `(#${lowercaseBrand} (product OR service OR app OR buy OR use OR review))`,  // Hashtag tied to product discussions
    `(${brand} (love OR amazing OR awesome OR great OR recommend) (product OR service OR app OR buy OR use OR experience))`,  // Positive, product-focused
    `(${brand} (sucks OR broken OR refund OR issue OR terrible OR hate) (product OR service OR app OR buy OR use OR experience))`,  // Negative, product-focused
    `(${brand} (vs OR "better than" OR "worse than") (competitor OR alternative OR switch))`  // Comparisons, implying product eval
  ]
  .join(" OR ")
  .concat(
    " -is:retweet lang:en",  // Originals in English
    " -giveaway -contest -promo -ad -sponsored",  // Exclude common spam
    " -has:mentions -is:retweet -is:reply"  
  );
}
