import { spawn } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const PORTA = process.env.PORT ?? "3000";
const BASE_URL = `http://localhost:${PORTA}`;
const PASTA_DE_SAIDA = "coverage";

const resultados = [];
let servidor = null;

function log(mensagem) {
  process.stdout.write(`\n[1m▸ ${mensagem}[0m\n`);
}

function executar(comando, argumentos, { env = {}, captura = false } = {}) {
  return new Promise((resolve, reject) => {
    const processo = spawn(comando, argumentos, {
      cwd: ROOT,
      env: { ...process.env, ...env },
      stdio: captura ? ["inherit", "pipe", "inherit"] : "inherit",
    });

    let saida = "";
    if (captura) {
      processo.stdout.on("data", (chunk) => {
        saida += chunk;
        process.stdout.write(chunk);
      });
    }

    processo.on("error", reject);
    processo.on("close", (codigo) => {
      if (codigo === 0) resolve(saida);
      else reject(new Error(`${comando} ${argumentos.join(" ")} → ${codigo}`));
    });
  });
}

function iniciarServidor() {
  servidor = spawn("npx", ["next", "start", "-p", PORTA], {
    cwd: ROOT,
    env: process.env,
    stdio: "ignore",
    detached: true,
  });
}

function pararServidor() {
  if (!servidor) return;
  try {
    process.kill(-servidor.pid);
  } catch {
    servidor.kill();
  }
  servidor = null;
}

async function esperarServidor(tentativas = 90) {
  for (let i = 0; i < tentativas; i++) {
    try {
      const resposta = await fetch(`${BASE_URL}/login`);
      if (resposta.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`servidor não respondeu em ${BASE_URL}`);
}

function contarVitest(saida) {
  const match = saida.match(/Tests\s+(\d+)\s+passed/);
  return match ? Number(match[1]) : 0;
}

function contarCypress(saida) {
  const linhas = [...saida.matchAll(/│\s+Tests:\s+(\d+)\s+│/g)];
  return linhas.reduce((total, m) => total + Number(m[1]), 0);
}

function resumoDeLinhas() {
  const arquivo = path.join(
    ROOT,
    PASTA_DE_SAIDA,
    "merged",
    "coverage-summary.json",
  );
  if (!existsSync(arquivo)) return null;

  const resumo = JSON.parse(readFileSync(arquivo, "utf8"));
  const porPasta = {};

  for (const [caminho, valor] of Object.entries(resumo)) {
    if (caminho === "total") continue;
    const relativo = caminho.replace(`${ROOT}/`, "");
    const pasta = relativo.split("/").slice(0, 2).join("/");
    porPasta[pasta] ??= { cobertas: 0, total: 0 };
    porPasta[pasta].cobertas += valor.lines.covered;
    porPasta[pasta].total += valor.lines.total;
  }

  return { total: resumo.total, porPasta };
}

function imprimirRelatorio() {
  const dados = resumoDeLinhas();

  log("Resumo");

  resultados.forEach(({ suite, testes }) =>
    console.log(`  ${suite.padEnd(22)} ${String(testes).padStart(4)} testes`),
  );
  const totalTestes = resultados.reduce((soma, r) => soma + r.testes, 0);
  console.log(`  ${"TOTAL".padEnd(22)} ${String(totalTestes).padStart(4)} testes`);

  if (!dados) return;

  console.log("\n  Cobertura de linhas (Vitest + Cypress E2E)\n");
  Object.entries(dados.porPasta)
    .sort()
    .forEach(([pasta, v]) => {
      const pct = ((100 * v.cobertas) / v.total).toFixed(0);
      console.log(`  ${pasta.padEnd(22)} ${(pct + "%").padStart(5)}`);
    });
  console.log(
    `  ${"TOTAL".padEnd(22)} ${(dados.total.lines.pct + "%").padStart(5)}  (${dados.total.lines.covered}/${dados.total.lines.total})`,
  );

  console.log(
    "\n  Relatório navegável: coverage/merged/index.html" +
      "\n  Leia LINHAS: E2E é instrumentado pelo SWC e o unitário pelo Babel," +
      "\n  os mapas de statements não batem e inflam aquele denominador.\n",
  );
}

async function main() {
  rmSync(path.join(ROOT, PASTA_DE_SAIDA), { recursive: true, force: true });

  log("1/5 · Testes unitários (Vitest)");
  const saidaVitest = await executar("npx", ["vitest", "run", "--coverage"], {
    captura: true,
  });
  resultados.push({ suite: "Vitest", testes: contarVitest(saidaVitest) });

  log("2/5 · Build instrumentado");
  await executar("npx", ["next", "build"], { env: { COVERAGE: "true" } });

  log("3/5 · Cypress E2E");
  iniciarServidor();
  await esperarServidor();
  const saidaE2E = await executar("npx", ["cypress", "run", "--e2e"], {
    captura: true,
  });
  resultados.push({ suite: "Cypress E2E", testes: contarCypress(saidaE2E) });

  log("4/5 · Cypress Component");
  const saidaCT = await executar("npx", ["cypress", "run", "--component"], {
    captura: true,
  });
  resultados.push({ suite: "Cypress Component", testes: contarCypress(saidaCT) });

  pararServidor();

  log("5/5 · Consolidando cobertura");
  await executar("node", ["scripts/merge-coverage.mjs"]);
  await executar("npx", [
    "nyc",
    "report",
    "--reporter=html",
    "--reporter=json-summary",
    "--report-dir=coverage/merged",
  ]);

  imprimirRelatorio();
}

main()
  .catch((erro) => {
    console.error(`\n[31m✖ ${erro.message}[0m\n`);
    process.exitCode = 1;
  })
  .finally(pararServidor);
