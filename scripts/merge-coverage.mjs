import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const UNIT_INPUT = path.join(ROOT, "coverage", "unit", "coverage-final.json");
const OUTPUT = path.join(ROOT, "coverage", ".tmp", "unit.json");

function absoluteKey(key) {
  return path.isAbsolute(key) ? key : path.resolve(ROOT, key);
}

const unit = JSON.parse(readFileSync(UNIT_INPUT, "utf8"));
const normalized = {};

for (const [key, value] of Object.entries(unit)) {
  const absolute = absoluteKey(key);
  normalized[absolute] = { ...value, path: absolute };
}

mkdirSync(path.dirname(OUTPUT), { recursive: true });
writeFileSync(OUTPUT, JSON.stringify(normalized));

console.log(
  `[coverage] ${Object.keys(normalized).length} arquivos de teste unitário normalizados para ${path.relative(ROOT, OUTPUT)}`,
);
console.log(
  "[coverage] No relatório combinado use a métrica de LINHAS. O E2E é instrumentado pelo SWC e o unitário pelo Babel: as colunas dos statements não batem, então istanbul soma os statements em vez de unificá-los e infla esse denominador. As linhas casam.",
);
