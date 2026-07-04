"use client";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { DocTypeToggle } from "@/components/DocTypeToggle";
import { Input } from "@/components/Input";
import { ModalBase } from "@/components/ModalBase";
import { Row } from "@/components/Row";
import { ToastMessage } from "@/components/Toast";
import { useAuth } from "@/context/AuthContext";
import { useCepLookup } from "@/hooks/useCepLookup";
import { useMaskedField } from "@/hooks/useMaskedField";
import { IMemberState } from "@/types/Member";
import { formatDateFromTimestamp, parseDateBRToTimestamp } from "@/utils/helper";
import {
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
import { yupResolver } from "@hookform/resolvers/yup";
import { Loader } from "lucide-react";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import * as Yup from "yup";
import styles from "./ModalEditProfile.module.css";

// Portado de resgatar_app/src/screens/ProfileScreen/ModalEditProfile. Formik
// vira React Hook Form + @hookform/resolvers/yup, mesmo schema de validação.

interface IModalEditProfile {
  editModalVisible: boolean;
  onClose: () => void;
}

const profileValidationSchema = Yup.object().shape({
  email: Yup.string()
    .email("Email inválido")
    .test("email-domain", "Domínio de email não permitido", (v) => validateEmailDomain(v || ""))
    .required("Email obrigatório"),

  firstName: Yup.string().max(50, "Nome muito longo (máx. 50 caracteres)").required("Nome obrigatório"),

  lastName: Yup.string().max(50, "Sobrenome muito longo (máx. 50 caracteres)").required("Sobrenome obrigatório"),

  bio: Yup.string().max(300, "Máximo de 300 caracteres"),

  dateOfBirth: Yup.string()
    .required("Data de nascimento obrigatória")
    .test("valid-date", "Data inválida", (value?: string) => {
      if (!value || value.length !== 10) return false;
      const [day, month, year] = value.split("/").map(Number);
      const date = new Date(year, month - 1, day);
      return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
    })
    .test("min-year-1970", "Data deve ser a partir de 1970", (value?: string) => {
      if (!value) return true;
      const year = parseInt(value.split("/")[2] ?? "0", 10);
      return year >= 1970;
    })
    .test("not-future", "Data de nascimento não pode ser no futuro", (value?: string) => {
      if (!value || value.length !== 10) return true;
      const [day, month, year] = value.split("/").map(Number);
      return new Date(year, month - 1, day) <= new Date();
    }),

  state: Yup.string().length(2, "UF inválida"),

  city: Yup.string().max(80, "Cidade muito longa (máx. 80 caracteres)"),

  street: Yup.string().max(100, "Endereço muito longo (máx. 100 caracteres)"),

  number: Yup.string().max(10, "Número muito longo"),

  complement: Yup.string().max(50, "Complemento muito longo (máx. 50 caracteres)").nullable(),

  datePayment: Yup.string().required("Selecione o dia"),

  type: Yup.string().oneOf(["CPF", "CNPJ"]).required(),

  phoneNumber: Yup.string()
    .test("phone", "Telefone inválido", (value) => onlyNumbers(value || "").length >= 10)
    .required("Telefone obrigatório"),

  zip: Yup.string()
    .test("cep", "CEP inválido", (value) => onlyNumbers(value || "").length === 8)
    .required("CEP obrigatório"),

  amount: Yup.string()
    .test(
      "amount",
      "Informe um valor de contribuição válido (mínimo R$ 1,00)",
      (value) => Number(onlyNumbers(value || "")) >= 100,
    )
    .required("Valor obrigatório"),

  numberType: Yup.string()
    .test("doc", "Documento inválido", (value, ctx) => {
      const type = ctx.parent.type;
      return type === "CPF" ? validateCPF(value || "") : validateCNPJ(value || "");
    })
    .required("Documento obrigatório"),
});

export const ModalEditProfile = ({ editModalVisible, onClose }: IModalEditProfile) => {
  const { member, updateMember } = useAuth();
  const { loading: cepLoading, fetchCep } = useCepLookup();
  const savedDocValues = useRef<Record<string, string>>({
    CPF: maskCPFOrCNPJ(member?.identification?.numberType || "", "CPF"),
    CNPJ: maskCPFOrCNPJ(member?.identification?.numberType || "", "CNPJ"),
  });

  const initialValues: IMemberState = {
    email: member?.email || "",
    phoneNumber: maskPhoneBR(member?.phoneNumber || ""),
    firstName: member?.firstName || "",
    lastName: member?.lastName || "",
    bio: member?.bio || "",
    dateOfBirth: formatDateFromTimestamp(Number(member?.dateOfBirth)) || "",
    street: member?.address?.street || "",
    number: member?.address?.number || "",
    city: member?.address?.city || "",
    state: member?.address?.state || "",
    zip: maskCEP(member?.address?.zip || ""),
    complement: member?.address?.complement || "",
    datePayment: member?.paymentInfo?.datePayment?.toString() || "",
    amount: member?.paymentInfo?.amount ? maskCurrencyBRL(member.paymentInfo.amount) : "",
    type: member?.identification?.type || "CPF",
    numberType: maskCPFOrCNPJ(member?.identification?.numberType || "", member?.identification?.type || "CPF"),
  };

  const {
    watch,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<IMemberState>({
    resolver: yupResolver(profileValidationSchema) as never,
    defaultValues: initialValues,
  });

  const identity = (v: string) => v;
  const emailField = useMaskedField<IMemberState>("email", identity, { watch, setValue });
  const firstNameField = useMaskedField<IMemberState>("firstName", identity, { watch, setValue });
  const lastNameField = useMaskedField<IMemberState>("lastName", identity, { watch, setValue });
  const bioField = useMaskedField<IMemberState>("bio", identity, { watch, setValue });
  const stateField = useMaskedField<IMemberState>("state", identity, { watch, setValue });
  const cityField = useMaskedField<IMemberState>("city", identity, { watch, setValue });
  const streetField = useMaskedField<IMemberState>("street", identity, { watch, setValue });
  const numberField = useMaskedField<IMemberState>("number", identity, { watch, setValue });
  const complementField = useMaskedField<IMemberState>("complement", identity, { watch, setValue });
  const phoneField = useMaskedField<IMemberState>("phoneNumber", maskPhoneBR, { watch, setValue });
  const amountField = useMaskedField<IMemberState>("amount", maskCurrencyBRL, { watch, setValue });
  const documentField = useMaskedField<IMemberState>("numberType", (v) => maskCPFOrCNPJ(v, watch("type") as "CPF" | "CNPJ"), {
    watch,
    setValue,
  });
  const birthField = useMaskedField<IMemberState>("dateOfBirth", maskDateBR, { watch, setValue });

  const type = watch("type") as "CPF" | "CNPJ";
  const datePayment = watch("datePayment");

  const onValid = async (values: IMemberState) => {
    const payload = {
      ...values,
      phoneNumber: onlyNumbers(values.phoneNumber as string),
      zip: onlyNumbers(values.zip as string),
      numberType: onlyNumbers(values.numberType as string),
      dateOfBirth: parseDateBRToTimestamp(values.dateOfBirth as string),
    };

    try {
      await updateMember(payload as unknown as IMemberState);
      ToastMessage.success("Sucesso", "Perfil atualizado com sucesso!");
      setTimeout(onClose, 1500);
    } catch {
      ToastMessage.error("Erro", "Falha ao atualizar perfil.");
    }
  };

  const onInvalid = (formErrors: typeof errors) => {
    const firstError = Object.values(formErrors)[0]?.message as string | undefined;
    if (firstError) ToastMessage.error("Campos inválidos", firstError);
  };

  return (
    <ModalBase visible={editModalVisible} onClose={onClose} title="Meus dados">
      <div className={styles.container}>
        <div className={styles.scroll}>
          <Card title="Dados pessoais">
            <Input label="Email" inputMode="email" {...emailField} error={errors.email?.message} />

            <Input label="Telefone" inputMode="tel" {...phoneField} error={errors.phoneNumber?.message} />

            <Input label="Nome" maxLength={50} {...firstNameField} error={errors.firstName?.message} />

            <Input label="Sobrenome" maxLength={50} {...lastNameField} error={errors.lastName?.message} />

            <Input
              label="Data de nascimento"
              placeholder="dd/mm/aaaa"
              inputMode="numeric"
              {...birthField}
              error={errors.dateOfBirth?.message}
            />

            <Input label="Bio" {...bioField} error={errors.bio?.message} />
          </Card>

          <Card title="Endereço">
            <Input
              label="CEP"
              inputMode="numeric"
              value={watch("zip") as string}
              onChangeText={async (v) => {
                const masked = maskCEP(v);
                setValue("zip", masked, { shouldValidate: true, shouldDirty: true });
                const result = await fetchCep(masked);
                if (result) {
                  setValue("street", result.street, { shouldDirty: true });
                  setValue("city", result.city, { shouldDirty: true });
                  setValue("state", result.state, { shouldDirty: true });
                }
              }}
              error={errors.zip?.message}
              rightIcon={cepLoading ? <Loader size={18} className={styles.spinner} /> : undefined}
            />

            <Row>
              <Input label="Estado" maxLength={2} className={styles.half} {...stateField} error={errors.state?.message} />
              <Input label="Cidade" maxLength={80} className={styles.half} {...cityField} error={errors.city?.message} />
            </Row>

            <Input label="Logradouro" maxLength={100} {...streetField} error={errors.street?.message} />

            <Row>
              <Input
                label="Número"
                inputMode="numeric"
                maxLength={10}
                className={styles.half}
                {...numberField}
                error={errors.number?.message}
              />
              <Input label="Complemento" maxLength={50} className={styles.half} {...complementField} />
            </Row>
          </Card>

          <Card title="Contribuição" description="Dia do mês e valor mensal da sua contribuição à comunidade.">
            <p className={styles.subLabel}>Dia da contribuição</p>

            <div className={styles.daysGrid}>
              {Array.from({ length: 10 }, (_, i) => {
                const day = String(i + 1);
                const selected = datePayment === day;

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setValue("datePayment", day, { shouldValidate: true, shouldDirty: true })}
                    className={[styles.dayCircle, selected && styles.dayCircleActive].filter(Boolean).join(" ")}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            <Input label="Valor" inputMode="decimal" {...amountField} error={errors.amount?.message} />
          </Card>

          <Card title="Identificação" description="Documento utilizado para emissão do comprovante PIX.">
            <DocTypeToggle
              value={type}
              onChange={(nextType) => {
                savedDocValues.current[type] = watch("numberType") as string;
                setValue("type", nextType, { shouldDirty: true });
                setValue("numberType", savedDocValues.current[nextType] ?? "", { shouldValidate: true, shouldDirty: true });
              }}
            />

            <Input label={type} inputMode="numeric" {...documentField} error={errors.numberType?.message} />
          </Card>
        </div>

        <div className={styles.footer}>
          <Button title="Salvar" onPress={handleSubmit(onValid, onInvalid)} loading={isSubmitting} disabled={!isDirty || isSubmitting} />
        </div>
      </div>
    </ModalBase>
  );
};
