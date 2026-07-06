"use client";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { ModalBase } from "@/components/ModalBase";
import { TextArea } from "@/components/TextArea";
import { ToastMessage } from "@/components/Toast";
import { useAppTheme } from "@/context/ThemeContext";
import { NotificationServices } from "@/services/NotificationService";
import { yupResolver } from "@hookform/resolvers/yup";
import { Send } from "lucide-react";
import { useForm } from "react-hook-form";
import * as Yup from "yup";
import styles from "./ModalSendNotification.module.css";

// Portado de resgatar_app/src/screens/SettingsScreen/ModalSendNotification.
// Formik vira React Hook Form + @hookform/resolvers/yup, mesmo schema.

type Props = {
  visible: boolean;
  onClose: () => void;
};

interface FormValues {
  title: string;
  description: string;
}

const notificationSchema = Yup.object().shape({
  title: Yup.string().required("Título é obrigatório").min(3, "Título muito curto"),
  description: Yup.string().required("Descrição é obrigatória").min(5, "Descrição muito curta"),
});

export function ModalSendNotification({ visible, onClose }: Props) {
  const { colors, mode } = useAppTheme();

  const {
    watch,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: yupResolver(notificationSchema),
    defaultValues: { title: "", description: "" },
  });

  const onValid = async (values: FormValues) => {
    try {
      await NotificationServices.createNotification(values);
      ToastMessage.success("Notificação enviada com sucesso");
      setTimeout(onClose, 2000);
    } catch {
      ToastMessage.error("Erro ao enviar notificação");
    }
  };

  const onInvalid = () => {
    ToastMessage.error("Campos inválidos", "Campos preenchidos incorretamente.");
  };

  return (
    <ModalBase onClose={onClose} visible={visible} title="Enviar notificação">
      <div className={styles.container}>
        <Card title="Notificação">
          <Input
            label="Título"
            value={watch("title")}
            onChangeText={(v) => setValue("title", v, { shouldValidate: true, shouldDirty: true })}
            error={errors.title?.message}
          />

          <TextArea
            label="Descrição"
            value={watch("description")}
            onChangeText={(v) => setValue("description", v, { shouldValidate: true, shouldDirty: true })}
            error={errors.description?.message}
            numberOfLines={4}
            placeholder="Descreva a notificação..."
          />
        </Card>

        <div style={{ padding: "var(--spacing-lg)" }}>
          <Button
            title="Enviar"
            leftIcon={<Send color={mode === "dark" ? colors.black : colors.white} size={18} />}
            onPress={handleSubmit(onValid, onInvalid)}
            loading={isSubmitting}
            disabled={isSubmitting}
          />
        </div>
      </div>
    </ModalBase>
  );
}
