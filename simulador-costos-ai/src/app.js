import {
  DEFAULT_INPUTS,
  PRODUCT_DEFINITIONS,
  RESULT_VIEWS,
  buildTcoModel,
  normalizePercent,
  sanitizeNonNegative
} from "./calculator.js";
import { PRICE_CATALOG, PRICE_SOURCE_CAPTURED_AT } from "./priceSources.js";

const state = structuredClone(DEFAULT_INPUTS);

const form = document.querySelector("#simulator-form");
const productInputsBody = document.querySelector("#product-inputs-body");
const summaryGrid = document.querySelector("#summary-grid");
const kpiStrip = document.querySelector("#kpi-strip");
const productChart = document.querySelector("#product-chart");
const differenceChart = document.querySelector("#difference-chart");
const chartPeriodLabel = document.querySelector("#chart-period-label");
const productResultsBody = document.querySelector("#product-results-body");
const totalsBody = document.querySelector("#totals-body");
const validationPanel = document.querySelector("#validation-panel");
const sourceDate = document.querySelector("#source-date");
const resetButton = document.querySelector("#reset");
const exportButton = document.querySelector("#export-json");
const viewInputs = document.querySelectorAll("input[name='resultView']");
let resultView = RESULT_VIEWS.annual;

const moneyUsd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2
});
const moneyEur = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2
});
const numberFormat = new Intl.NumberFormat("es-ES", {
  maximumFractionDigits: 2
});
const percent = new Intl.NumberFormat("es-ES", {
  style: "percent",
  maximumFractionDigits: 1
});

const VIEW_CONFIG = {
  [RESULT_VIEWS.monthly]: {
    label: "mensual",
    title: "Mensual",
    noVatKey: "monthlySubtotalEur",
    withVatKey: "monthlyTotalEurWithVat",
    usdKey: "monthlyUsdNoVat",
    eurKey: "monthlyEurNoVat",
    contingencyKey: "monthlyContingencyEur",
    vatKey: "monthlyVatEur",
    claudeDiffKey: "monthlyClaudeVsChatgptEur",
    inverseDiffKey: "monthlyChatgptVsClaudeEur"
  },
  [RESULT_VIEWS.annual]: {
    label: "anual",
    title: "Anual",
    noVatKey: "annualSubtotalEur",
    withVatKey: "annualTotalEurWithVat",
    usdKey: "annualUsdNoVat",
    eurKey: "annualEurNoVat",
    contingencyKey: "annualContingencyEur",
    vatKey: "annualVatEur",
    claudeDiffKey: "annualClaudeVsChatgptEur",
    inverseDiffKey: "annualChatgptVsClaudeEur"
  }
};

function readNumber(name) {
  const raw = form.elements[name]?.value;
  if (raw === "") return 0;
  return sanitizeNonNegative(raw);
}

function writeInputs() {
  for (const product of PRODUCT_DEFINITIONS) {
    const data = state.products[product.key];
    form.elements[`${product.key}Users`].value = data.users;
  }

  form.elements.usdEurRate.value = state.usdEurRate;
  form.elements.vatRate.value = state.vatRate * 100;
  form.elements.contingencyRate.value = state.contingencyRate * 100;
  form.elements.periodMonths.value = state.periodMonths;
}

function readInputs() {
  for (const product of PRODUCT_DEFINITIONS) {
    state.products[product.key].users = readNumber(`${product.key}Users`);
  }

  state.usdEurRate = Number(form.elements.usdEurRate.value || 0);
  state.vatRate = normalizePercent(readNumber("vatRate"));
  state.contingencyRate = normalizePercent(readNumber("contingencyRate"));
  state.periodMonths = readNumber("periodMonths");
  resultView = document.querySelector("input[name='resultView']:checked")?.value ?? RESULT_VIEWS.annual;
}

function renderProductInputs() {
  productInputsBody.innerHTML = PRODUCT_DEFINITIONS.map((product) => `
    <tr>
      <th scope="row">${product.name}</th>
      <td>
        <input name="${product.key}Users" type="number" min="0" step="1" inputmode="numeric" aria-label="Usuarios ${product.name}">
      </td>
      <td>${moneyUsd.format(PRICE_CATALOG[product.key].monthlyPriceUsd)}</td>
      <td>
        <a href="${PRICE_CATALOG[product.key].sourceUrl}" target="_blank" rel="noreferrer">${PRICE_CATALOG[product.key].sourceName}</a>
        <span>${PRICE_CATALOG[product.key].billingBasis}</span>
      </td>
    </tr>
  `).join("");
}

function signedMoney(value) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${moneyEur.format(value)}`;
}

function buildKpis(model) {
  const summary = model.summary;
  const cards = [];
  const appendCards = (view) => {
    const config = VIEW_CONFIG[view];
    cards.push(`
      <article>
        <span>TCO ${config.label} sin IVA</span>
        <strong>${moneyEur.format(model.globalTotal[config.noVatKey])}</strong>
        <small>Incluye contingencia ${percent.format(state.contingencyRate)}</small>
      </article>
      <article>
        <span>TCO ${config.label} con IVA</span>
        <strong>${moneyEur.format(model.globalTotal[config.withVatKey])}</strong>
        <small>IVA España ${percent.format(state.vatRate)}</small>
      </article>
    `);
  };

  if (resultView === RESULT_VIEWS.both) {
    appendCards(RESULT_VIEWS.monthly);
    appendCards(RESULT_VIEWS.annual);
    return cards.join("");
  }

  const config = VIEW_CONFIG[resultView];
  appendCards(resultView);
  cards.push(`
    <article>
      <span>Claude vs ChatGPT ${config.label}</span>
      <strong>${signedMoney(summary[config.claudeDiffKey])}</strong>
      <small>${summary.costDifferenceLabel}</small>
    </article>
    <article>
      <span>ChatGPT vs Claude ${config.label}</span>
      <strong>${signedMoney(summary[config.inverseDiffKey])}</strong>
      <small>Lectura inversa de la misma brecha</small>
    </article>
  `);

  return cards.join("");
}

function renderSummary(model) {
  const summary = model.summary;
  kpiStrip.innerHTML = buildKpis(model);

  summaryGrid.innerHTML = `
    <article class="summary-card">
      <span>Total usuarios ChatGPT Business</span>
      <strong>${summary.chatgptUsers}</strong>
    </article>
    <article class="summary-card">
      <span>Total usuarios Claude Team Standard</span>
      <strong>${summary.claudeStandardUsers}</strong>
    </article>
    <article class="summary-card">
      <span>Total usuarios Claude Team Premium</span>
      <strong>${summary.claudePremiumUsers}</strong>
    </article>
    <article class="summary-card">
      <span>Total usuarios Claude Team</span>
      <strong>${summary.claudeTeamUsers}</strong>
    </article>
    <article class="summary-card">
      <span>Total usuarios global</span>
      <strong>${summary.globalUsers}</strong>
    </article>
    <article class="summary-card">
      <span>Mayor participacion en costo</span>
      <strong>${summary.topProductName}</strong>
      <small>${percent.format(summary.topProductShare)} del TCO con IVA</small>
    </article>
  `;
}

function metricForCharts() {
  return resultView === RESULT_VIEWS.monthly ? RESULT_VIEWS.monthly : RESULT_VIEWS.annual;
}

function renderCharts(model) {
  const view = metricForCharts();
  const config = VIEW_CONFIG[view];
  const maxProductValue = Math.max(...model.productRows.map((row) => row[config.withVatKey]), 1);
  chartPeriodLabel.textContent = `Vista ${config.label}`;

  productChart.innerHTML = model.productRows.map((row) => {
    const value = row[config.withVatKey];
    const share = model.globalTotal[config.withVatKey] === 0 ? 0 : value / model.globalTotal[config.withVatKey];
    const width = Math.max(2, (value / maxProductValue) * 100);
    return `
      <div class="bar-row">
        <div>
          <strong>${row.shortName}</strong>
          <span>${percent.format(share)}</span>
        </div>
        <div class="bar-track" aria-hidden="true"><span style="width: ${width}%"></span></div>
        <em>${moneyEur.format(value)}</em>
      </div>
    `;
  }).join("");

  const chatgpt = model.productRows.find((row) => row.key === "chatgptBusiness");
  const claudeValue = model.claudeTotal[config.withVatKey];
  const chatgptValue = chatgpt[config.withVatKey];
  const maxComparison = Math.max(claudeValue, chatgptValue, 1);

  differenceChart.innerHTML = `
    <div class="compare-bars">
      <div class="compare-row">
        <span>Claude Team</span>
        <div class="bar-track"><span style="width: ${(claudeValue / maxComparison) * 100}%"></span></div>
        <strong>${moneyEur.format(claudeValue)}</strong>
      </div>
      <div class="compare-row">
        <span>ChatGPT Business</span>
        <div class="bar-track alt"><span style="width: ${(chatgptValue / maxComparison) * 100}%"></span></div>
        <strong>${moneyEur.format(chatgptValue)}</strong>
      </div>
    </div>
    <div class="difference-cards">
      <div>
        <span>Claude vs ChatGPT</span>
        <strong>${signedMoney(model.summary[config.claudeDiffKey])}</strong>
      </div>
      <div>
        <span>ChatGPT vs Claude</span>
        <strong>${signedMoney(model.summary[config.inverseDiffKey])}</strong>
      </div>
    </div>
  `;
}

function detailViews() {
  return resultView === RESULT_VIEWS.both
    ? [RESULT_VIEWS.monthly, RESULT_VIEWS.annual]
    : [resultView];
}

function formatMetricList(row, key) {
  return detailViews()
    .map((view) => `${VIEW_CONFIG[view].title}: ${moneyEur.format(row[VIEW_CONFIG[view][key]])}`)
    .join("<br>");
}

function formatUsdList(row) {
  return detailViews()
    .map((view) => `${VIEW_CONFIG[view].title}: ${moneyUsd.format(row[VIEW_CONFIG[view].usdKey])}`)
    .join("<br>");
}

function renderProductResults(rows) {
  productResultsBody.innerHTML = rows.map((row) => `
    <tr>
      <th scope="row">${row.name}</th>
      <td>${numberFormat.format(row.users)}</td>
      <td>${formatUsdList(row)}</td>
      <td>${formatMetricList(row, "eurKey")}</td>
      <td>${formatMetricList(row, "contingencyKey")}</td>
      <td>${formatMetricList(row, "noVatKey")}</td>
      <td>${formatMetricList(row, "vatKey")}</td>
      <td>${formatMetricList(row, "withVatKey")}</td>
    </tr>
  `).join("");
}

function renderTotals(model) {
  const totals = [model.claudeTotal, model.globalTotal];
  totalsBody.innerHTML = totals.map((row) => `
    <tr>
      <th scope="row">${row.name}</th>
      <td>${numberFormat.format(row.users)}</td>
      <td>${formatUsdList(row)}</td>
      <td>${formatMetricList(row, "eurKey")}</td>
      <td>${formatMetricList(row, "contingencyKey")}</td>
      <td>${formatMetricList(row, "noVatKey")}</td>
      <td>${formatMetricList(row, "vatKey")}</td>
      <td>${formatMetricList(row, "withVatKey")}</td>
    </tr>
  `).join("");
}

function renderValidation(validation) {
  validationPanel.hidden = validation.isValid;
  validationPanel.innerHTML = validation.isValid
    ? ""
    : `<strong>Revisa los inputs</strong><ul>${validation.errors.map((error) => `<li>${error}</li>`).join("")}</ul>`;
}

function render() {
  readInputs();
  const model = buildTcoModel(state);
  renderValidation(model.validation);
  renderSummary(model);
  renderCharts(model);
  renderProductResults(model.productRows);
  renderTotals(model);
}

function exportSnapshot() {
  readInputs();
  const snapshot = {
    generatedAt: new Date().toISOString(),
    view: resultView,
    inputs: state,
    tco: buildTcoModel(state)
  };
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "simulacion-tco-ai-espana.json";
  anchor.click();
  URL.revokeObjectURL(url);
}

renderProductInputs();
sourceDate.textContent = PRICE_SOURCE_CAPTURED_AT;
writeInputs();
render();

form.addEventListener("input", render);
form.addEventListener("change", render);
for (const input of viewInputs) {
  input.addEventListener("change", render);
}
resetButton.addEventListener("click", () => {
  Object.assign(state, structuredClone(DEFAULT_INPUTS));
  document.querySelector(`input[name='resultView'][value='${RESULT_VIEWS.annual}']`).checked = true;
  writeInputs();
  render();
});
exportButton.addEventListener("click", exportSnapshot);
