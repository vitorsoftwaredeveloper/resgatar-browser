"use client";

import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/Button";
import { DocTypeToggle } from "@/components/DocTypeToggle";
import { Input } from "@/components/Input";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ModalPhotoPicker } from "@/components/ModalPhotoPicker";
import { LogoResgatar } from "@/components/Svg/Logo";
import { LogoResgatarMark } from "@/components/Svg/LogoMark";
import { ToastMessage } from "@/components/Toast";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { useMaskedField } from "@/hooks/useMaskedField";
import { getApiErrorMessage } from "@/utils/apiError";
import { parseDateBRToTimestamp } from "@/utils/helper";
import {
  maskCPFOrCNPJ,
  maskDateBR,
  maskPhoneBR,
  onlyNumbers,
  validateCNPJ,
  validateCPF,
  validateEmailDomain,
} from "@/utils/mask";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  Cake,
  Eye,
  EyeOff,
  IdCard,
  Lock,
  Mail,
  Phone,
  UserRound,
  UserRoundPlus,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as Yup from "yup";
import styles from "./register.module.css";

// Portado de resgatar_app/src/screens/RegisterScreen. Formik vira React Hook
// Form + @hookform/resolvers/yup, mesmo schema de validação e mesmo payload
// enviado ao AuthContext.register.

interface RegisterFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  type: "CPF" | "CNPJ";
  numberType: string;
  dateOfBirth: string;
  password: string;
  confirmPassword: string;
  profileImage: string;
}

const registerSchema = Yup.object().shape({
  firstName: Yup.string().required("Nome obrigatório"),
  lastName: Yup.string().required("Sobrenome obrigatório"),
  email: Yup.string()
    .email("Email inválido")
    .test("email-domain", "Domínio de email não permitido", (v) =>
      validateEmailDomain(v || ""),
    )
    .required("Email obrigatório"),
  phoneNumber: Yup.string()
    .test(
      "phone",
      "Telefone inválido",
      (v) => onlyNumbers(v || "").length >= 10,
    )
    .required("Telefone obrigatório"),
  type: Yup.string().oneOf(["CPF", "CNPJ"]).required(),
  numberType: Yup.string()
    .test("doc", "Documento inválido", (value, ctx) => {
      const type = ctx.parent.type;
      return type === "CPF"
        ? validateCPF(value || "")
        : validateCNPJ(value || "");
    })
    .required("Documento obrigatório"),
  dateOfBirth: Yup.string()
    .required("Data de nascimento obrigatória")
    .test("valid-date", "Data inválida", (value?: string) => {
      if (!value || value.length !== 10) return false;
      const [day, month, year] = value.split("/").map(Number);
      const date = new Date(year, month - 1, day);
      return (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
      );
    })
    .test(
      "min-year-1970",
      "Data deve ser a partir de 1970",
      (value?: string) => {
        if (!value) return true;
        const year = parseInt(value.split("/")[2] ?? "0", 10);
        return year >= 1970;
      },
    )
    .test(
      "not-future",
      "Data de nascimento não pode ser no futuro",
      (value?: string) => {
        if (!value || value.length !== 10) return true;
        const [day, month, year] = value.split("/").map(Number);
        return new Date(year, month - 1, day) <= new Date();
      },
    ),
  password: Yup.string()
    .required("Senha obrigatória")
    .min(8, "Mínimo 8 caracteres")
    .matches(/^(?=.*[a-z])/, "Deve conter letra minúscula")
    .matches(/^(?=.*[A-Z])/, "Deve conter letra maiúscula")
    .matches(/^(?=.*\d)/, "Deve conter número")
    .matches(/^(?=.*[@$!%*?&#])/, "Deve conter caractere especial @$!%*?&#"),
  confirmPassword: Yup.string()
    .required("Confirmação obrigatória")
    .oneOf([Yup.ref("password")], "As senhas não conferem"),
});

const initialValues: RegisterFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  type: "CPF",
  numberType: "",
  dateOfBirth: "",
  password: "",
  confirmPassword: "",
  profileImage: "",
};

export default function RegisterPage() {
  const {
    register,
    loading: authLoading,
    isLoggedIn,
    needsOnboarding,
    onboardingChecked,
  } = useAuth();
  const { colors } = useAppTheme();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);

  useEffect(() => {
    if (authLoading || (isLoggedIn && !onboardingChecked)) return;
    if (isLoggedIn) {
      router.replace(needsOnboarding ? "/onboarding" : "/dashboard");
    }
  }, [authLoading, isLoggedIn, needsOnboarding, onboardingChecked, router]);

  const {
    watch,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: yupResolver(registerSchema) as never,
    defaultValues: initialValues,
  });

  const identity = (v: string) => v;
  const firstNameField = useMaskedField<RegisterFormValues>(
    "firstName",
    identity,
    { watch, setValue },
  );
  const lastNameField = useMaskedField<RegisterFormValues>(
    "lastName",
    identity,
    { watch, setValue },
  );
  const emailField = useMaskedField<RegisterFormValues>("email", identity, {
    watch,
    setValue,
  });
  const phoneField = useMaskedField<RegisterFormValues>(
    "phoneNumber",
    maskPhoneBR,
    { watch, setValue },
  );
  const birthField = useMaskedField<RegisterFormValues>(
    "dateOfBirth",
    maskDateBR,
    { watch, setValue },
  );
  const docField = useMaskedField<RegisterFormValues>(
    "numberType",
    (v) => maskCPFOrCNPJ(v, watch("type") as "CPF" | "CNPJ"),
    { watch, setValue },
  );

  const type = watch("type") as "CPF" | "CNPJ";
  const profileImage = watch("profileImage");

  const passwordToggle = (
    <button
      type="button"
      aria-label="toggle-password"
      onClick={() => setShowPassword(!showPassword)}
      style={{ background: "none", border: "none", display: "flex" }}
    >
      {showPassword ? (
        <Eye size={20} color={colors.muted} />
      ) : (
        <EyeOff size={20} color={colors.muted} />
      )}
    </button>
  );

  const onValid = async (values: RegisterFormValues) => {
    try {
      await register({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        phoneNumber: onlyNumbers(values.phoneNumber),
        password: values.password,
        type: values.type,
        numberType: onlyNumbers(values.numberType),
        profileImage: values.profileImage || undefined,
        dateOfBirth: parseDateBRToTimestamp(values.dateOfBirth),
      });
      ToastMessage.success("Sucesso", "Cadastro realizado!");
      router.push("/login");
    } catch (error) {
      ToastMessage.error(
        "Erro",
        getApiErrorMessage(
          error,
          "Não foi possível criar a conta. Tente novamente.",
        ),
      );
    }
  };

  const onInvalid = (formErrors: typeof errors) => {
    const firstError = Object.values(formErrors)[0]?.message as
      | string
      | undefined;
    if (firstError) ToastMessage.error("Campos inválidos", firstError);
  };

  if (authLoading || isLoggedIn) {
    return <LoadingScreen />;
  }

  return (
    <div className={styles.wrap}>
      <aside className={styles.aside}>
        <div className={styles.watermark} aria-hidden="true">
          <LogoResgatarMark size={1180} color="#EAD7AE" />
        </div>

        <div className={styles.asideCenter}>
          <p className={styles.verse}>
            &ldquo;Doar a vida por amor à santa cruz.&rdquo;
          </p>
          <div className={styles.verseRef}>Mc 10, 45</div>
        </div>
      </aside>

      <div className={styles.panel}>
        <div className={styles.card}>
          <div className={styles.cardBrand}>
            <LogoResgatar size={200} color="var(--accent)" />
          </div>

          <h1 className={styles.h}>Criar conta</h1>
          <p className={styles.sub}>Junte-se à comunidade em poucos passos.</p>

          <div className={styles.avatarPick}>
            <Avatar
              photo={profileImage}
              size={96}
              editable
              onPress={() => setPhotoModalVisible(true)}
            />
            <p className={styles.avatarHint}>Adicionar uma foto (opcional)</p>
          </div>

          {photoModalVisible && (
            <ModalPhotoPicker
              visible={photoModalVisible}
              onClose={() => setPhotoModalVisible(false)}
              currentPhoto={profileImage}
              onConfirm={(photo) => {
                setValue("profileImage", photo, { shouldDirty: true });
                setPhotoModalVisible(false);
              }}
            />
          )}

          <div className={styles.form}>
            <div className={styles.grid2}>
              <Input
                placeholder="Nome"
                autoCapitalize="words"
                {...firstNameField}
                error={errors.firstName?.message}
                leftIcon={<UserRound size={20} color={colors.muted} />}
              />
              <Input
                placeholder="Sobrenome"
                autoCapitalize="words"
                {...lastNameField}
                error={errors.lastName?.message}
                leftIcon={<UserRound size={20} color={colors.muted} />}
              />
            </div>

            <Input
              placeholder="Email"
              type="email"
              autoCapitalize="none"
              {...emailField}
              error={errors.email?.message}
              leftIcon={<Mail size={20} color={colors.muted} />}
            />

            <div className={styles.grid2}>
              <Input
                placeholder="Telefone"
                inputMode="tel"
                {...phoneField}
                error={errors.phoneNumber?.message}
                leftIcon={<Phone size={20} color={colors.muted} />}
              />
              <Input
                placeholder="Data de nascimento"
                inputMode="numeric"
                {...birthField}
                error={errors.dateOfBirth?.message}
                leftIcon={<Cake size={20} color={colors.muted} />}
              />
            </div>

            <DocTypeToggle
              value={type}
              onChange={(nextType) => {
                setValue("type", nextType, { shouldDirty: true });
                setValue("numberType", "", {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }}
            />

            <Input
              placeholder={
                type === "CPF" ? "000.000.000-00" : "00.000.000/0000-00"
              }
              inputMode="numeric"
              {...docField}
              error={errors.numberType?.message}
              leftIcon={<IdCard size={20} color={colors.muted} />}
            />

            <div className={styles.grid2}>
              <Input
                placeholder="Senha"
                type={showPassword ? "text" : "password"}
                value={watch("password")}
                onChangeText={(v) =>
                  setValue("password", v, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
                error={errors.password?.message}
                leftIcon={<Lock size={20} color={colors.muted} />}
                rightIcon={passwordToggle}
              />
              <Input
                placeholder="Confirmar senha"
                type={showPassword ? "text" : "password"}
                value={watch("confirmPassword")}
                onChangeText={(v) =>
                  setValue("confirmPassword", v, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
                error={errors.confirmPassword?.message}
                leftIcon={<Lock size={20} color={colors.muted} />}
                rightIcon={passwordToggle}
              />
            </div>
          </div>

          <Button
            title="Criar conta"
            onPress={handleSubmit(onValid, onInvalid)}
            className={styles.submitButton}
            leftIcon={<UserRoundPlus size={20} color={colors.background} />}
            loading={isSubmitting}
          />

          <div className={styles.switch}>
            Já tem uma conta?
            <Link href="/login" className={styles.switchLink}>
              Entrar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
