# Testes E2E (Cypress)

Suíte de ponta a ponta do `resgatar-browser`, organizada pelos **três papéis
reais do RBAC**:

| Papel no código | Nome de produto | Usuário de teste |
| --- | --- | --- |
| `admin` | Administrador (Coordenador) | `CYPRESS_ADMIN_EMAIL` |
| `user` | Membro interno | `CYPRESS_MEMBER_EMAIL` |
| `guest` | Convidado | `CYPRESS_GUEST_EMAIL` |

## Como rodar

Tudo de uma vez (unitários + E2E + componente + cobertura consolidada):

```bash
npm run coverage
```

Só o E2E — build de produção + `next start` + suíte inteira:

```bash
npm run e2e
```

Interface do Cypress (mesmo build + servidor, aí você escolhe E2E ou Component
no launchpad):

```bash
npm run cy:open
```

Com o servidor já rodando em outro terminal, chame o binário direto:
`npx cypress open` ou `npx cypress run --e2e`.

> **Rode contra o build, não contra o `next dev`.** Em dev o Next compila as
> rotas sob demanda (cada `cy.visit` frio leva 30–60s) e o servidor se reinicia
> sozinho ao encostar no limite de memória (`Server is approaching the used
> memory threshold, restarting...`), o que derruba o `cy.visit` com
> `ESOCKETTIMEDOUT`/`ECONNREFUSED`. Por isso os dois scripts acima sempre
> passam pelo `npm run build`.

## Ambiente

A config lê o `.env.local` (é o ambiente de desenvolvimento/HML que está de pé).
`CYPRESS_ENV_FILE` troca o arquivo, se um dia houver outro ambiente.

## Cobertura de código

```bash
npm run coverage
```

Faz o build com `COVERAGE=true`, que liga o `swc-plugin-coverage-instrument`
(instrumentação istanbul dentro do SWC — Babel não serve aqui porque
`next/font` exige SWC). O `@cypress/code-coverage` acumula o `window.__coverage__`
depois de cada teste e gera:

- `coverage/e2e/index.html` — relatório navegável, linha a linha
- `coverage/e2e/coverage-summary.json` — números por arquivo
- resumo em texto no fim da run

`src/app/layout.tsx` fica fora da instrumentação (`unstableExclude`): o
instrumentador reescreve o escopo do módulo e quebra a regra do `next/font`
("Font loaders must be called and assigned to a const in the module scope").

O build normal (`npm run e2e`) não carrega o plugin e não paga o custo da
instrumentação.

### O que fica fora da conta

`cypress/coverage-exclude.json` tira do relatório o que não tem lógica para
testar: `types/`, `theme/`, `styles/`, `config/`, `components/Svg/`,
`components/Skeleton/` e arquivos `constants.ts`. Os `layout.tsx` das rotas
protegidas são Server Components — nunca aparecem na cobertura do browser,
mas o comportamento deles (AuthGuard/RoleGuard) é validado em
`01-shared/access-control.cy.ts`.

### O que E2E não alcança

- **Seletores de arquivo** (`useImagePicker`, `useReceiptPicker`,
  `ModalPhotoPicker`, upload de banner e de comprovante): o hook cria um
  `<input type="file">` via `document.createElement` e chama `.click()`, o que
  abre o diálogo do sistema operacional. Cypress não consegue dirigir isso.
- **Push** (`NotificationsContext`, `firebaseMessaging`): exige permissão real
  de notificação e service worker do FCM.
- **TTS das leituras** (`useLiturgyTTS`, `GoogleTTSService`): reprodução de
  áudio.
- **Google TTS** (`GoogleTTSService`): síntese de voz.

Esses casos pedem teste de unidade, não E2E.

## Component Testing (opcional, montado como prova)

```bash
npx cypress run --component
```

`cypress/component/` monta componentes num Chrome de verdade, sem jsdom. Está
configurado e passando, mas **os testes de componente do dia a dia continuam no
Vitest** (`tests/unit/components/`). Três coisas precisaram de contorno e valem
o registro:

1. **CSS Modules**: o `next-style-loader` insere os estilos ancorado num
   `<noscript id="__next_css__DO_NOT_USE__">` que só existe numa página Next
   real. Sem essa âncora no `support/component-index.html`, *todo* componente
   que importa `.module.css` estoura com `Cannot read properties of null
   (reading 'parentNode')` — ou seja, todos.
2. **Cadeia do Amplify**: qualquer componente que importe um service puxa
   `services/api` → `aws-amplify` → `rxjs`, e o `next-swc-loader` recusa o
   `export * from` do rxjs com "Using `export * from '...'` in a page is
   disallowed". A saída é um alias de webpack **pelo caminho absoluto do
   arquivo** (`src/services/api.ts` → `support/apiStub.ts`); alias pelo
   specifier `@/services/api` não funciona, porque os services importam
   `./api` de forma relativa.
3. **Mocks**: não existe `vi.mock`. Dá para usar `cy.stub(Service, "metodo")`
   porque os services deste projeto exportam objetos. Para módulos que exportam
   funções soltas (`fetchTTSAudio`) ou libs de terceiros (`XLSX.writeFile`),
   não dá: namespace de módulo ESM não é configurável.

Custo medido nesta máquina: **213 ms por teste no Cypress CT contra 4,9 ms no
Vitest — 43× mais lento**. Migrar os 449 testes unitários levaria a suíte de
~7 s para ~2 min.

## Estrutura

```
cypress/
  e2e/
    00-setup/    provisiona membro e convidado e ajusta os papéis pelo admin
    01-shared/   specs parametrizadas que rodam para os três papéis
    02-admin/    hub administrativo, financeiro e gestão de membros
    03-member/   contribuições e dashboard do membro interno
    04-guest/    cartão de convidado e limites de acesso
  support/
    roles.ts     matriz de papéis, rotas e itens de menu esperados
    users.ts     catálogo dos usuários de teste e payload de cadastro
    selectors.ts seletores `data-*` estáveis
    commands.ts  comandos reutilizáveis (login, provisionamento, papéis)
    pages/       page objects (shell, dashboard, hub administrativo)
```

Os diretórios são numerados porque o Cypress executa os specs em ordem
alfabética: `00-setup` precisa rodar antes de qualquer spec que faça login
como membro ou convidado.

## Usuários de teste

Só a credencial de administrador é fornecida. Os outros dois papéis são
criados pela própria suíte:

1. `00-setup/provision-users.cy.ts` cadastra membro e convidado pelo endpoint
   público `POST /members` (idempotente — se já existirem, segue em frente).
2. Todo cadastro nasce como **Convidado**.
3. O admin promove o usuário de teste a **Membro** por
   Administrativo → Gestão de membros → Níveis de acesso.

As seis credenciais vêm de variáveis de ambiente e **não têm valor padrão** —
`cypress.config.ts` aborta com o nome da variável faltando. Preencha em
`.env.local` (ignorado pelo git; `CYPRESS_ENV_FILE` troca o arquivo):

```
CYPRESS_ADMIN_EMAIL=
CYPRESS_ADMIN_PASSWORD=
CYPRESS_MEMBER_EMAIL=
CYPRESS_MEMBER_PASSWORD=
CYPRESS_GUEST_EMAIL=
CYPRESS_GUEST_PASSWORD=
```

Os e-mails de membro e convidado são apenas o endereço que a suíte cadastra —
use sub-endereçamento (`voce+e2e.member@gmail.com`) para não criar caixas
novas. As senhas correspondentes são as que a suíte define no cadastro.

Para sobrescrever pontualmente, crie `cypress.env.json` (já no `.gitignore`):

```json
{
  "adminEmail": "...",
  "adminPassword": "...",
  "memberEmail": "...",
  "memberPassword": "...",
  "guestEmail": "...",
  "guestPassword": "..."
}
```

## Reuso

- `cy.loginAs("admin" | "member" | "guest")` — login via UI com cache de
  sessão (`cy.session`, `cacheAcrossSpecs`), tratando o onboarding do primeiro
  acesso.
- `cy.visitApp(path)` — visita, espera a tela de carregamento sumir e dispensa
  os banners de PWA/notificação.
- `cy.setMemberRole(email, role)` — troca o nível de acesso pela UI do admin.
- `cy.expectRedirect(from, to)` — valida guardas de rota.
- `roles.ts` descreve a matriz de permissões; `01-shared/access-control.cy.ts`
  gera automaticamente um teste de "permite" e um de "bloqueia" para cada
  combinação papel × rota.

## Cobrança PIX e comprovante

`03-member/pix-comprovante.cy.ts` cobre os dois estados de uma cobrança sem
tocar no Mercado Pago. As fixtures `charge-pending.json` e
`charge-approved.json` reproduzem o documento real do banco (mesmo
`transactionId`, `qrCode`, `transactionAmount`), mudando só `status` e
`dateApproved`.

`support/pages/charges.ts` substitui a resposta de `GET /members` por uma
cópia do membro em cache com os 12 meses montados na mão — assim dá para
fixar um mês pendente e outro pago independentemente de quando o usuário de
teste entrou na comunidade (o membro real só tinha agosto a dezembro).

Casos cobertos: criação pendente (QR Code, valor, cópia do código),
confirmação assíncrona virando "Pago" e fechando o modal sozinho, comprovante
de mês pago (PIX e dinheiro), compartilhamento via Web Share API e o fallback
de clipboard. E as exceções: falha ao criar a cobrança, falha na reconsulta
(modal segue pendente, sem toast), cobrança sem QR Code, clipboard
indisponível e compartilhamento cancelado.

## Ações deliberadamente não executadas

- **Enviar notificação**: só a validação do formulário é testada. O envio
  dispara push para todos os membros reais.
- **Encerrar conta** e **Remover membro**: abertos e cancelados; a confirmação
  destrutiva não é acionada.
- **Doação via PIX**: só a validação de valor. Gerar cobrança cria transação
  real.
- **Despesa**: essa sim é criada e removida pela própria suíte, com descrição
  marcada como `Despesa E2E <timestamp>`.
