# Testes unitários (Vitest)

Cobrem o que o E2E não alcança: funções puras, camada de serviço e hooks que
dependem de APIs do browser impossíveis de dirigir pelo Cypress.

## Como rodar

```bash
npm test
```

```bash
npm run test:watch
```

```bash
npx vitest run --coverage
```

## Estrutura

```
tests/
  unit/
    utils/     mask, helper, apiError, commitment, device, image,
               generateBalanceReport
    services/  todos os services (api mockada), LiturgyService,
               o interceptor de auth do api.ts e os catch de cada método
    storage/   localStorage e pushStore
    hooks/     useImagePicker, useReceiptPicker, usePwaInstall, useLiturgyTTS,
               useCepLookup, useDragReorder, useBreakpoint,
               useAdminHubRedirect, usePermissions, useMaskedField,
               useClientValue
    components/ Button, Input, Switch, Dialog, Breadcrumb, ItemActionList,
                TimePickerField, SelectField, ContributionItem, ModalBase,
                ModalPhotoPicker, BirthdayBanner, ToastHost, toastStore e os
                formulários de compromisso, banner e despesa
    context/    NotificationsContext (permissão, token FCM, login/logout e
                mensagem em primeiro plano)
  setup.ts              cleanup do Testing Library + matchMedia padrão
  coverage-globs.json   escopo de arquivos medidos
  merge-coverage.mjs    normaliza a cobertura unitária para o merge
```

Os testes de componente usam Testing Library sobre jsdom. O `setup.ts` é
obrigatório: com `globals: false` o Testing Library não registra o `cleanup`
automático, e sem ele o `screen` enxerga os renders dos testes anteriores
("Found multiple elements with the role button"). O mesmo arquivo instala um
`window.matchMedia` neutro, que o jsdom não implementa.

## Como os services são testados

Um único `vi.hoisted` + `vi.mock("@/services/api")` em
`unit/services/services.test.ts` substitui o axios por espiões. Cada teste
verifica **a URL, o verbo e o corpo** enviados, além do desembrulho do
envelope `response.data.data` que todos os services usam. Os caminhos de erro
são exercitados com `mockRejectedValueOnce`.

## Datas nos testes: nunca use `Z`

Fixtures de data **não podem** usar ISO com `Z` (`"2026-06-03T12:00:00.000Z"`)
quando a asserção compara com o que a tela renderiza. O app lê essas datas com
getters locais (`getDate()`, `getMonth()`), então a mesma fixture vira um dia
diferente conforme o fuso da máquina — a suíte passava em `America/Sao_Paulo`
e quebrava em `Pacific/Auckland`.

Use hora local (`"2026-06-03T12:00:00"`, sem `Z`). Para congelar "hoje", use
`Date.UTC(...)` quando o código sob teste comparar com getters UTC — é o caso
do `BirthdayBanner`.

Antes de dar uma suíte por estável, rode em outro fuso:

```bash
TZ=Pacific/Auckland npx vitest run
```

## O que só o unitário alcança

- **Seletores de arquivo** (`useImagePicker`, `useReceiptPicker`): criam um
  `<input type="file">` com `document.createElement` e chamam `.click()`, o que
  no browser abre o diálogo do sistema operacional. No jsdom dá para espionar
  `document.createElement`, capturar o input e disparar `onchange`/`oncancel`
  na mão — assim cobrem seleção, limite de tamanho e cancelamento.
- **Instalação de PWA** (`usePwaInstall`): a matriz de modos depende de
  `beforeinstallprompt`, `matchMedia("(display-mode: standalone)")` e do
  user-agent. Os testes redefinem os três e disparam o evento na mão.
- **Áudio das leituras** (`useLiturgyTTS`): `Audio` é substituído por um duplo
  que registra `play`/`pause`, o que permite testar a máquina de estados
  inteira, inclusive o token de corrida que descarta reproduções abandonadas.
- **Relatório do balanço** (`generateBalanceReport`): o HTML é comparado por
  conteúdo, o `window.open` do PDF é substituído e o `XLSX.writeFile` é
  mockado — dá para inspecionar as três abas da planilha célula a célula.

## Cobertura combinada com o E2E

```bash
npm run coverage
```

Um comando só, orquestrado por `scripts/coverage-all.mjs`:

1. limpa `coverage/`, que concentra toda a saída de métricas;
2. roda o Vitest com cobertura;
3. faz o build com `COVERAGE=true` (instrumentação istanbul via SWC);
4. sobe o `next start`, espera a porta responder e roda o Cypress E2E;
5. roda o Cypress Component;
6. derruba o servidor, normaliza os caminhos e funde tudo em
   `coverage/merged/`, imprimindo o resumo consolidado.

Tudo cai dentro de uma pasta só:

```
coverage/
├── .tmp/     json bruto (temp-dir do nyc, entrada do merge)
├── unit/     relatório do Vitest
├── e2e/      relatório do Cypress E2E
└── merged/   relatório combinado — é este que você abre
```

O servidor é derrubado mesmo se algum passo falhar, e o script sai com código
diferente de zero — dá para usar direto em CI.

**O Component Testing roda mas não entra na conta de cobertura.** Os
componentes que ele monta já são medidos pelo Vitest, então ele não cobre
nenhuma linha nova (o total fica idêntico com e sem ele), e a instrumentação do
bundle do CT gera mapas de statements diferentes dos do build de produção, o
que só inflaria o denominador. Ele fica no pipeline como verificação de que a
montagem em browser real continua funcionando.

> **Leia a métrica de LINHAS no relatório combinado.** O E2E é instrumentado
> pelo plugin de SWC e o unitário pelo Babel do istanbul. Os dois produzem a
> mesma quantidade de statements por arquivo, mas com colunas diferentes —
> istanbul não reconhece que são os mesmos e soma os dois conjuntos, inflando o
> denominador de statements, branches e functions. As linhas casam, então só
> essa métrica é confiável no merge. Para statements por camada, use
> `coverage/e2e/` e `coverage/unit/` separadamente.
