import assert from "node:assert/strict";
import {
  BILLING_CYCLES,
  DEFAULT_INPUTS,
  PRODUCT_KEYS,
  buildTcoModel
} from "../src/calculator.js";

const inputs = structuredClone(DEFAULT_INPUTS);
const model = buildTcoModel(inputs);

const claudeStandard = model.productRows.find((row) => row.key === PRODUCT_KEYS.claudeStandard);
const claudePremium = model.productRows.find((row) => row.key === PRODUCT_KEYS.claudePremium);

assert.equal(claudeStandard.monthlyUsdNoVat, 100);
assert.equal(claudeStandard.periodUsdNoVat, 1200);
assert.equal(claudeStandard.totalEurWithVat, 1350.36);

assert.equal(claudePremium.monthlyUsdNoVat, 200);
assert.equal(claudePremium.periodUsdNoVat, 2400);
assert.equal(claudePremium.totalEurWithVat, 2700.72);

assert.equal(model.claudeTotal.users, 7);
assert.equal(model.claudeTotal.totalEurWithVat, 4051.08);
assert.equal(model.globalTotal.users, 7);
assert.equal(model.globalTotal.monthlySubtotalEur, 279);
assert.equal(model.globalTotal.monthlyTotalEurWithVat, 337.59);
assert.equal(model.globalTotal.subtotalEur, 3348);
assert.equal(model.globalTotal.totalEurWithVat, 4051.08);
assert.equal(model.summary.annualTcoWithVatEur, 4051.08);
assert.equal(model.summary.topProductName, "Claude Team Premium");

const withAdjustments = structuredClone(DEFAULT_INPUTS);
withAdjustments.contingencyRate = 0.1;
withAdjustments.vatRate = 0.21;
const adjusted = buildTcoModel(withAdjustments);
assert.equal(adjusted.globalTotal.contingencyEur, 334.8);
assert.equal(adjusted.globalTotal.subtotalEur, 3682.8);
assert.equal(adjusted.globalTotal.totalEurWithVat, 4456.19);

const changedClaude = structuredClone(DEFAULT_INPUTS);
changedClaude.products[PRODUCT_KEYS.claudeStandard].users = 8;
changedClaude.products[PRODUCT_KEYS.claudePremium].users = 3;
const changed = buildTcoModel(changedClaude);
assert.equal(changed.claudeTotal.users, 11);
assert.equal(changed.globalTotal.users, 11);

const attemptedManualPrice = structuredClone(DEFAULT_INPUTS);
attemptedManualPrice.products[PRODUCT_KEYS.claudePremium].monthlyPriceUsd = 1;
const sourcePriced = buildTcoModel(attemptedManualPrice);
const premium = sourcePriced.productRows.find((row) => row.key === PRODUCT_KEYS.claudePremium);
assert.equal(premium.monthlyPriceUsd, 100);

const monthlyBilling = structuredClone(DEFAULT_INPUTS);
monthlyBilling.billingCycle = BILLING_CYCLES.monthly;
const monthlyModel = buildTcoModel(monthlyBilling);
const monthlyPremium = monthlyModel.productRows.find((row) => row.key === PRODUCT_KEYS.claudePremium);
assert.equal(monthlyPremium.monthlyPriceUsd, 125);
assert.equal(monthlyModel.globalTotal.annualTotalEurWithVat, 5063.85);

const invalidRate = structuredClone(DEFAULT_INPUTS);
invalidRate.usdEurRate = 0;
assert.equal(buildTcoModel(invalidRate).validation.isValid, false);

console.log("Pruebas de calculo TCO OK");
