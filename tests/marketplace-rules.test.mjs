import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = readFileSync(new URL("../src/lib/marketplace-rules.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
});
const rules = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);

test("calcula subtotal, envío y total", () => {
  assert.deepEqual(rules.calculateOrderTotals([{ price: 2500, qty: 2, stock: 3 }], "envio", "San Carlos"), {
    subtotal: 5000,
    shipping: 1200,
    total: 6200,
  });
});

test("retiro no cobra envío", () => {
  assert.equal(rules.calculateShippingCost("retiro", "Tupungato"), 0);
});

test("impide comprar más unidades que el stock", () => {
  assert.throws(
    () => rules.calculateOrderTotals([{ price: 1000, qty: 3, stock: 2 }], "retiro"),
    /Stock insuficiente/,
  );
});

test("valida transiciones de estado", () => {
  assert.equal(rules.canMoveOrderStatus("submitted", "accepted"), true);
  assert.equal(rules.canMoveOrderStatus("closed", "accepted"), false);
});
