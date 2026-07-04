// Portado de resgatar_app/src/utils/mask.ts (idêntico — JS puro).

const onlyNumbers = (value: string) => value.replace(/\D/g, "");

const maskPhoneBR = (value: string) => {
  const digits = onlyNumbers(value).slice(0, 11);

  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  return digits
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
};

const maskCEP = (value: string) =>
  onlyNumbers(value)
    .slice(0, 8)
    .replace(/(\d{5})(\d)/, "$1-$2");

const maskCPF = (value: string) =>
  onlyNumbers(value)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");

const maskCNPJ = (value: string) =>
  onlyNumbers(value)
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");

const maskCPFOrCNPJ = (value: string, type: "CPF" | "CNPJ") =>
  type === "CPF" ? maskCPF(value) : maskCNPJ(value);

const maskCurrencyBRL = (value: string) => {
  const digits = onlyNumbers(value);
  const number = Number(digits) / 100;

  return number.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};

// Converte o valor digitado (ou já mascarado) no formato aceito pelo backend
// de despesas/charges: "0,00" (sem separador de milhar, sem "R$").
// Ex.: "R$ 1.234,56" ou "123456" -> "1234,56". Casa com ^[0-9]+,[0-9]{2}$.
const currencyToBackendBRL = (value: string) => {
  const digits = onlyNumbers(value);
  const number = Number(digits) / 100;

  return number.toFixed(2).replace(".", ",");
};

function maskDateBR(value: string) {
  const numbers = value.replace(/\D/g, "").slice(0, 8);

  const day = numbers.slice(0, 2);
  const month = numbers.slice(2, 4);
  const year = numbers.slice(4, 8);

  if (numbers.length <= 2) return day;
  if (numbers.length <= 4) return `${day}/${month}`;

  return `${day}/${month}/${year}`;
}

function validateCPF(value: string): boolean {
  const digits = onlyNumbers(value);
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  const calc = (factor: number) => {
    let sum = 0;
    for (let i = 0; i < factor - 1; i++) {
      sum += parseInt(digits[i]) * (factor - i);
    }
    const rem = (sum * 10) % 11;
    return rem === 10 || rem === 11 ? 0 : rem;
  };

  return calc(10) === parseInt(digits[9]) && calc(11) === parseInt(digits[10]);
}

function validateCNPJ(value: string): boolean {
  const digits = onlyNumbers(value);
  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;

  const calc = (weights: number[]) => {
    let sum = 0;
    for (let i = 0; i < weights.length; i++) {
      sum += parseInt(digits[i]) * weights[i];
    }
    const rem = sum % 11;
    return rem < 2 ? 0 : 11 - rem;
  };

  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  return calc(w1) === parseInt(digits[12]) && calc(w2) === parseInt(digits[13]);
}

const DISPOSABLE_DOMAINS = new Set([
  "mail.com",
  "mailinator.com",
  "guerrillamail.com",
  "guerrillamail.net",
  "guerrillamail.org",
  "guerrillamail.biz",
  "guerrillamail.de",
  "guerrillamail.info",
  "grr.la",
  "sharklasers.com",
  "spam4.me",
  "yopmail.com",
  "yopmail.fr",
  "cool.fr.nf",
  "jetable.fr.nf",
  "nospam.ze.tc",
  "nomail.xl.cx",
  "mega.zik.dj",
  "speed.1s.fr",
  "courriel.fr.nf",
  "moncourrier.fr.nf",
  "monemail.fr.nf",
  "monmail.fr.nf",
  "tempmail.com",
  "tempmail.net",
  "tempmail.org",
  "temp-mail.org",
  "temp-mail.io",
  "throwam.com",
  "throwam.net",
  "trashmail.com",
  "trashmail.net",
  "trashmail.me",
  "trashmail.at",
  "trashmail.io",
  "trashmail.xyz",
  "10minutemail.com",
  "10minutemail.net",
  "10minutemail.org",
  "fakeinbox.com",
  "mailnull.com",
  "maildrop.cc",
  "spamgourmet.com",
  "spamgourmet.net",
  "spamgourmet.org",
  "dispostable.com",
  "mailnesia.com",
  "mailnull.com",
  "spamhereplease.com",
  "spamthisplease.com",
  "example.com",
  "example.net",
  "example.org",
  "test.com",
  "test.net",
  "test.org",
  "teste.com",
  "teste.net",
  "localhost.com",
]);

function validateEmailDomain(email: string): boolean {
  const parts = email.toLowerCase().trim().split("@");
  if (parts.length !== 2) return false;
  const domain = parts[1];
  if (DISPOSABLE_DOMAINS.has(domain)) return false;
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z]{2,})+$/.test(domain)) return false;
  return true;
}

export {
  onlyNumbers,
  maskPhoneBR,
  maskCEP,
  maskCPFOrCNPJ,
  maskCurrencyBRL,
  currencyToBackendBRL,
  maskDateBR,
  validateCPF,
  validateCNPJ,
  validateEmailDomain,
};
