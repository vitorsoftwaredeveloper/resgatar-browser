"use client";

import { ModalPhotoPicker } from "@/components/ModalPhotoPicker";
import { ToastMessage } from "@/components/Toast";
import { useAuth } from "@/context/AuthContext";

// Portado de resgatar_app/src/screens/ProfileScreen/ModalEditPhoto.

interface ModalEditPhotoProps {
  visible: boolean;
  onClose: () => void;
}

export const ModalEditPhoto = ({ visible, onClose }: ModalEditPhotoProps) => {
  const { member, updateMemberPhoto } = useAuth();

  const handleConfirm = async (profileImage: string) => {
    try {
      await updateMemberPhoto(profileImage);
      ToastMessage.success("Sucesso", "Foto atualizada com sucesso!");
      setTimeout(onClose, 1500);
    } catch {
      ToastMessage.error("Erro", "Não foi possível atualizar a foto.");
    }
  };

  return (
    <ModalPhotoPicker
      visible={visible}
      onClose={onClose}
      currentPhoto={member?.profileImage}
      onConfirm={handleConfirm}
    />
  );
};
