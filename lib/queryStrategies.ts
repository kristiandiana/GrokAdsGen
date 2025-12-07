export const getBrandQueryStrategies = (brand: string) => {
  const lowerBrand = brand.toLowerCase();

  return [
    // Direct mentions
    `${brand} OR @${brand}`,
    
    // Positive narratives
    `${brand} (love OR amazing OR awesome OR great OR recommend)`,

    // Negative narratives
    `${brand} (sucks OR broken OR refund OR issue OR terrible OR hate)`,

    // Hashtag communities
    `#${lowerBrand}`,

    // Competitor comparisons
    `${brand} (vs OR better than OR worse than)`,

    // Slang/stock/crypto culture if relevant
    `${brand} (stonk OR bagholder OR 🚀 OR moon)`
  ];
};
