// Variáveis de ambiente para o browser. No Next.js, apenas variáveis prefixadas
// com NEXT_PUBLIC_ são expostas ao código do cliente. Equivalente ao
// resgatar_app/src/config/env.ts, mas lendo de process.env.

export const ENV = {
  API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
  API_BASE_URL_AUTH: process.env.NEXT_PUBLIC_API_BASE_URL_AUTH ?? "",
  COGNITO_USER_POOL_ID: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID ?? "",
  COGNITO_USER_POOL_CLIENT_ID:
    process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID ?? "",
  COGNITO_REGION: process.env.NEXT_PUBLIC_COGNITO_REGION ?? "",
};
