import { pushToast } from "./toastStore";

// Portado de resgatar_app/src/components/Toast (mesma API estática usada pelos
// serviços/hooks). No RN usava react-native-toast-message; no web publica no
// toastStore, renderizado globalmente por <ToastHost /> (montado em Providers).

export const ToastMessage = {
  success: (title: string, message?: string) =>
    pushToast("success", title, message, 3000),

  error: (title: string, message?: string) =>
    pushToast("error", title, message, 4000),

  warning: (title: string, message?: string) =>
    pushToast("warning", title, message, 3500),
};
