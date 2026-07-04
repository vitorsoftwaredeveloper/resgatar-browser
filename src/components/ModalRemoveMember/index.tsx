"use client";

import { Dialog } from "@/components/Dialog";
import { ModalBase } from "@/components/ModalBase";
import { MemberListWithSkeleton } from "@/components/Skeleton/MemberListWithSkeleton";
import { ToastMessage } from "@/components/Toast";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { IMember } from "@/types/Member";
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

// Portado de resgatar_app/src/screens/SettingsScreen/ModalRemoveMember.

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function ModalRemoveMember({ visible, onClose }: Props) {
  const [members, setMembers] = useState<IMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<IMember | null>(null);
  const { listMembers, removeMember } = useAuth();
  const { colors } = useAppTheme();
  const [openDialog, setOpenDialog] = useState(false);

  async function loadMembers() {
    setLoading(true);
    try {
      const response = await listMembers();
      setMembers(response as unknown as IMember[]);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmRemove() {
    if (!selectedMember) return;

    try {
      await removeMember(selectedMember._id);
      ToastMessage.success("Membro removido com sucesso!");
      loadMembers();
    } catch {
      ToastMessage.error("Erro", "Falha ao remover membro.");
    } finally {
      setSelectedMember(null);
      setOpenDialog(false);
    }
  }

  const handleSelectMember = (member: IMember) => {
    setSelectedMember(member);
    setOpenDialog(true);
  };

  useEffect(() => {
    if (!visible) return;
    loadMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  return (
    <ModalBase onClose={onClose} visible={visible} title="Remover membro">
      <MemberListWithSkeleton
        members={members}
        loading={loading}
        onAction={handleSelectMember}
        iconAction={<Trash2 size={20} color={colors.primary} />}
        variant="delete"
      />
      <Dialog
        visible={openDialog}
        title="Confirmar remoção"
        description={`Tem certeza que deseja remover o membro ${selectedMember?.firstName}? Esta ação não pode ser desfeita.`}
        onClose={() => setOpenDialog(false)}
        actions={[
          { label: "cancelar", variant: "secondary", onPress: () => setOpenDialog(false) },
          { label: "remover", variant: "primary", onPress: handleConfirmRemove },
        ]}
      />
    </ModalBase>
  );
}
