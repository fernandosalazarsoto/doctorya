import { PRICE_CATALOG } from "./priceSources.js";

export const PRODUCT_KEYS = {
  claudeStandard: "claudeStandard",
  claudePremium: "claudePremium"
};

export const PRODUCT_DEFINITIONS = [
  {
    key: PRODUCT_KEYS.claudeStandard,
    name: "Claude Team Standard",
    shortName: "Claude Standard",
    group: "Claude Team"
  },
  {
    key: PRODUCT_KEYS.claudePremium,
    name: "Claude Team Premium",
    shortName: "Claude Premium",
    group: "Claude Team"
  }
];

export const DEFAULT_INPUTS = {
  products: {
    [PRODUCT_KEYS.claudeStandard]: {
      users: 5
    },
    [PRODUCT_KEYS.claudePremium]: {
      users: 2
    }
  },
  usdEurRate: 0.93,
  vatRate: 0.21,
  contingencyRate: 0,
  periodMonths: 12,
  billingCycle: "annual"
};

export const RESULT_VIEWS = {
  monthly: "monthly",
  annual: "annual",
  both: "both"
};

export const BILLING_CYCLES = {
  annual: "annual",
  monthly: "monthly"
};

export function normalizePercent(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return numeric > 1 ? numeric / 100 : numeric;
}

export function sanitizeNonNegative(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return 0;
  return numeric;
}

export function sanitizePositive(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return fallback;
  return numeric;
}

export function roundCurrency(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

export function calculateCostWindow(monthlyUsdNoVat, months, inputs) {
  const usdEurRate = sanitizePositive(inputs.usdEurRate, 0);
  const vatRate = normalizePercent(inputs.vatRate);
  const contingencyRate = normalizePercent(inputs.contingencyRate);
  const usdNoVat = roundCurrency(monthlyUsdNoVat * months);
  const eurNoVat = roundCurrency(usdNoVat * usdEurRate);
  const contingencyEur = roundCurrency(eurNoVat * contingencyRate);
  const subtotalEur = roundCurrency(eurNoVat + contingencyEur);
  const vatEur = roundCurrency(subtotalEur * vatRate);
  const totalEurWithVat = roundCurrency(subtotalEur + vatEur);

  return {
    usdNoVat,
    eurNoVat,
    contingencyEur,
    subtotalEur,
    vatEur,
    totalEurWithVat
  };
}

export function calculateProductTco(inputs, productDefinition) {
  const product = inputs.products[productDefinition.key] ?? {};
  const priceSource = PRICE_CATALOG[productDefinition.key];
  const users = sanitizeNonNegative(product.users);
  const billingCycle = Object.values(BILLING_CYCLES).includes(inputs.billingCycle)
    ? inputs.billingCycle
    : BILLING_CYCLES.annual;
  const monthlyPriceUsd = sanitizeNonNegative(priceSource?.pricesUsdPerMonth?.[billingCycle]);
  const monthlyUsdNoVat = roundCurrency(users * monthlyPriceUsd);
  const monthly = calculateCostWindow(monthlyUsdNoVat, 1, inputs);
  const annual = calculateCostWindow(monthlyUsdNoVat, 12, inputs);
  const period = calculateCostWindow(monthlyUsdNoVat, sanitizePositive(inputs.periodMonths, 0), inputs);

  return {
    ...productDefinition,
    users,
    billingCycle,
    monthlyPriceUsd,
    priceSource,
    monthlyUsdNoVat,
    monthlyEurNoVat: monthly.eurNoVat,
    monthlyContingencyEur: monthly.contingencyEur,
    monthlySubtotalEur: monthly.subtotalEur,
    monthlyVatEur: monthly.vatEur,
    monthlyTotalEurWithVat: monthly.totalEurWithVat,
    annualUsdNoVat: annual.usdNoVat,
    annualEurNoVat: annual.eurNoVat,
    annualContingencyEur: annual.contingencyEur,
    annualSubtotalEur: annual.subtotalEur,
    annualVatEur: annual.vatEur,
    annualTotalEurWithVat: annual.totalEurWithVat,
    periodUsdNoVat: period.usdNoVat,
    periodEurNoVat: period.eurNoVat,
    contingencyEur: period.contingencyEur,
    subtotalEur: period.subtotalEur,
    vatEur: period.vatEur,
    totalEurWithVat: period.totalEurWithVat
  };
}

export function sumRows(rows, key, name, shortName = name) {
  return rows.reduce(
    (total, row) => ({
      ...total,
      users: total.users + row.users,
      monthlyUsdNoVat: roundCurrency(total.monthlyUsdNoVat + row.monthlyUsdNoVat),
      monthlyEurNoVat: roundCurrency(total.monthlyEurNoVat + row.monthlyEurNoVat),
      monthlyContingencyEur: roundCurrency(total.monthlyContingencyEur + row.monthlyContingencyEur),
      monthlySubtotalEur: roundCurrency(total.monthlySubtotalEur + row.monthlySubtotalEur),
      monthlyVatEur: roundCurrency(total.monthlyVatEur + row.monthlyVatEur),
      monthlyTotalEurWithVat: roundCurrency(total.monthlyTotalEurWithVat + row.monthlyTotalEurWithVat),
      annualUsdNoVat: roundCurrency(total.annualUsdNoVat + row.annualUsdNoVat),
      annualEurNoVat: roundCurrency(total.annualEurNoVat + row.annualEurNoVat),
      annualContingencyEur: roundCurrency(total.annualContingencyEur + row.annualContingencyEur),
      annualSubtotalEur: roundCurrency(total.annualSubtotalEur + row.annualSubtotalEur),
      annualVatEur: roundCurrency(total.annualVatEur + row.annualVatEur),
      annualTotalEurWithVat: roundCurrency(total.annualTotalEurWithVat + row.annualTotalEurWithVat),
      periodUsdNoVat: roundCurrency(total.periodUsdNoVat + row.periodUsdNoVat),
      periodEurNoVat: roundCurrency(total.periodEurNoVat + row.periodEurNoVat),
      contingencyEur: roundCurrency(total.contingencyEur + row.contingencyEur),
      subtotalEur: roundCurrency(total.subtotalEur + row.subtotalEur),
      vatEur: roundCurrency(total.vatEur + row.vatEur),
      totalEurWithVat: roundCurrency(total.totalEurWithVat + row.totalEurWithVat)
    }),
    {
      key,
      name,
      shortName,
      group: "Total",
      users: 0,
      monthlyPriceUsd: null,
      monthlyUsdNoVat: 0,
      monthlyEurNoVat: 0,
      monthlyContingencyEur: 0,
      monthlySubtotalEur: 0,
      monthlyVatEur: 0,
      monthlyTotalEurWithVat: 0,
      annualUsdNoVat: 0,
      annualEurNoVat: 0,
      annualContingencyEur: 0,
      annualSubtotalEur: 0,
      annualVatEur: 0,
      annualTotalEurWithVat: 0,
      periodUsdNoVat: 0,
      periodEurNoVat: 0,
      contingencyEur: 0,
      subtotalEur: 0,
      vatEur: 0,
      totalEurWithVat: 0
    }
  );
}

export function buildTcoModel(inputs) {
  const productRows = PRODUCT_DEFINITIONS.map((definition) => calculateProductTco(inputs, definition));
  const claudeProducts = productRows.filter((row) => row.group === "Claude Team");
  const claudeTotal = sumRows(claudeProducts, "claudeTeamTotal", "Total Claude Team");
  const globalTotal = sumRows(productRows, "globalTotal", "Total Claude Team");
  const topProduct = productRows.reduce((winner, row) => (
    row.totalEurWithVat > winner.totalEurWithVat ? row : winner
  ), productRows[0]);
  const topProductShare = globalTotal.totalEurWithVat === 0
    ? 0
    : topProduct.totalEurWithVat / globalTotal.totalEurWithVat;
  const validation = validateInputs(inputs);

  return {
    productRows,
    claudeTotal,
    globalTotal,
    summary: {
      claudeStandardUsers: inputs.products[PRODUCT_KEYS.claudeStandard]?.users ?? 0,
      claudePremiumUsers: inputs.products[PRODUCT_KEYS.claudePremium]?.users ?? 0,
      claudeTeamUsers: claudeTotal.users,
      globalUsers: globalTotal.users,
      monthlyTcoNoVatEur: globalTotal.monthlySubtotalEur,
      monthlyTcoWithVatEur: globalTotal.monthlyTotalEurWithVat,
      annualTcoNoVatEur: globalTotal.annualSubtotalEur,
      annualTcoWithVatEur: globalTotal.annualTotalEurWithVat,
      tcoNoVatEur: globalTotal.subtotalEur,
      tcoWithVatEur: globalTotal.totalEurWithVat,
      topProductName: topProduct.name,
      topProductShare
    },
    validation
  };
}

export function validateInputs(inputs) {
  const errors = [];

  for (const definition of PRODUCT_DEFINITIONS) {
    const product = inputs.products[definition.key] ?? {};
    if (Number(product.users) < 0) {
      errors.push(`${definition.name}: usuarios no puede ser negativo.`);
    }
  }

  if (!Number.isFinite(Number(inputs.usdEurRate)) || Number(inputs.usdEurRate) <= 0) {
    errors.push("El tipo de cambio USD/EUR debe ser mayor que cero.");
  }
  if (Number(inputs.vatRate) < 0) {
    errors.push("El IVA no puede ser negativo.");
  }
  if (Number(inputs.contingencyRate) < 0) {
    errors.push("La contingencia no puede ser negativa.");
  }
  if (!Number.isFinite(Number(inputs.periodMonths)) || Number(inputs.periodMonths) <= 0) {
    errors.push("El periodo de calculo debe ser mayor que cero.");
  }
  if (!Object.values(BILLING_CYCLES).includes(inputs.billingCycle)) {
    errors.push("La facturacion de licencias debe ser anual o mensual.");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
