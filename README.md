# resgatar-browser

Versão **web (browser)** do Resgatar. Consome a **mesma API** do `resgatar_app`
(Cognito + API Gateway). Abordagem **mobile-first** — a base é pensada para telas
pequenas e telas maiores serão adicionadas depois.

O app original é **Expo / React Native**. Aqui a UI é **reescrita como web puro**
(componentes HTML/CSS), reaproveitando do app: o **tema**, a **lógica de API/serviços**
e os **types**. Não usamos `react-native-web`.

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **CSS Modules** + design tokens em **CSS variables** (tema light/dark)
- **axios** / **axios-retry** para a API
- **aws-amplify** (Cognito) para autenticação

## Estrutura

```
src/
  app/            # rotas (App Router), layout, providers, globals.css
  theme/          # design tokens (portado de resgatar_app/src/theme + ThemeContext)
  config/         # env.ts, amplify.ts
  services/       # api.ts + *Service.ts (mesma API do app)
  context/        # AuthContext, ThemeContext (web)
  storage/        # localStorage.ts (adaptador com a API do asyncStorage do app)
  types/          # tipos compartilhados (Member, ...)
  components/     # componentes web (a portar do app)
  hooks/          # hooks (a portar do app)
```

## Ambiente

Copie `.env.example` para `.env.local` e preencha. Apenas variáveis `NEXT_PUBLIC_`
ficam disponíveis no browser.

## Scripts

```bash
npm run dev     # desenvolvimento
npm run build   # build de produção
npm run start   # servir build
npm run lint    # eslint
```

## Próximos passos

- Portar componentes de `resgatar_app/src/components` (RN → web).
- Portar telas de `resgatar_app/src/screens` para rotas do App Router.
- Testes de unidade (Jest) e Cypress — feature dedicada mais adiante.
