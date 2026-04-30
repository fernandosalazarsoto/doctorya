export const PRODUCT_KEYS = {
  chatgptBusiness: "chatgptBusiness",
  claudeStandard: "claudeStandard",
  claudePremium: "claudePremium"
};

export const PRODUCT_DEFINITIONS = [
  {
    key: PRODUCT_KEYS.chatgptBusiness,
    name: "ChatGPT Business",
    shortName: "ChatGPT Business",
    group: "ChatGPT"
  },
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
    [PRODUCT_KEYS.chatgptBusiness]: {
      users: 20,
      monthlyPriceUsd: 20
    },
    [PRODUCT_KEYS.claudeStandard]: {
      users: 5,
      monthlyPriceUsd: 20
    },
    [PRODUCT_KEYS.claudePremium]: {
      users: 2,
      monthlyPriceUsd: 100
    }
  },
  usdEurRate: 0.93,
  vatRate: 0.21,
  contingencyRate: 0,
  periodMonths: 12
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

export function calculateProductTco(inputs, productDefinition) {
  const product = inputs.products[productDefinition.key] ?? {};
  const users = sanitizeNonNegative(product.users);
  const monthlyPriceUsd = sanitizeNonNegative(product.monthlyPriceUsd);
  const periodMonths = sanitizePositive(inputs.periodMonths, 0);
  const usdEurRate = sanitizePositive(inputs.usdEurRate, 0);
  const vatRate = normalizePercent(inputs.vatRate);
  const contingencyRate = normalizePercent(inputs.contingencyRate);

  const monthlyUsdNoVat = roundCurrency(users * monthlyPriceUsd);
  const periodUsdNoVat = roundCurrency(monthlyUsdNoVat * periodMonths);
  const periodEurNoVat = roundCurrency(periodUsdNoVat * usdEurRate);
  const contingencyEur = roundCurrency(periodEurNoVat * contingencyRate);
  const subtotalEur = roundCurrency(periodEurNoVat + contingencyEur);
  const vatEur = roundCurrency(subtotalEur * vatRate);
  const totalEurWithVat = roundCurrency(subtotalEur + vatEur);

  return {
    ...productDefinition,
    users,
    monthlyPriceUsd,
    monthlyUsdNoVat,
    periodUsdNoVat,
    periodEurNoVat,
    contingencyEur,
    subtotalEur,
    vatEur,
    totalEurWithVat
  };
}

export function sumRows(rows, key, name, shortName = name) {
  return rows.reduce(
    (total, row) => ({
      ...total,
      users: total.users + row.users,
      monthlyUsdNoVat: roundCurrency(total.monthlyUsdNoVat + row.monthlyUsdNoVat),
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
  const chatgpt = productRows.find((row) => row.key === PRODUCT_KEYS.chatgptBusiness);
  const claudeProducts = productRows.filter((row) => row.group === "Claude Team");
  const claudeTotal = sumRows(claudeProducts, "claudeTeamTotal", "Total Claude Team");
  const globalTotal = sumRows(productRows, "globalTotal", "Total global");
  const costDifferenceEur = roundCurrency(claudeTotal.totalEurWithVat - chatgpt.totalEurWithVat);
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
      chatgptUsers: chatgpt.users,
      claudeStandardUsers: inputs.products[PRODUCT_KEYS.claudeStandard]?.users ?? 0,
      claudePremiumUsers: inputs.products[PRODUCT_KEYS.claudePremium]?.users ?? 0,
      claudeTeamUsers: claudeTotal.users,
      globalUsers: globalTotal.users,
      tcoNoVatEur: globalTotal.subtotalEur,
      tcoWithVatEur: globalTotal.totalEurWithVat,
      costDifferenceEur,
      costDifferenceLabel: costDifferenceEur >= 0
        ? "Claude Team cuesta mas que ChatGPT Business"
        : "ChatGPT Business cuesta mas que Claude Team",
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
    if (Number(product.monthlyPriceUsd) < 0) {
      errors.push(`${definition.name}: precio mensual no puede ser negativo.`);
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

  return {
    isValid: errors.length === 0,
    errors
  };
}
