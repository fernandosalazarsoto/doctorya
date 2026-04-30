export const PRICE_SOURCE_CAPTURED_AT = "2026-04-30";

export const PRICE_CATALOG = {
  chatgptBusiness: {
    pricesUsdPerMonth: {
      annual: 20,
      monthly: 25
    },
    billingBasis: "por usuario / mes. USD 20 con facturacion anual; USD 25 con facturacion mensual.",
    sourceName: "OpenAI ChatGPT Business pricing",
    sourceUrl: "https://openai.com/business/chatgpt-pricing/"
  },
  claudeStandard: {
    pricesUsdPerMonth: {
      annual: 20,
      monthly: 25
    },
    billingBasis: "por seat / mes. USD 20 con facturacion anual; USD 25 con facturacion mensual.",
    sourceName: "Claude Team Standard pricing",
    sourceUrl: "https://claude.com/pricing"
  },
  claudePremium: {
    pricesUsdPerMonth: {
      annual: 100,
      monthly: 125
    },
    billingBasis: "por seat / mes. USD 100 con facturacion anual; USD 125 con facturacion mensual.",
    sourceName: "Claude Team Premium pricing",
    sourceUrl: "https://claude.com/pricing"
  }
};
