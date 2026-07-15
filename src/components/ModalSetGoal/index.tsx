"use client";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { ModalBase } from "@/components/ModalBase";
import { ToastMessage } from "@/components/Toast";
import { useAppTheme } from "@/context/ThemeContext";
import { ChargeServices } from "@/services/ChargeService";
import { currencyToBackendBRL, maskCurrencyBRL } from "@/utils/mask";
import { yupResolver } from "@hookform/resolvers/yup";
import { Save } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import * as Yup from "yup";
import styles from "./ModalSetGoal.module.css";

// Define a meta mensal (admin) via PUT /charges/monthly-goal. O valor é digitado
// em BRL e enviado no formato "xx,xx" que o backend espera. `month` é 1-12,
// mesma convenção do getGoalProgress que alimenta o card.

type Props = {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  year: number;
  month: number; // 1-12
  monthLabel: string;
  currentGoal?: number;
};

interface FormValues {
  amount: string;
}

const goalSchema = Yup.object().shape({
  amount: Yup.string()
    .required("Valor é obrigatório")
    .test("positivo", "Informe um valor maior que zero", (value) => {
      if (!value) return false;
      return Number(currencyToBackendBRL(value).replace(",", ".")) > 0;
    }),
});

export function ModalSetGoal({
  visible,
  onClose,
  onSaved,
  year,
  month,
  monthLabel,
  currentGoal,
}: Props) {
  const { colors, mode } = useAppTheme();

  const {
    watch,
    setValue,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: yupResolver(goalSchema) as never,
    defaultValues: {
      amount: currentGoal ? maskCurrencyBRL(currentGoal.toFixed(2)) : "",
    },
  });

  // defaultValues só se aplica na montagem; o card mantém o modal montado entre
  // aberturas, então re-sincroniza o campo com a meta atual toda vez que abre.
  useEffect(() => {
    if (visible) {
      reset({ amount: currentGoal ? maskCurrencyBRL(currentGoal.toFixed(2)) : "" });
    }
  }, [visible, currentGoal, reset]);

  const onValid = async (values: FormValues) => {
    try {
      await ChargeServices.setMonthlyGoal(
        year,
        month,
        currencyToBackendBRL(values.amount),
      );
      ToastMessage.success("Meta atualizada");
      onSaved();
      setTimeout(onClose, 800);
    } catch {
      ToastMessage.error("Erro", "Não foi possível salvar a meta.");
    }
  };

  const onInvalid = () => {
    ToastMessage.error("Campos inválidos", "Revise o valor informado.");
  };

  return (
    <ModalBase onClose={onClose} visible={visible} title="Meta do mês">
      <div className={styles.overlay}>
        <div className={styles.scroll}>
          <Card title={`Meta de ${monthLabel}`}>
            <p className={styles.hint}>
              Defina quanto a comunidade pretende arrecadar neste mês. Esse valor
              vira a meta exibida no card da Dashboard.
            </p>

            <Input
              label="Valor da meta"
              value={watch("amount")}
              onChangeText={(v) =>
                setValue("amount", maskCurrencyBRL(v), {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
              error={errors.amount?.message}
              inputMode="decimal"
              placeholder="R$ 0,00"
            />
          </Card>
        </div>

        <div className={styles.footer}>
          <Button
            title="Salvar meta"
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
