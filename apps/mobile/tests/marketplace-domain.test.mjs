import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = readFileSync(new URL("../src/domain/marketplace.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
});
const marketplace = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);

const stores = [
  {
    id: "uno",
    name: "Café El Sol",
    categoryId: "gastronomia",
    city: "San Carlos",
    description: "Café y panificados",
  },
  {
    id: "dos",
    name: "Ferretería Norte",
    categoryId: "ferreteria",
    city: "Tunuyán",
    description: "Herramientas",
  },
];

test("busca sin distinguir mayúsculas ni acentos", () => {
  assert.deepEqual(
    marketplace.searchStores(stores, "CAFE").map((store) => store.id),
    ["uno"],
  );
});

test("filtra por rubro y conserva todos cuando no hay filtro", () => {
  assert.deepEqual(
    marketplace.filterStores(stores, "ferreteria", "").map((store) => store.id),
    ["dos"],
  );
  assert.equal(marketplace.filterStores(stores, null, "").length, 2);
});

test("calcula cantidad y total de la canasta", () => {
  const summary = marketplace.summarizeCart([
    { productId: "a", storeId: "uno", name: "Pizza", unitPrice: 5000, quantity: 2 },
    { productId: "b", storeId: "uno", name: "Agua", unitPrice: 1200, quantity: 1 },
  ]);
  assert.deepEqual(summary, { itemCount: 3, subtotal: 11200, total: 11200 });
});

test("una canasta no mezcla comercios", () => {
  assert.equal(marketplace.canAddProduct([], "uno"), true);
  assert.equal(marketplace.canAddProduct([{ storeId: "uno" }], "uno"), true);
  assert.equal(marketplace.canAddProduct([{ storeId: "uno" }], "dos"), false);
});

test("las cantidades nunca son negativas", () => {
  assert.equal(marketplace.nextQuantity(1, -1), 0);
  assert.equal(marketplace.nextQuantity(0, -1), 0);
  assert.equal(marketplace.nextQuantity(2, 1), 3);
});
