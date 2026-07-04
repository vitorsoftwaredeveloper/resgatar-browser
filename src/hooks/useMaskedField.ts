import { FieldValues, Path, UseFormWatch, UseFormSetValue } from "react-hook-form";

// Equivalente ao useMaskedFieldFromFormik do app, adaptado para React Hook
// Form: aplica a máscara a cada digitação via setValue (validando e marcando
// o campo como dirty), com o valor atual lido via watch.

export function useMaskedField<T extends FieldValues>(
  name: Path<T>,
  mask: (value: string) => string,
  form: { watch: UseFormWatch<T>; setValue: UseFormSetValue<T> },
) {
  return {
    value: (form.watch(name) as string) ?? "",
    onChangeText: (text: string) => {
      form.setValue(name, mask(text) as T[Path<T>], {
        shouldValidate: true,
        shouldDirty: true,
      });
    },
  };
}
