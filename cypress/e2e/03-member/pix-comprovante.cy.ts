import { SELECTORS } from "../../support/selectors";
import { shell } from "../../support/pages/shell";
import { getUser } from "../../support/users";
import {
  CHARGE_AMOUNT_LABEL,
  CHARGE_ROUTES,
  MONTH_LABELS,
  PAID_AT_LABEL,
  type MonthKey,
  apiRoute,
  failConsultCharge,
  failCreateCharge,
  stubConsultCharge,
  stubCreateCharge,
  stubMemberMonths,
} from "../../support/pages/charges";

const PIX_CODE =
  "00020126580014br.gov.bcb.pix01364f51ffa5-d2bc-45a7-9965-ade5373ee51752040000530398654041.005802BR5914DCDFGHAEB796536009Sao Paulo62250521mpqrinter1616624665496304E38D";

const MES_PENDENTE: MonthKey = "january";
const MES_PAGO: MonthKey = "february";

function cardDoMes(mes: MonthKey) {
  return cy.get(`[data-contribution-month="${MONTH_LABELS[mes]}"]`);
}

function abrirPagamento(mes: MonthKey) {
  cardDoMes(mes).find('button[data-button="Pagar"]').click();
}

function abrirComprovante(mes: MonthKey) {
  cardDoMes(mes).find('button[data-button="Comprovante"]').click();
}

describe("Cobrança PIX e comprovante", () => {
  beforeEach(() => {
    cy.loginAs("member");
  });

  describe("Criação da cobrança (pendente)", () => {
    beforeEach(() => {
      stubMemberMonths([
        { key: MES_PENDENTE, paid: false },
        { key: MES_PAGO, paid: true },
      ]);
      stubCreateCharge("charge-pending.json");
      cy.visitApp("/bills");
    });

    it("abre o modal PIX com QR Code, valor e código copiável", () => {
      abrirPagamento(MES_PENDENTE);
      cy.wait("@criarCobranca")
        .its("request.body.referenceMonth")
        .should("eq", 0);

      cy.get(SELECTORS.modal("Pagamento PIX")).should("be.visible");
      cy.contains("Aguardando pagamento").should("be.visible");
      cy.contains(`R$ ${CHARGE_AMOUNT_LABEL}`).should("be.visible");
      cy.get(SELECTORS.modal("Pagamento PIX")).find("svg").should("exist");
      cy.contains(PIX_CODE).should("exist");
      cy.contains(
        "Após o pagamento, a confirmação será enviada automaticamente em até 5 minutos.",
      ).should("be.visible");
    });

    it("não mostra o selo de pago enquanto a cobrança está pendente", () => {
      abrirPagamento(MES_PENDENTE);
      cy.get(SELECTORS.modal("Pagamento PIX"))
        .should("be.visible")
        .and("not.contain.text", "Pago");
    });

    it("copia o código PIX para a área de transferência", () => {
      cy.window().then((win) => {
        cy.stub(win.navigator.clipboard, "writeText").as("copiar").resolves();
      });

      abrirPagamento(MES_PENDENTE);
      cy.get(SELECTORS.modal("Pagamento PIX")).should("be.visible");
      cy.get('button[aria-label="Copiar código PIX"]').click();

      cy.get("@copiar").should("have.been.calledWith", PIX_CODE);
      cy.contains("Copiado!").should("be.visible");
    });

    it("fecha o modal PIX pelo backdrop", () => {
      abrirPagamento(MES_PENDENTE);
      cy.get(SELECTORS.modal("Pagamento PIX")).should("be.visible");
      cy.get("body").type("{esc}");
      cy.get(SELECTORS.anyModal).should("not.exist");
    });
  });

  describe("Confirmação do pagamento", () => {
    it("troca para Pago e fecha sozinho quando a consulta volta aprovada", () => {
      stubMemberMonths([{ key: MES_PENDENTE, paid: false }]);
      stubCreateCharge("charge-pending.json");
      stubConsultCharge("charge-approved.json");
      cy.visitApp("/bills");

      abrirPagamento(MES_PENDENTE);
      cy.get(SELECTORS.modal("Pagamento PIX")).should("be.visible");
      cy.contains("Aguardando pagamento").should("be.visible");

      cy.wait("@consultarCobranca", { timeout: 30000 });
      cy.contains("Pago", { timeout: 20000 }).should("be.visible");
      cy.get(SELECTORS.modal("Pagamento PIX"), { timeout: 20000 }).should(
        "not.exist",
      );
    });
  });

  describe("Comprovante de um mês já pago", () => {
    beforeEach(() => {
      stubMemberMonths([
        { key: MES_PENDENTE, paid: false },
        { key: MES_PAGO, paid: true, value: 1, paymentMethod: "pix" },
      ]);
      cy.visitApp("/bills");
    });

    it("mostra o mês pago com o botão de comprovante", () => {
      cardDoMes(MES_PAGO).should("contain.text", "Pago");
      cardDoMes(MES_PAGO).should("contain.text", `Pago em ${PAID_AT_LABEL}`);
    });

    it("abre o comprovante com os dados do associado e do pagamento", () => {
      abrirComprovante(MES_PAGO);

      cy.get(SELECTORS.modal("Comprovante")).within(() => {
        cy.contains("Comunidade Resgatar").should("exist");
        cy.contains("✓ Pagamento confirmado").should("exist");
        cy.contains("Dados do Associado").should("exist");
        cy.contains(getUser("member").email).should("exist");
        cy.contains("Detalhes do Pagamento").should("exist");
        cy.contains(MONTH_LABELS[MES_PAGO]).should("exist");
        cy.contains(PAID_AT_LABEL).should("exist");
        cy.contains("PIX").should("exist");
        cy.contains("Valor pago").should("exist");
      });
    });

    it("identifica pagamento em dinheiro", () => {
      stubMemberMonths(
        [{ key: MES_PAGO, paid: true, value: 1, paymentMethod: "cash" }],
        "membroDinheiro",
      );
      cy.visitApp("/bills");

      abrirComprovante(MES_PAGO);
      cy.get(SELECTORS.modal("Comprovante")).should("contain.text", "Dinheiro");
    });

    it("compartilha pela Web Share API quando disponível", () => {
      cy.window().then((win) => {
        const share = cy.stub().as("compartilhar").resolves();
        Object.defineProperty(win.navigator, "share", {
          value: share,
          configurable: true,
        });
      });

      abrirComprovante(MES_PAGO);
      cy.get(SELECTORS.button("Compartilhar")).click();

      cy.get("@compartilhar").should("have.been.called");
      cy.get("@compartilhar")
        .its("firstCall.args.0.text")
        .should("include", "Comprovante de Pagamento");
    });

    it("copia o resumo quando não há Web Share API", () => {
      cy.window().then((win) => {
        Object.defineProperty(win.navigator, "share", {
          value: undefined,
          configurable: true,
        });
        cy.stub(win.navigator.clipboard, "writeText").as("copiar").resolves();
      });

      abrirComprovante(MES_PAGO);
      cy.get(SELECTORS.button("Compartilhar")).click();

      cy.get("@copiar").should("have.been.called");
      shell.expectToast("success", "Comprovante copiado");
    });
  });

  describe("Exceções", () => {
    it("avisa quando a criação da cobrança falha", () => {
      stubMemberMonths([{ key: MES_PENDENTE, paid: false }]);
      failCreateCharge();
      cy.visitApp("/bills");

      abrirPagamento(MES_PENDENTE);
      cy.wait("@criarCobrancaFalha");

      shell.expectToast("error", "Erro ao criar cobrança. Tente novamente.");
      cy.get(SELECTORS.modal("Pagamento PIX")).should("not.exist");
    });

    it("mantém o modal aberto e pendente quando a reconsulta falha", () => {
      stubMemberMonths([{ key: MES_PENDENTE, paid: false }]);
      stubCreateCharge("charge-pending.json");
      failConsultCharge();
      cy.visitApp("/bills");

      abrirPagamento(MES_PENDENTE);
      cy.get(SELECTORS.modal("Pagamento PIX")).should("be.visible");

      cy.wait("@consultarCobrancaFalha", { timeout: 30000 });
      cy.contains("Aguardando pagamento").should("be.visible");
      cy.get(SELECTORS.modal("Pagamento PIX")).should("be.visible");
      cy.get(SELECTORS.toast("error")).should("not.exist");
    });

    it("não quebra quando a cobrança volta sem QR Code", () => {
      stubMemberMonths([{ key: MES_PENDENTE, paid: false }]);
      cy.fixture("charge-pending.json").then((body) => {
        const semQr = JSON.parse(JSON.stringify(body));
        semQr.data.transactionData.qrCode = "";
        cy.intercept(
          { method: "POST", url: apiRoute(CHARGE_ROUTES.create) },
          { statusCode: 201, body: semQr },
        ).as("criarSemQr");
      });
      cy.visitApp("/bills");

      abrirPagamento(MES_PENDENTE);
      cy.wait("@criarSemQr");

      cy.get(SELECTORS.modal("Pagamento PIX")).should("be.visible");
      cy.contains(`R$ ${CHARGE_AMOUNT_LABEL}`).should("be.visible");
      cy.contains("Escaneie o QR Code ou copie o código PIX").should(
        "not.exist",
      );
      cy.get('button[aria-label="Copiar código PIX"]').should("not.exist");
    });

    it("silencia falha de clipboard ao copiar o código PIX", () => {
      stubMemberMonths([{ key: MES_PENDENTE, paid: false }]);
      stubCreateCharge("charge-pending.json");
      cy.visitApp("/bills");

      cy.window().then((win) => {
        cy.stub(win.navigator.clipboard, "writeText").rejects(
          new Error("clipboard indisponível"),
        );
      });

      abrirPagamento(MES_PENDENTE);
      cy.get('button[aria-label="Copiar código PIX"]').click();

      cy.contains("Copiado!").should("not.exist");
      cy.get(SELECTORS.toast("error")).should("not.exist");
      cy.get(SELECTORS.modal("Pagamento PIX")).should("be.visible");
    });

    it("silencia o cancelamento do compartilhamento do comprovante", () => {
      stubMemberMonths([{ key: MES_PAGO, paid: true, value: 1 }]);
      cy.visitApp("/bills");

      cy.window().then((win) => {
        const share = cy.stub().rejects(new Error("AbortError"));
        Object.defineProperty(win.navigator, "share", {
          value: share,
          configurable: true,
        });
      });

      abrirComprovante(MES_PAGO);
      cy.get(SELECTORS.button("Compartilhar")).click();

      cy.get(SELECTORS.toast("error")).should("not.exist");
      cy.get(SELECTORS.modal("Comprovante")).should("be.visible");
    });
  });
});
