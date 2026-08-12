import { describe, expect, it } from "vitest";
import {
  currencyToBackendBRL,
  maskCEP,
  maskCPFOrCNPJ,
  maskCurrencyBRL,
  maskDateBR,
  maskPhoneBR,
  onlyNumbers,
  validateCNPJ,
  validateCPF,
  validateEmailDomain,
} from "@/utils/mask";

const CPF_VALIDO = "11144477735";
const CNPJ_VALIDO = "11222333000181";

describe("onlyNumbers", () => {
  it("remove tudo que não é dígito", () => {
    expect(onlyNumbers("(11) 99999-8888")).toBe("11999998888");
    expect(onlyNumbers("abc")).toBe("");
    expect(onlyNumbers("")).toBe("");
  });
});

describe("maskPhoneBR", () => {
  it("formata celular de 11 dígitos", () => {
    expect(maskPhoneBR("11999998888")).toBe("(11) 99999-8888");
  });

  it("formata fixo de 10 dígitos", () => {
    expect(maskPhoneBR("1133334444")).toBe("(11) 3333-4444");
  });

  it("corta o excedente em 11 dígitos", () => {
    expect(maskPhoneBR("119999988889999")).toBe("(11) 99999-8888");
  });

  it("formata parcialmente enquanto o usuário digita", () => {
    expect(maskPhoneBR("1")).toBe("1");
    expect(maskPhoneBR("11")).toBe("11");
    expect(maskPhoneBR("119")).toBe("(11) 9");
  });
});

describe("maskCEP", () => {
  it("formata com hífen e limita a 8 dígitos", () => {
    expect(maskCEP("01001000")).toBe("01001-000");
    expect(maskCEP("010010009999")).toBe("01001-000");
  });

  it("não coloca hífen antes de 6 dígitos", () => {
    expect(maskCEP("01001")).toBe("01001");
  });
});

describe("maskCPFOrCNPJ", () => {
  it("formata CPF", () => {
    expect(maskCPFOrCNPJ(CPF_VALIDO, "CPF")).toBe("111.444.777-35");
  });

  it("formata CNPJ", () => {
    expect(maskCPFOrCNPJ(CNPJ_VALIDO, "CNPJ")).toBe("11.222.333/0001-81");
  });

  it("corta o excedente conforme o tipo", () => {
    expect(maskCPFOrCNPJ("111444777359999", "CPF")).toBe("111.444.777-35");
  });
});

describe("maskCurrencyBRL", () => {
  it("trata os dígitos como centavos", () => {
    expect(maskCurrencyBRL("1")).toMatch(/0,01$/);
    expect(maskCurrencyBRL("2550")).toMatch(/25,50$/);
    expect(maskCurrencyBRL("123456")).toMatch(/1\.234,56$/);
  });

  it("devolve zero quando não há dígitos", () => {
    expect(maskCurrencyBRL("abc")).toMatch(/0,00$/);
  });
});

describe("currencyToBackendBRL", () => {
  it("converte valor mascarado para o formato do backend", () => {
    expect(currencyToBackendBRL("R$ 1.234,56")).toBe("1234,56");
    expect(currencyToBackendBRL("123456")).toBe("1234,56");
    expect(currencyToBackendBRL("R$ 10,00")).toBe("10,00");
  });

  it("aceita entrada vazia", () => {
    expect(currencyToBackendBRL("")).toBe("0,00");
  });
});

describe("maskDateBR", () => {
  it("insere as barras conforme digita", () => {
    expect(maskDateBR("0")).toBe("0");
    expect(maskDateBR("01")).toBe("01");
    expect(maskDateBR("0101")).toBe("01/01");
    expect(maskDateBR("01011990")).toBe("01/01/1990");
  });

  it("corta o excedente em 8 dígitos", () => {
    expect(maskDateBR("010119901234")).toBe("01/01/1990");
  });
});

describe("validateCPF", () => {
  it("aceita CPF válido com e sem máscara", () => {
    expect(validateCPF(CPF_VALIDO)).toBe(true);
    expect(validateCPF("111.444.777-35")).toBe(true);
    expect(validateCPF("12345678909")).toBe(true);
  });

  it("recusa dígito verificador errado", () => {
    expect(validateCPF("11144477734")).toBe(false);
  });

  it("recusa tamanho diferente de 11", () => {
    expect(validateCPF("1114447773")).toBe(false);
    expect(validateCPF("")).toBe(false);
  });

  it("recusa sequência de dígitos repetidos", () => {
    expect(validateCPF("11111111111")).toBe(false);
    expect(validateCPF("00000000000")).toBe(false);
  });
});

describe("validateCNPJ", () => {
  it("aceita CNPJ válido com e sem máscara", () => {
    expect(validateCNPJ(CNPJ_VALIDO)).toBe(true);
    expect(validateCNPJ("11.222.333/0001-81")).toBe(true);
  });

  it("recusa dígito verificador errado", () => {
    expect(validateCNPJ("11222333000182")).toBe(false);
  });

  it("recusa tamanho diferente de 14", () => {
    expect(validateCNPJ("1122233300018")).toBe(false);
  });

  it("recusa sequência de dígitos repetidos", () => {
    expect(validateCNPJ("11111111111111")).toBe(false);
  });
});

describe("validateEmailDomain", () => {
  it("aceita domínios comuns", () => {
    expect(validateEmailDomain("pessoa@gmail.com")).toBe(true);
    expect(validateEmailDomain("pessoa@empresa.com.br")).toBe(true);
    expect(validateEmailDomain("pessoa+tag@gmail.com")).toBe(true);
  });

  it("recusa endereço sem exatamente um arroba", () => {
    expect(validateEmailDomain("semarroba.com")).toBe(false);
    expect(validateEmailDomain("dois@@arrobas.com")).toBe(false);
  });

  it("recusa domínio sem TLD ou malformado", () => {
    expect(validateEmailDomain("pessoa@dominio")).toBe(false);
    expect(validateEmailDomain("pessoa@-dominio.com")).toBe(false);
    expect(validateEmailDomain("pessoa@dominio.c")).toBe(false);
  });

  it("recusa domínios descartáveis", () => {
    expect(validateEmailDomain("pessoa@mailinator.com")).toBe(false);
    expect(validateEmailDomain("pessoa@yopmail.com")).toBe(false);
    expect(validateEmailDomain("pessoa@grr.la")).toBe(false);
  });

  it("normaliza espaços e caixa antes de validar", () => {
    expect(validateEmailDomain("  Pessoa@Gmail.COM  ")).toBe(true);
    expect(validateEmailDomain("PESSOA@MAILINATOR.COM")).toBe(false);
  });
});
