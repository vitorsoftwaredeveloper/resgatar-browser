// Portado de resgatar_app/src/types/Donation/index.ts (idêntico). Doação
// avulsa (contribuição fora da mensalidade fixa). Nasce vinculada ao membro
// logado (memberId), mas pode informar o nome de quem realmente doou.
// Backend: POST /donations (PIX) e POST /donations/cash (dinheiro, admin).

export interface IDonation {
  transactionId: string;
  memberId: string;
  donorName?: string;
  amount: string; // "xx,xx"
  paymentMethodId: "pix" | "cash";
  status: string;
  referenceMonth: number; // 0-indexado
  referenceYear: number;
  transactionData?: {
    qrCode?: string;
    qrCodeBase64?: string;
    ticketUrl?: string;
  };
}
