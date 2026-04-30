export const PRICE_SOURCE_CAPTURED_AT = "2026-04-30";

export const PRICE_CATALOG = {
  chatgptBusiness: {
    monthlyPriceUsd: 20,
    billingBasis: "por usuario / mes, facturación anual",
    sourceName: "OpenAI ChatGPT Business pricing",
    sourceUrl: "https://openai.com/business/chatgpt-pricing/"
  },
  claudeStandard: {
    monthlyPriceUsd: 20,
    billingBasis: "por seat / mes, facturación anual",
    sourceName: "Claude Team Standard pricing",
    sourceUrl: "https://claude.com/pricing"
  },
  claudePremium: {
    monthlyPriceUsd: 100,
    billingBasis: "por seat / mes, facturación anual",
    sourceName: "Claude Team Premium pricing",
    sourceUrl: "https://claude.com/pricing"
  }
};
