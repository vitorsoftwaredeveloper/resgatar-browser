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
  FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  FIREBASE_STORAGE_BUCKET:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  FIREBASE_MESSAGING_SENDER_ID:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  FIREBASE_VAPID_KEY: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ?? "",
};

export const IS_PUSH_CONFIGURED =
  !!ENV.FIREBASE_API_KEY && !!ENV.FIREBASE_APP_ID && !!ENV.FIREBASE_VAPID_KEY;
