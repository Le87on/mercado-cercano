import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = readFileSync(new URL("../src/domain/auth.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
});
const auth = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);

test("extrae el código PKCE sólo del callback móvil esperado", () => {
  assert.equal(
    auth.parseAuthCode("alavuelta://auth/callback?code=code-123%2Bsecure"),
    "code-123+secure",
  );
});

test("rechaza enlaces con origen o ruta incorrectos", () => {
  assert.equal(auth.parseAuthCode("alavuelta://auth/callback?error=access_denied"), null);
  assert.equal(auth.parseAuthCode("alavuelta://evil/callback?code=stolen"), null);
  assert.equal(auth.parseAuthCode("https://example.com?code=stolen"), null);
});
