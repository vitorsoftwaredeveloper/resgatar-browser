import { ALL_ROLES } from "../../support/roles";
import { SELECTORS } from "../../support/selectors";
import { shell } from "../../support/pages/shell";

const CEP_VALIDO = "01001000";
const VIACEP = /viacep\.com\.br/;

describe("Formulário Meus dados", () => {
  ALL_ROLES.forEach((role) => {
    describe(`Papel ${role}`, () => {
      beforeEach(() => {
        cy.loginAs(role);
        cy.visitApp("/personal-settings");
        cy.get(SELECTORS.actionItem("Meus dados")).click();
        cy.get(SELECTORS.modal("Meus dados")).should("be.visible");
      });

      it("mostra todas as seções do cadastro", () => {
        cy.get(SELECTORS.modal("Meus dados")).within(() => {
          cy.contains("Dados pessoais").should("exist");
          cy.contains("Endereço").should("exist");
          cy.contains("Contribuição").should("exist");
          cy.contains("Identificação").should("exist");
        });
      });

      it("mantém Salvar desabilitado enquanto nada muda", () => {
        cy.get(SELECTORS.button("Salvar")).should("be.disabled");
        cy.get(SELECTORS.field("Bio")).type("x");
        cy.get(SELECTORS.button("Salvar")).should("not.be.disabled");
      });

      it("preenche endereço a partir do CEP", () => {
        cy.intercept(
          { method: "GET", url: VIACEP },
          {
            statusCode: 200,
            body: {
              logradouro: "Praça da Sé",
              localidade: "São Paulo",
              uf: "SP",
            },
          },
        ).as("viacep");

        cy.get(SELECTORS.field("CEP")).clear().type(CEP_VALIDO);
        cy.wait("@viacep");

        cy.get(SELECTORS.field("Logradouro")).should(
          "have.value",
          "Praça da Sé",
        );
        cy.get(SELECTORS.field("Cidade")).should("have.value", "São Paulo");
        cy.get(SELECTORS.field("Estado")).should("have.value", "SP");
      });

      it("avisa quando o CEP não existe", () => {
        cy.intercept(
          { method: "GET", url: VIACEP },
          { statusCode: 200, body: { erro: true } },
        ).as("viacepErro");

        cy.get(SELECTORS.field("CEP")).clear().type("99999999");
        cy.wait("@viacepErro");
        shell.expectToast("error", "CEP não encontrado");
      });

      it("recusa e-mail e telefone inválidos", () => {
        cy.get(SELECTORS.field("Email")).clear().type("invalido@");
        cy.get(SELECTORS.field("Telefone")).clear().type("11");
        cy.get(SELECTORS.button("Salvar")).click();
        shell.expectToast("error");
      });

      it("aplica a máscara de valor da contribuição", () => {
        cy.get(SELECTORS.field("Valor")).clear().type("2550");
        cy.get(SELECTORS.field("Valor"))
          .invoke("val")
          .should("match", /25,50$/);
      });

      it("fecha sem salvar", () => {
        cy.get(SELECTORS.field("Bio")).type("alteração descartada");
        cy.get("body").type("{esc}");
        cy.get(SELECTORS.anyModal).should("not.exist");
      });
    });
  });
});
