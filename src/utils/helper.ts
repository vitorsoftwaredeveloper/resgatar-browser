// Portado de resgatar_app/src/utils/helper.ts (idêntico — JS puro).

function formatDateFromTimestamp(timestamp?: number) {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleDateString("pt-BR");
}

function parseDateBRToTimestamp(date: string): number {
  const [day, month, year] = date.split("/").map(Number);
  return new Date(year, month - 1, day).getTime();
}

function normalizeText(text: string): string {
  return text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function formatLiturgicalDate(dataBR: string): string {
  const [day, month, year] = dataBR.split("/").map(Number);
  const date = new Date(year, month - 1, day);
  const formatted = date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

const formatMoneyBRL = (amount: string | number): string => {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "R$ 0,00";
  return `R$ ${num.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export {
  formatDateFromTimestamp,
  formatLiturgicalDate,
  formatMoneyBRL,
  normalizeText,
  parseDateBRToTimestamp,
};
