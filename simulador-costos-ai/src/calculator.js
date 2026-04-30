export const BILLING = {
  annual: "Anual",
  monthly: "Mensual"
};

export const DEFAULT_INPUTS = {
  chatgptUsers: 30,
  claudeStandardUsers: 5,
  claudePremiumUsers: 2,
  chatgptBilling: BILLING.annual,
  claudeBilling: BILLING.annual,
  prices: {
    chatgptAnnual: 20,
    chatgptMonthly: 25,
    claudeStandardAnnual: 20,
    claudeStandardMonthly: 25,
    claudePremiumAnnual: 100,
    claudePremiumMonthly: 125
  },
  trmCopUsd: 4000,
  taxRate: 0,
  bufferRate: 0,
  mix: {
    chatgpt: 0.8,
    claudeStandard: 0.15,
    claudePremium: 0.05
  }
};

export function normalizePercent(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return numeric > 1 ? numeric / 100 : numeric;
}

export function roundCurrency(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

export function getApplicablePrices(inputs) {
  const chatgpt = inputs.chatgptBilling === BILLING.annual
    ? inputs.prices.chatgptAnnual
    : inputs.prices.chatgptMonthly;
  const claudeStandard = inputs.claudeBilling === BILLING.annual
    ? inputs.prices.claudeStandardAnnual
    : inputs.prices.claudeStandardMonthly;
  const claudePremium = inputs.claudeBilling === BILLING.annual
    ? inputs.prices.claudePremiumAnnual
    : inputs.prices.claudePremiumMonthly;

  return { chatgpt, claudeStandard, claudePremium };
}

export function calculateScenario(inputs, scenario) {
  const prices = getApplicablePrices({
    ...inputs,
    chatgptBilling: scenario.chatgptBilling ?? inputs.chatgptBilling,
    claudeBilling: scenario.claudeBilling ?? inputs.claudeBilling
  });
  const tax = normalizePercent(inputs.taxRate);
  const buffer = normalizePercent(inputs.bufferRate);
  const multiplier = (1 + tax) * (1 + buffer);
  const chatgptUsers = Number(scenario.chatgptUsers) || 0;
  const claudeStandardUsers = Number(scenario.claudeStandardUsers) || 0;
  const claudePremiumUsers = Number(scenario.claudePremiumUsers) || 0;
  const users = chatgptUsers + claudeStandardUsers + claudePremiumUsers;
  const monthlyUsd = roundCurrency(
    (
      chatgptUsers * prices.chatgpt
      + claudeStandardUsers * prices.claudeStandard
      + claudePremiumUsers * prices.claudePremium
    ) * multiplier
  );
  const annualUsd = roundCurrency(monthlyUsd * 12);
  const monthlyCop = roundCurrency(monthlyUsd * inputs.trmCopUsd);
  const annualCop = roundCurrency(annualUsd * inputs.trmCopUsd);

  return {
    ...scenario,
    users,
    monthlyUsd,
    annualUsd,
    monthlyCop,
    annualCop
  };
}

export function buildExecutiveSummary(inputs) {
  const chatgptOnly = calculateScenario(inputs, {
    id: "chatgpt",
    name: "Solo ChatGPT Business",
    chatgptUsers: inputs.chatgptUsers,
    claudeStandardUsers: 0,
    claudePremiumUsers: 0,
    note: "Base corporativa: PMO, preventa, dirección y documentación."
  });
  const claudeOnly = calculateScenario(inputs, {
    id: "claude",
    name: "Solo Claude Team",
    chatgptUsers: 0,
    claudeStandardUsers: inputs.claudeStandardUsers,
    claudePremiumUsers: inputs.claudePremiumUsers,
    note: "Técnico: coding, agentes, automatización y análisis documental."
  });
  const mixed = calculateScenario(inputs, {
    id: "mixed",
    name: "Modelo mixto SG Tech",
    chatgptUsers: inputs.chatgptUsers,
    claudeStandardUsers: inputs.claudeStandardUsers,
    claudePremiumUsers: inputs.claudePremiumUsers,
    note: "Recomendado: ChatGPT Business como base + Claude Team técnico selectivo."
  });

  const incrementalAnnualUsd = roundCurrency(mixed.annualUsd - chatgptOnly.annualUsd);
  const increaseVsChatgpt = chatgptOnly.annualUsd === 0
    ? 0
    : incrementalAnnualUsd / chatgptOnly.annualUsd;
  const averageMonthlyPerUser = mixed.users === 0 ? 0 : mixed.monthlyUsd / mixed.users;
  const recommendation = getRecommendation(inputs, increaseVsChatgpt);

  return {
    rows: [
      { ...chatgptOnly, incrementalAnnualUsd: 0 },
      { ...claudeOnly, incrementalAnnualUsd: roundCurrency(claudeOnly.annualUsd - chatgptOnly.annualUsd) },
      { ...mixed, incrementalAnnualUsd }
    ],
    metrics: {
      annualMixedUsd: mixed.annualUsd,
      incrementalAnnualUsd,
      increaseVsChatgpt,
      averageMonthlyPerUser,
      recommendation
    }
  };
}

export function getRecommendation(inputs, increaseVsChatgpt) {
  const claudeUsers = Number(inputs.claudeStandardUsers) + Number(inputs.claudePremiumUsers);
  if (claudeUsers === 0) {
    return "Sin usuarios Claude: escenario base ChatGPT Business. Adecuado para productividad transversal, pero no valida capacidad técnica avanzada.";
  }

  if (increaseVsChatgpt > 0.5) {
    return "El componente Claude incrementa el costo anual más de 50% vs ChatGPT. Limitar Premium a perfiles técnicos con uso demostrable.";
  }

  return "Modelo mixto razonable: ChatGPT Business cubre productividad corporativa y Claude Team se reserva para ingeniería, IA y automatización.";
}

export function buildScenarios(inputs, freeScenario) {
  const totalUsers = Number(inputs.chatgptUsers) + Number(inputs.claudeStandardUsers) + Number(inputs.claudePremiumUsers);
  const scenarios = [
    {
      name: "Base desde Inputs",
      chatgptUsers: inputs.chatgptUsers,
      claudeStandardUsers: inputs.claudeStandardUsers,
      claudePremiumUsers: inputs.claudePremiumUsers,
      note: "Escenario principal de SG Tech."
    },
    {
      name: "Solo ChatGPT para todos",
      chatgptUsers: totalUsers,
      claudeStandardUsers: 0,
      claudePremiumUsers: 0,
      note: "Útil si se prioriza productividad corporativa y bajo costo."
    },
    {
      name: "Solo Claude Standard para todos",
      chatgptUsers: 0,
      claudeStandardUsers: totalUsers,
      claudePremiumUsers: 0,
      note: "Útil solo si todos los usuarios son técnicos."
    },
    {
      name: "Mixto conservador",
      chatgptUsers: 20,
      claudeStandardUsers: 5,
      claudePremiumUsers: 1,
      note: "Célula técnica pequeña con un Premium."
    },
    {
      name: "Mixto técnico intensivo",
      chatgptUsers: 30,
      claudeStandardUsers: 6,
      claudePremiumUsers: 4,
      note: "Más Premium: revisar si el uso técnico lo justifica."
    },
    {
      name: "Escenario libre",
      chatgptUsers: freeScenario.chatgptUsers,
      claudeStandardUsers: freeScenario.claudeStandardUsers,
      claudePremiumUsers: freeScenario.claudePremiumUsers,
      chatgptBilling: freeScenario.chatgptBilling,
      claudeBilling: freeScenario.claudeBilling,
      note: "Fila editable para simular una propuesta específica."
    }
  ];

  return scenarios.map((scenario) => calculateScenario(inputs, scenario));
}

export function buildSensitivity(inputs, min = 5, max = 100, step = 5) {
  const rows = [];
  const prices = getApplicablePrices(inputs);
  const tax = normalizePercent(inputs.taxRate);
  const buffer = normalizePercent(inputs.bufferRate);
  const multiplier = (1 + tax) * (1 + buffer);
  const mixTotal = inputs.mix.chatgpt + inputs.mix.claudeStandard + inputs.mix.claudePremium;

  for (let totalUsers = min; totalUsers <= max; totalUsers += step) {
    const chatgptUsers = Math.round(totalUsers * inputs.mix.chatgpt);
    const claudeStandardUsers = Math.round(totalUsers * inputs.mix.claudeStandard);
    const claudePremiumUsers = Math.max(0, totalUsers - chatgptUsers - claudeStandardUsers);
    const chatgptAnnualUsd = roundCurrency(totalUsers * prices.chatgpt * 12 * multiplier);
    const claudeStandardAnnualUsd = roundCurrency(totalUsers * prices.claudeStandard * 12 * multiplier);
    const mixedAnnualUsd = roundCurrency(
      (
        chatgptUsers * prices.chatgpt * 12
        + claudeStandardUsers * prices.claudeStandard * 12
        + claudePremiumUsers * prices.claudePremium * 12
      ) * multiplier
    );

    rows.push({
      totalUsers,
      chatgptAnnualUsd,
      claudeStandardAnnualUsd,
      mixedAnnualUsd,
      chatgptUsers,
      claudeStandardUsers,
      claudePremiumUsers,
      differenceVsChatgpt: roundCurrency(mixedAnnualUsd - chatgptAnnualUsd)
    });
  }

  return { rows, mixTotal };
}
