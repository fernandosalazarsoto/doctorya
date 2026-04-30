import {
  BILLING,
  DEFAULT_INPUTS,
  buildExecutiveSummary,
  buildScenarios,
  buildSensitivity,
  normalizePercent
} from "./calculator.js";

const state = structuredClone(DEFAULT_INPUTS);
const freeScenario = {
  chatgptUsers: 25,
  claudeStandardUsers: 5,
  claudePremiumUsers: 2,
  chatgptBilling: BILLING.annual,
  claudeBilling: BILLING.annual
};

const form = document.querySelector("#simulator-form");
const summaryCards = document.querySelector("#summary-cards");
const scenarioBody = document.querySelector("#scenario-body");
const sensitivityBody = document.querySelector("#sensitivity-body");
const recommendation = document.querySelector("#recommendation");
const mixWarning = document.querySelector("#mix-warning");
const freeInputs = document.querySelectorAll("[data-free]");
const resetButton = document.querySelector("#reset");
const exportButton = document.querySelector("#export-json");

const moneyUsd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});
const moneyCop = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0
});
const decimal = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 2
});
const percent = new Intl.NumberFormat("es-CO", {
  style: "percent",
  maximumFractionDigits: 1
});

function readNumber(name) {
  return Number(form.elements[name].value || 0);
}

function writeInputs() {
  form.elements.chatgptUsers.value = state.chatgptUsers;
  form.elements.claudeStandardUsers.value = state.claudeStandardUsers;
  form.elements.claudePremiumUsers.value = state.claudePremiumUsers;
  form.elements.chatgptBilling.value = state.chatgptBilling;
  form.elements.claudeBilling.value = state.claudeBilling;
  form.elements.chatgptAnnual.value = state.prices.chatgptAnnual;
  form.elements.chatgptMonthly.value = state.prices.chatgptMonthly;
  form.elements.claudeStandardAnnual.value = state.prices.claudeStandardAnnual;
  form.elements.claudeStandardMonthly.value = state.prices.claudeStandardMonthly;
  form.elements.claudePremiumAnnual.value = state.prices.claudePremiumAnnual;
  form.elements.claudePremiumMonthly.value = state.prices.claudePremiumMonthly;
  form.elements.trmCopUsd.value = state.trmCopUsd;
  form.elements.taxRate.value = state.taxRate * 100;
  form.elements.bufferRate.value = state.bufferRate * 100;
  form.elements.mixChatgpt.value = state.mix.chatgpt * 100;
  form.elements.mixClaudeStandard.value = state.mix.claudeStandard * 100;
  form.elements.mixClaudePremium.value = state.mix.claudePremium * 100;

  for (const input of freeInputs) {
    input.value = freeScenario[input.dataset.free];
  }
}

function readInputs() {
  state.chatgptUsers = readNumber("chatgptUsers");
  state.claudeStandardUsers = readNumber("claudeStandardUsers");
  state.claudePremiumUsers = readNumber("claudePremiumUsers");
  state.chatgptBilling = form.elements.chatgptBilling.value;
  state.claudeBilling = form.elements.claudeBilling.value;
  state.prices.chatgptAnnual = readNumber("chatgptAnnual");
  state.prices.chatgptMonthly = readNumber("chatgptMonthly");
  state.prices.claudeStandardAnnual = readNumber("claudeStandardAnnual");
  state.prices.claudeStandardMonthly = readNumber("claudeStandardMonthly");
  state.prices.claudePremiumAnnual = readNumber("claudePremiumAnnual");
  state.prices.claudePremiumMonthly = readNumber("claudePremiumMonthly");
  state.trmCopUsd = readNumber("trmCopUsd");
  state.taxRate = normalizePercent(readNumber("taxRate"));
  state.bufferRate = normalizePercent(readNumber("bufferRate"));
  state.mix.chatgpt = normalizePercent(readNumber("mixChatgpt"));
  state.mix.claudeStandard = normalizePercent(readNumber("mixClaudeStandard"));
  state.mix.claudePremium = normalizePercent(readNumber("mixClaudePremium"));

  for (const input of freeInputs) {
    const value = input.tagName === "SELECT" ? input.value : Number(input.value || 0);
    freeScenario[input.dataset.free] = value;
  }
}

function renderSummary(summary) {
  summaryCards.innerHTML = "";
  for (const row of summary.rows) {
    const article = document.createElement("article");
    article.className = "summary-card";
    article.innerHTML = `
      <div>
        <p>${row.name}</p>
        <strong>${moneyUsd.format(row.annualUsd)}</strong>
      </div>
      <dl>
        <div><dt>Mensual USD</dt><dd>${moneyUsd.format(row.monthlyUsd)}</dd></div>
        <div><dt>Anual COP</dt><dd>${moneyCop.format(row.annualCop)}</dd></div>
        <div><dt>Usuarios</dt><dd>${row.users}</dd></div>
      </dl>
      <span>${row.note}</span>
    `;
    summaryCards.append(article);
  }

  recommendation.innerHTML = `
    <div>
      <span>Presupuesto anual mixto</span>
      <strong>${moneyUsd.format(summary.metrics.annualMixedUsd)}</strong>
      <small>${moneyCop.format(summary.metrics.annualMixedUsd * state.trmCopUsd)}</small>
    </div>
    <div>
      <span>Incremento vs ChatGPT</span>
      <strong>${moneyUsd.format(summary.metrics.incrementalAnnualUsd)}</strong>
      <small>${percent.format(summary.metrics.increaseVsChatgpt)}</small>
    </div>
    <div>
      <span>Promedio mensual por usuario</span>
      <strong>${moneyUsd.format(summary.metrics.averageMonthlyPerUser)}</strong>
      <small>${summary.metrics.recommendation}</small>
    </div>
  `;
}

function renderScenarioTable(rows) {
  scenarioBody.innerHTML = "";
  for (const row of rows) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <th scope="row">${row.name}<span>${row.note}</span></th>
      <td>${row.chatgptUsers}</td>
      <td>${row.claudeStandardUsers}</td>
      <td>${row.claudePremiumUsers}</td>
      <td>${moneyUsd.format(row.monthlyUsd)}</td>
      <td>${moneyUsd.format(row.annualUsd)}</td>
      <td>${moneyCop.format(row.annualCop)}</td>
    `;
    scenarioBody.append(tr);
  }
}

function renderSensitivityTable(result) {
  sensitivityBody.innerHTML = "";
  for (const row of result.rows) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <th scope="row">${row.totalUsers}</th>
      <td>${moneyUsd.format(row.chatgptAnnualUsd)}</td>
      <td>${moneyUsd.format(row.claudeStandardAnnualUsd)}</td>
      <td>${moneyUsd.format(row.mixedAnnualUsd)}</td>
      <td>${row.chatgptUsers}</td>
      <td>${row.claudeStandardUsers}</td>
      <td>${row.claudePremiumUsers}</td>
      <td>${moneyUsd.format(row.differenceVsChatgpt)}</td>
    `;
    sensitivityBody.append(tr);
  }

  const ok = Math.abs(result.mixTotal - 1) < 0.0001;
  mixWarning.textContent = ok
    ? `Mix válido: ${percent.format(result.mixTotal)}.`
    : `Revisa el mix: actualmente suma ${decimal.format(result.mixTotal * 100)}%.`;
  mixWarning.dataset.state = ok ? "ok" : "warning";
}

function render() {
  readInputs();
  const summary = buildExecutiveSummary(state);
  const scenarios = buildScenarios(state, freeScenario);
  const sensitivity = buildSensitivity(state);

  renderSummary(summary);
  renderScenarioTable(scenarios);
  renderSensitivityTable(sensitivity);
}

function exportSnapshot() {
  readInputs();
  const snapshot = {
    generatedAt: new Date().toISOString(),
    inputs: state,
    freeScenario,
    summary: buildExecutiveSummary(state),
    scenarios: buildScenarios(state, freeScenario),
    sensitivity: buildSensitivity(state)
  };
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "simulacion-costos-ai.json";
  anchor.click();
  URL.revokeObjectURL(url);
}

form.addEventListener("input", render);
form.addEventListener("change", render);
resetButton.addEventListener("click", () => {
  Object.assign(state, structuredClone(DEFAULT_INPUTS));
  Object.assign(freeScenario, {
    chatgptUsers: 25,
    claudeStandardUsers: 5,
    claudePremiumUsers: 2,
    chatgptBilling: BILLING.annual,
    claudeBilling: BILLING.annual
  });
  writeInputs();
  render();
});
exportButton.addEventListener("click", exportSnapshot);

writeInputs();
render();
