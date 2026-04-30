import {
  DEFAULT_INPUTS,
  PRODUCT_DEFINITIONS,
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
const productResultsBody = document.querySelector("#product-results-body");
const totalsBody = document.querySelector("#totals-body");
const validationPanel = document.querySelector("#validation-panel");
const sourceDate = document.querySelector("#source-date");
const resetButton = document.querySelector("#reset");
const exportButton = document.querySelector("#export-json");

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

function renderSummary(model) {
  const summary = model.summary;
  const differenceSign = summary.costDifferenceEur >= 0 ? "+" : "";

  kpiStrip.innerHTML = `
    <article>
      <span>TCO sin IVA</span>
      <strong>${moneyEur.format(summary.tcoNoVatEur)}</strong>
      <small>${state.periodMonths} meses, incluye contingencia</small>
    </article>
    <article>
      <span>TCO con IVA</span>
      <strong>${moneyEur.format(summary.tcoWithVatEur)}</strong>
      <small>IVA España ${percent.format(state.vatRate)}</small>
    </article>
    <article>
      <span>Diferencia Claude vs ChatGPT</span>
      <strong>${differenceSign}${moneyEur.format(summary.costDifferenceEur)}</strong>
      <small>${summary.costDifferenceLabel}</small>
    </article>
  `;

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

function renderProductResults(rows) {
  productResultsBody.innerHTML = rows.map((row) => `
    <tr>
      <th scope="row">${row.name}</th>
      <td>${numberFormat.format(row.users)}</td>
      <td>${moneyUsd.format(row.monthlyUsdNoVat)}</td>
      <td>${moneyUsd.format(row.periodUsdNoVat)}</td>
      <td>${moneyEur.format(row.periodEurNoVat)}</td>
      <td>${moneyEur.format(row.contingencyEur)}</td>
      <td>${moneyEur.format(row.subtotalEur)}</td>
      <td>${moneyEur.format(row.vatEur)}</td>
      <td>${moneyEur.format(row.totalEurWithVat)}</td>
    </tr>
  `).join("");
}

function renderTotals(model) {
  const totals = [model.claudeTotal, model.globalTotal];
  totalsBody.innerHTML = totals.map((row) => `
    <tr>
      <th scope="row">${row.name}</th>
      <td>${numberFormat.format(row.users)}</td>
      <td>${moneyUsd.format(row.monthlyUsdNoVat)}</td>
      <td>${moneyUsd.format(row.periodUsdNoVat)}</td>
      <td>${moneyEur.format(row.periodEurNoVat)}</td>
      <td>${moneyEur.format(row.contingencyEur)}</td>
      <td>${moneyEur.format(row.subtotalEur)}</td>
      <td>${moneyEur.format(row.vatEur)}</td>
      <td>${moneyEur.format(row.totalEurWithVat)}</td>
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
  renderProductResults(model.productRows);
  renderTotals(model);
}

function exportSnapshot() {
  readInputs();
  const snapshot = {
    generatedAt: new Date().toISOString(),
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
resetButton.addEventListener("click", () => {
  Object.assign(state, structuredClone(DEFAULT_INPUTS));
  writeInputs();
  render();
});
exportButton.addEventListener("click", exportSnapshot);
