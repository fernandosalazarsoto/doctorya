import assert from "node:assert/strict";
import {
  DEFAULT_INPUTS,
  buildExecutiveSummary,
  buildScenarios,
  buildSensitivity
} from "../src/calculator.js";

const inputs = structuredClone(DEFAULT_INPUTS);
const summary = buildExecutiveSummary(inputs);
const scenarios = buildScenarios(inputs, {
  chatgptUsers: 25,
  claudeStandardUsers: 5,
  claudePremiumUsers: 2,
  chatgptBilling: "Anual",
  claudeBilling: "Anual"
});
const sensitivity = buildSensitivity(inputs);

assert.equal(summary.rows[0].monthlyUsd, 600);
assert.equal(summary.rows[0].annualUsd, 7200);
assert.equal(summary.rows[1].monthlyUsd, 300);
assert.equal(summary.rows[1].annualUsd, 3600);
assert.equal(summary.rows[2].monthlyUsd, 900);
assert.equal(summary.rows[2].annualUsd, 10800);
assert.equal(summary.metrics.incrementalAnnualUsd, 3600);
assert.equal(summary.metrics.increaseVsChatgpt, 0.5);
assert.equal(Math.round(summary.metrics.averageMonthlyPerUser * 100) / 100, 24.32);

assert.equal(scenarios[1].name, "Solo ChatGPT para todos");
assert.equal(scenarios[1].monthlyUsd, 740);
assert.equal(scenarios[1].annualUsd, 8880);
assert.equal(scenarios[5].monthlyUsd, 800);
assert.equal(scenarios[5].annualUsd, 9600);

const users15 = sensitivity.rows.find((row) => row.totalUsers === 15);
assert.equal(users15.mixedAnnualUsd, 4560);
assert.equal(users15.differenceVsChatgpt, 960);
assert.equal(sensitivity.mixTotal, 1);

console.log("Pruebas de cálculo OK");
