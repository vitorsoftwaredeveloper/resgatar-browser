import { defineConfig } from "cypress";
import { config as loadEnvFile } from "dotenv";
import path from "node:path";
import registerCodeCoverageTasks from "@cypress/code-coverage/task";
import coverageExclude from "./cypress/coverage-exclude.json";

const ENV_FILE = process.env.CYPRESS_ENV_FILE ?? ".env.local";

loadEnvFile({ path: path.resolve(__dirname, ENV_FILE), quiet: true });

function credencialObrigatoria(nome: string): string {
  const valor = process.env[nome];
  if (!valor) {
    throw new Error(
      `${nome} não definida. Preencha as credenciais de teste em ${ENV_FILE} — a lista está em cypress/README.md.`,
    );
  }
  return valor;
}

export default defineConfig({
  component: {
    devServer: {
      framework: "next",
      bundler: "webpack",
      webpackConfig: {
        resolve: {
          alias: {
            [path.resolve(__dirname, "src/services/api.ts")]: path.resolve(
              __dirname,
              "cypress/support/apiStub.ts",
            ),
          },
        },
      },
    },
    supportFile: "cypress/support/component.ts",
    indexHtmlFile: "cypress/support/component-index.html",
    setupNodeEvents(on, config) {
      registerCodeCoverageTasks(on, config);
      return config;
    },
  },
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL ?? "http://localhost:3000",
    supportFile: "cypress/support/e2e.ts",
    fixturesFolder: "cypress/fixtures",
    downloadsFolder: "cypress/downloads",
    screenshotsFolder: "cypress/screenshots",
    videosFolder: "cypress/videos",
    video: false,
    viewportWidth: 1440,
    viewportHeight: 900,
    defaultCommandTimeout: 12000,
    requestTimeout: 20000,
    responseTimeout: 60000,
    pageLoadTimeout: 120000,
    retries: { runMode: 2, openMode: 0 },
    experimentalMemoryManagement: true,
    testIsolation: true,
    expose: {
      codeCoverage: coverageExclude,
    },
    setupNodeEvents(on, config) {
      config.env = {
        ...config.env,
        apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
        adminEmail: credencialObrigatoria("CYPRESS_ADMIN_EMAIL"),
        adminPassword: credencialObrigatoria("CYPRESS_ADMIN_PASSWORD"),
        memberEmail: credencialObrigatoria("CYPRESS_MEMBER_EMAIL"),
        memberPassword: credencialObrigatoria("CYPRESS_MEMBER_PASSWORD"),
        guestEmail: credencialObrigatoria("CYPRESS_GUEST_EMAIL"),
        guestPassword: credencialObrigatoria("CYPRESS_GUEST_PASSWORD"),
      };

      on("task", {
        log(message: string) {
          console.log(message);
          return null;
        },
      });

      registerCodeCoverageTasks(on, config);

      return config;
    },
  },
});
