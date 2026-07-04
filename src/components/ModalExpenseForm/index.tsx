"use client";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { ModalBase } from "@/components/ModalBase";
import { TextArea } from "@/components/TextArea";
import { ToastMessage } from "@/components/Toast";
import { useAppTheme } from "@/context/ThemeContext";
import { ReceiptAsset, useReceiptPicker } from "@/hooks/useReceiptPicker";
import { ExpenseServices } from "@/services/ExpenseService";
import { EXPENSE_CATEGORY_LABELS, EXPENSE_CATEGORY_VALUES, ExpenseCategory, IExpense } from "@/types/Expense";
import { formatDateFromTimestamp, parseDateBRToTimestamp } from "@/utils/helper";
import { currencyToBackendBRL, maskCurrencyBRL, maskDateBR } from "@/utils/mask";
import { yupResolver } from "@hookform/resolvers/yup";
import { Camera, Eye, ImageIcon, Save, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as Yup from "yup";
import styles from "./ModalExpenseForm.module.css";

// Portado de resgatar_app/src/screens/ExpensesScreen/ModalExpenseForm. Formik
// vira React Hook Form + @hookform/resolvers/yup; ImagePicker vira
// useReceiptPicker (web) com <input type="file">.

type Props = {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  referenceMonth: number;
  referenceYear: number;
  expense?: IExpense | null;
};

interface FormValues {
  description: string;
  amount: string;
  category: ExpenseCategory | "";
  date: string;
  note: string;
}

const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;

const expenseSchema = Yup.object().shape({
  description: Yup.string().required("Descrição é obrigatória").min(2, "Descrição muito curta"),
  amount: Yup.string()
    .required("Valor é obrigatório")
    .test("positivo", "Informe um valor maior que zero", (value) => {
      if (!value) return false;
      return Number(currencyToBackendBRL(value).replace(",", ".")) > 0;
    }),
  category: Yup.string().required("Selecione uma categoria"),
  date: Yup.string().required("Data é obrigatória").matches(dateRegex, "Use o formato dd/mm/aaaa"),
});

export function ModalExpenseForm({ visible, onClose, onSaved, referenceMonth, referenceYear, expense }: Props) {
  const { colors, mode } = useAppTheme();
  const { loading: pickingReceipt, pickFromLibrary, takePhoto } = useReceiptPicker();

  const isEditing = Boolean(expense);

  const [localReceipt, setLocalReceipt] = useState<ReceiptAsset | null>(null);
  const [receiptRemoved, setReceiptRemoved] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState(false);
  const [activePick, setActivePick] = useState<"library" | "camera" | null>(null);

  const hasExistingReceipt = Boolean(expense?.receiptKey) && !receiptRemoved;
  const receiptBusy = pickingReceipt || uploadingReceipt;

  async function handlePickReceipt(source: "library" | "camera") {
    if (receiptBusy) return;
    setActivePick(source);
    try {
      const asset = source === "library" ? await pickFromLibrary() : await takePhoto();
      if (asset) {
        setLocalReceipt(asset);
        setReceiptRemoved(false);
      }
    } finally {
      setActivePick(null);
    }
  }

  function handleRemoveReceipt() {
    if (receiptBusy) return;
    setLocalReceipt(null);
    if (expense?.receiptKey) setReceiptRemoved(true);
  }

  async function handleViewReceipt() {
    if (!expense?._id || viewingReceipt) return;
    setViewingReceipt(true);
    try {
      const url = await ExpenseServices.getReceiptViewUrl(expense._id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      ToastMessage.error("Erro", "Não foi possível abrir o comprovante.");
    } finally {
      setViewingReceipt(false);
    }
  }

  const defaultDate = expense?.date ?? Date.now();

  const initialValues: FormValues = {
    description: expense?.description ?? "",
    amount: expense ? maskCurrencyBRL(expense.amount) : "",
    category: expense?.category ?? "",
    date: formatDateFromTimestamp(defaultDate),
    note: expense?.note ?? "",
  };

  const {
    watch,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: yupResolver(expenseSchema) as never,
    defaultValues: initialValues,
  });

  const category = watch("category");

  const onValid = async (values: FormValues) => {
    const date = parseDateBRToTimestamp(values.date);

    let receiptKey: string | null | undefined;
    if (localReceipt) {
      setUploadingReceipt(true);
      try {
        receiptKey = await ExpenseServices.uploadReceipt(localReceipt.file, localReceipt.contentType);
      } catch {
        ToastMessage.error("Erro", "Não foi possível enviar o comprovante. Tente novamente.");
        return;
      } finally {
        setUploadingReceipt(false);
      }
    } else if (isEditing && receiptRemoved) {
      receiptKey = null;
    }

    const basePayload = {
      description: values.description.trim(),
      amount: currencyToBackendBRL(values.amount),
      category: values.category as ExpenseCategory,
      referenceMonth,
      referenceYear,
      date,
      note: values.note?.trim() ? values.note.trim() : undefined,
    };

    try {
      if (isEditing && expense) {
        await ExpenseServices.update(expense._id, receiptKey !== undefined ? { ...basePayload, receiptKey } : basePayload);
        ToastMessage.success("Despesa atualizada");
      } else {
        await ExpenseServices.create(receiptKey ? { ...basePayload, receiptKey } : basePayload);
        ToastMessage.success("Despesa cadastrada");
      }
      onSaved();
      setTimeout(onClose, 800);
    } catch {
      ToastMessage.error("Erro", isEditing ? "Não foi possível atualizar a despesa." : "Não foi possível cadastrar a despesa.");
    }
  };

  const onInvalid = () => {
    ToastMessage.error("Campos inválidos", "Revise os campos destacados.");
  };

  return (
    <ModalBase onClose={onClose} visible={visible} title={isEditing ? "Editar despesa" : "Nova despesa"}>
      <div className={styles.overlay}>
        <div className={styles.scroll}>
          <Card title="Dados da despesa">
            <Input
              label="Descrição"
              value={watch("description")}
              onChangeText={(v) => setValue("description", v, { shouldValidate: true, shouldDirty: true })}
              error={errors.description?.message}
              placeholder="Ex.: Compra de material de limpeza"
            />

            <Input
              label="Valor"
              value={watch("amount")}
              onChangeText={(v) => setValue("amount", maskCurrencyBRL(v), { shouldValidate: true, shouldDirty: true })}
              error={errors.amount?.message}
              inputMode="decimal"
              placeholder="R$ 0,00"
            />

            <Input
              label="Data"
              value={watch("date")}
              onChangeText={(v) => setValue("date", maskDateBR(v), { shouldValidate: true, shouldDirty: true })}
              error={errors.date?.message}
              inputMode="numeric"
              placeholder="dd/mm/aaaa"
            />

            <p className={styles.fieldLabel}>Categoria</p>
            <div className={styles.categoryGrid}>
              {EXPENSE_CATEGORY_VALUES.map((cat) => {
                const selected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setValue("category", cat, { shouldValidate: true, shouldDirty: true })}
                    className={[styles.categoryChip, selected && styles.categoryChipSelected].filter(Boolean).join(" ")}
                  >
                    {EXPENSE_CATEGORY_LABELS[cat]}
                  </button>
                );
              })}
            </div>
            {errors.category?.message && <p className={styles.errorText}>{errors.category.message}</p>}

            <TextArea
              label="Observação (opcional)"
              value={watch("note")}
              onChangeText={(v) => setValue("note", v, { shouldDirty: true })}
              numberOfLines={3}
              placeholder="Detalhes adicionais..."
            />
          </Card>

          <Card title="Comprovante">
            {localReceipt ? (
              <div className={styles.receiptPreviewWrap}>
                <div className={styles.receiptPreview}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={localReceipt.previewUrl} alt="Comprovante" className={styles.receiptImage} />
                  <button
                    type="button"
                    className={styles.receiptRemoveBadge}
                    onClick={handleRemoveReceipt}
                    disabled={receiptBusy}
                    aria-label="Remover comprovante"
                  >
                    <X size={16} color={colors.white} />
                  </button>
                </div>
              </div>
            ) : hasExistingReceipt ? (
              <p className={styles.receiptAttachedText}>Comprovante anexado</p>
            ) : (
              <p className={styles.receiptHint}>Anexe a foto do recibo do serviço (opcional).</p>
            )}

            {hasExistingReceipt && !localReceipt ? (
              <div className={styles.receiptActions}>
                <button type="button" className={styles.receiptActionButton} onClick={handleViewReceipt} disabled={viewingReceipt}>
                  {viewingReceipt ? <span className={styles.spinner} /> : <Eye size={18} color={colors.primary} />}
                  <span className={styles.receiptActionText}>Ver</span>
                </button>
                <button type="button" className={styles.receiptActionButton} onClick={handleRemoveReceipt} disabled={receiptBusy}>
                  <Trash2 size={18} color={colors.error} />
                  <span className={styles.receiptActionText} style={{ color: colors.error }}>
                    Remover
                  </span>
                </button>
              </div>
            ) : (
              <div className={styles.receiptActions}>
                <button
                  type="button"
                  className={styles.receiptActionButton}
                  onClick={() => handlePickReceipt("camera")}
                  disabled={receiptBusy}
                >
                  {activePick === "camera" ? <span className={styles.spinner} /> : <Camera size={18} color={colors.primary} />}
                  <span className={styles.receiptActionText}>Câmera</span>
                </button>
                <button
                  type="button"
                  className={styles.receiptActionButton}
                  onClick={() => handlePickReceipt("library")}
                  disabled={receiptBusy}
                >
                  {activePick === "library" ? <span className={styles.spinner} /> : <ImageIcon size={18} color={colors.primary} />}
                  <span className={styles.receiptActionText}>{localReceipt ? "Trocar" : "Galeria"}</span>
                </button>
              </div>
            )}
          </Card>
        </div>

        <div className={styles.footer}>
          <Button
            title={isEditing ? "Salvar alterações" : "Cadastrar despesa"}
            leftIcon={<Save color={mode === "dark" ? colors.black : colors.white} size={18} />}
            onPress={handleSubmit(onValid, onInvalid)}
            loading={isSubmitting}
            disabled={isSubmitting}
          />
        </div>
      </div>
    </ModalBase>
  );
}
