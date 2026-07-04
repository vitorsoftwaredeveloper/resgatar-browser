import { Amplify } from "aws-amplify";
import type { ResourcesConfig } from "aws-amplify";
import { ENV } from "@/config/env";

// Configuração do Amplify (Cognito) para web. Equivalente ao
// resgatar_app/src/config/amplify.ts. Deve ser chamada no cliente antes de
// qualquer chamada de auth (feito no Providers).

let configured = false;

export function configureAmplify() {
  if (configured) return;

  const config: ResourcesConfig = {
    Auth: {
      Cognito: {
        userPoolId: ENV.COGNITO_USER_POOL_ID,
        userPoolClientId: ENV.COGNITO_USER_POOL_CLIENT_ID,
        loginWith: {
          username: true,
        },
      },
    },
  };

  Amplify.configure(config, { ssr: true });
  configured = true;
}

export default Amplify;
