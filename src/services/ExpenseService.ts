import { ICreateExpensePayload, IEditExpensePayload, IExpense, IExpensesSummary } from "@/types/Expense";
import { api } from "./api";

// Portado de resgatar_app/src/services/ExpenseService.ts. `uploadReceipt`
// recebe o `File` diretamente (o browser já expõe o binário via <input
// type="file">), sem o passo extra de `fetch(uri).blob()` do RN.
export const ExpenseServices = {
  create: async (payload: ICreateExpensePayload): Promise<string> => {
    try {
      const response = await api.post("/expenses", payload);
      const { data } = response.data;

      return data._id;
    } catch (error) {
      console.error("Error creating expense", error);
      throw error;
    }
  },
  list: async (year: number, month: number): Promise<IExpense[]> => {
    try {
      const response = await api.get("/expenses", {
        params: { year, month },
      });
      const { data } = response.data;

      return data;
    } catch (error) {
      console.error("Error listing expenses", error);
      throw error;
    }
  },
  getSummary: async (year: number, month: number): Promise<IExpensesSummary> => {
    try {
      const response = await api.get("/expenses/summary", {
        params: { year, month },
      });
      const { data } = response.data;

      return data;
    } catch (error) {
      console.error("Error fetching expenses summary", error);
      throw error;
    }
  },
  update: async (expenseId: string, payload: IEditExpensePayload): Promise<void> => {
    try {
      await api.put(`/expenses/${expenseId}`, payload);
    } catch (error) {
      console.error("Error updating expense", error);
      throw error;
    }
  },
  remove: async (expenseId: string): Promise<void> => {
    try {
      await api.delete(`/expenses/${expenseId}`);
    } catch (error) {
      console.error("Error removing expense", error);
      throw error;
    }
  },
  uploadReceipt: async (file: File, contentType: string): Promise<string> => {
    try {
      const { data } = (
        await api.get("/expenses/receipt-upload-url", {
          params: { contentType },
        })
      ).data;
      const { uploadUrl, key } = data as { uploadUrl: string; key: string };

      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": contentType },
      });

      if (!uploadResponse.ok) {
        throw new Error(`S3 upload failed with status ${uploadResponse.status}`);
      }

      return key;
    } catch (error) {
      console.error("Error uploading receipt", error);
      throw error;
    }
  },
  getReceiptViewUrl: async (expenseId: string): Promise<string> => {
    try {
      const { data } = (await api.get(`/expenses/${expenseId}/receipt`)).data;

      return (data as { viewUrl: string }).viewUrl;
    } catch (error) {
      console.error("Error fetching receipt view URL", error);
      throw error;
    }
  },
};
