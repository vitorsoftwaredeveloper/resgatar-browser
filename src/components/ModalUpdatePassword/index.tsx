"use client";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { ModalBase } from "@/components/ModalBase";
import { ToastMessage } from "@/components/Toast";
import { useAuth } from "@/context/AuthContext";
import { yupResolver } from "@hookform/resolvers/yup";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as Yup from "yup";

// Portado de resgatar_app/src/screens/ProfileScreen/ModalUpdatePassword. Formik
// vira React Hook Form + @hookform/resolvers/yup, mesmo schema de validação.

interface IModalUpdatePassword {
  passwordModalVisible: boolean;
  onClose: () => void;
  memberIdPasswordWillBeChanged?: string;
}

interface FormValues {
  password: string;
  confirmPassword: string;
}

const passwordValidationSchema = Yup.object().shape({
  password: Yup.string()
    .required("Senha é obrigatória")
    .min(8, "A senha deve ter no mínimo 8 caracteres")
    .matches(/^(?=.*[a-z])/, "A senha deve conter pelo menos uma letra minúscula")
    .matches(/^(?=.*[A-Z])/, "A senha deve conter pelo menos uma letra maiúscula")
    .matches(/^(?=.*\d)/, "A senha deve conter pelo menos um número")
    .matches(/^(?=.*[@$!%*?&#])/, "A senha deve conter pelo menos um caractere especial: @$!%*?&#"),

  confirmPassword: Yup.string()
    .required("Confirmação de senha é obrigatória")
    .oneOf([Yup.ref("password")], "As senhas não conferem"),
});

export const ModalUpdatePassword = ({
  passwordModalVisible,
  onClose,
  memberIdPasswordWillBeChanged,
}: IModalUpdatePassword) => {
  const { changePassword, member } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    watch,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: yupResolver(passwordValidationSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onValid = async ({ password }: FormValues) => {
    try {
      await changePassword(memberIdPasswordWillBeChanged ? memberIdPasswordWillBeChanged : (member?._id as string), password);
      ToastMessage.success("Senha alterada com sucesso");
      setTimeout(onClose, 2000);
    } catch {
      ToastMessage.error("Erro ao atualizar senha");
    }
  };

  const onInvalid = (formErrors: typeof errors) => {
    const firstError = Object.values(formErrors)[0]?.message as string | undefined;
    if (firstError) ToastMessage.error("Campos inválidos", firstError);
  };

  const eyeToggle = (
    <button type="button" onClick={() => setShowPassword((prev) => !prev)} aria-label="Mostrar/ocultar senha">
      {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
    </button>
  );

  return (
    <ModalBase visible={passwordModalVisible} onClose={onClose} title="Atualizar senha">
      <div>
        <Card title="Senha">
          <Input
            label="Nova senha"
            type={showPassword ? "text" : "password"}
            value={watch("password")}
            onChangeText={(v) => setValue("password", v, { shouldValidate: true, shouldDirty: true })}
            rightIcon={eyeToggle}
            error={errors.password?.message}
          />

          <Input
            label="Confirmar senha"
            type={showPassword ? "text" : "password"}
            value={watch("confirmPassword")}
            onChangeText={(v) => setValue("confirmPassword", v, { shouldValidate: true, shouldDirty: true })}
            rightIcon={eyeToggle}
            error={errors.confirmPassword?.message}
          />
        </Card>

        <div style={{ padding: "var(--spacing-lg)" }}>
          <Button title="Salvar" onPress={handleSubmit(onValid, onInvalid)} loading={isSubmitting} disabled={isSubmitting} />
        </div>
      </div>
    </ModalBase>
  );
};
