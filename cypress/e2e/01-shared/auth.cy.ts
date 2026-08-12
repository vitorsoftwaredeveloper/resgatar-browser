import { ALL_ROLES } from "../../support/roles";
import { SELECTORS } from "../../support/selectors";
import { getUser } from "../../support/users";
import { shell } from "../../support/pages/shell";

describe("Autenticação", () => {
  describe("Rotas públicas sem sessão", () => {
    it("manda a raiz para o login", () => {
      cy.expectRedirect("/", "/login");
    });

    it("manda rota protegida para o login", () => {
      cy.expectRedirect("/dashboard", "/login");
    });

    it("navega entre login e cadastro", () => {
      cy.visitApp("/login");
      cy.contains("a", "Registre-se").click();
      cy.location("pathname").should("eq", "/register");
      cy.contains("h1", "Criar conta").should("be.visible");

      cy.contains("a", "Entrar").click();
      cy.location("pathname").should("eq", "/login");
      cy.contains("h1", "Bem-vindo!").should("be.visible");
    });
  });

  describe("Formulário de login", () => {
    beforeEach(() => {
      cy.visitApp("/login");
    });

    it("recusa envio com campos vazios", () => {
      cy.get(SELECTORS.loginSubmit).click();
      shell.expectToast("error", "Preencha todos os campos.");
    });

    it("recusa e-mail sem domínio completo", () => {
      cy.get(SELECTORS.loginEmail).type("usuario@dominio");
      cy.get(SELECTORS.loginPassword).type("QualquerSenha1@");
      cy.get(SELECTORS.loginSubmit).click();
      shell.expectToast("error", "Informe um e-mail válido.");
    });

    it("recusa credenciais incorretas", () => {
      cy.get(SELECTORS.loginEmail).type(getUser("admin").email);
      cy.get(SELECTORS.loginPassword).type("SenhaErrada123@");
      cy.get(SELECTORS.loginSubmit).click();
      shell.expectToast("error", "Usuário ou senha incorretos.");
      cy.location("pathname").should("eq", "/login");
    });

    it("alterna a visibilidade da senha", () => {
      cy.get(SELECTORS.loginPassword).should("have.attr", "type", "password");
      cy.get('button[aria-label="Mostrar senha"]').click();
      cy.get(SELECTORS.loginPassword).should("have.attr", "type", "text");
      cy.get('button[aria-label="Ocultar senha"]').click();
      cy.get(SELECTORS.loginPassword).should("have.attr", "type", "password");
    });
  });

  ALL_ROLES.forEach((role) => {
    describe(`Sessão do papel ${role}`, () => {
      it("entra e chega no dashboard com o papel correto", () => {
        cy.loginAs(role);
        cy.visitApp("/dashboard");
        shell
          .roleBadge()
          .should("have.attr", "data-user-role", getUser(role).persistedRole)
          .and("contain.text", getUser(role).sidebarRoleLabel);
      });

      it("mantém a sessão ao recarregar", () => {
        cy.loginAs(role);
        cy.visitApp("/dashboard");
        cy.reload();
        cy.location("pathname").should("eq", "/dashboard");
      });

      it("sai da conta pelo perfil mobile", () => {
        cy.loginAs(role);
        cy.logoutViaUi();
        cy.expectRedirect("/dashboard", "/login");
      });
    });
  });

  describe("Cadastro público", () => {
    beforeEach(() => {
      cy.visitApp("/register");
    });

    it("bloqueia o envio e avisa o primeiro campo inválido", () => {
      cy.get(SELECTORS.button("Criar conta")).click();
      shell.expectToast("error", "Campos inválidos");
    });

    it("valida documento, senha e confirmação", () => {
      cy.get('input[placeholder="Nome"]').type("Teste");
      cy.get('input[placeholder="Sobrenome"]').type("Validação");
      cy.get('input[placeholder="Email"]').type("teste.validacao@gmail.com");
      cy.get('input[placeholder="Telefone"]').type("11999998888");
      cy.get('input[placeholder="Data de nascimento"]').type("01011990");
      cy.get('input[placeholder="000.000.000-00"]').type("11111111111");
      cy.get('input[placeholder="Senha"]').type("fraca");
      cy.get('input[placeholder="Confirmar senha"]').type("outra");

      cy.get(SELECTORS.button("Criar conta")).click();
      shell.expectToast("error", "Documento inválido");
    });

    it("aplica as máscaras de telefone, data e CPF", () => {
      cy.get('input[placeholder="Telefone"]')
        .type("11999998888")
        .should("have.value", "(11) 99999-8888");
      cy.get('input[placeholder="Data de nascimento"]')
        .type("01011990")
        .should("have.value", "01/01/1990");
      cy.get('input[placeholder="000.000.000-00"]')
        .type("11144477735")
        .should("have.value", "111.444.777-35");
    });

    it("troca de CPF para CNPJ e limpa o documento", () => {
      cy.get('input[placeholder="000.000.000-00"]').type("11144477735");
      cy.contains("button", "CNPJ").click();
      cy.get('input[placeholder="00.000.000/0000-00"]').should(
        "have.value",
        "",
      );
    });

    it("envia o cadastro e volta para o login", () => {
      cy.intercept("POST", "**/members", {
        statusCode: 201,
        body: { data: { _id: "novo-membro" } },
      }).as("register");

      cy.get('input[placeholder="Nome"]').type("Novo");
      cy.get('input[placeholder="Sobrenome"]').type("Membro");
      cy.get('input[placeholder="Email"]').type("novo.membro@gmail.com");
      cy.get('input[placeholder="Telefone"]').type("11988887777");
      cy.get('input[placeholder="Data de nascimento"]').type("15081992");
      cy.get('input[placeholder="000.000.000-00"]').type("11144477735");
      cy.get('input[placeholder="Senha"]').type("SenhaForte1@");
      cy.get('input[placeholder="Confirmar senha"]').type("SenhaForte1@");

      cy.get(SELECTORS.button("Criar conta")).click();

      cy.wait("@register").its("request.body").should((body) => {
        expect(body.email).to.eq("novo.membro@gmail.com");
        expect(body.phoneNumber).to.eq("11988887777");
        expect(body.identification.numberType).to.eq("11144477735");
        expect(body.identification.type).to.eq("CPF");
      });

      shell.expectToast("success", "Cadastro realizado!");
      cy.location("pathname").should("eq", "/login");
    });

    it("mostra o erro devolvido pela API", () => {
      cy.intercept("POST", "**/members", {
        statusCode: 400,
        body: { message: "E-mail já cadastrado" },
      }).as("registerFail");

      cy.get('input[placeholder="Nome"]').type("Novo");
      cy.get('input[placeholder="Sobrenome"]').type("Membro");
      cy.get('input[placeholder="Email"]').type("novo.membro@gmail.com");
      cy.get('input[placeholder="Telefone"]').type("11988887777");
      cy.get('input[placeholder="Data de nascimento"]').type("15081992");
      cy.get('input[placeholder="000.000.000-00"]').type("11144477735");
      cy.get('input[placeholder="Senha"]').type("SenhaForte1@");
      cy.get('input[placeholder="Confirmar senha"]').type("SenhaForte1@");

      cy.get(SELECTORS.button("Criar conta")).click();

      cy.wait("@registerFail");
      shell.expectToast("error", "E-mail já cadastrado");
      cy.location("pathname").should("eq", "/register");
    });
  });
});
