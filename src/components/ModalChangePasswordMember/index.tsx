"use client";

import { ModalBase } from "@/components/ModalBase";
import { ModalUpdatePassword } from "@/components/ModalUpdatePassword";
import { MemberListWithSkeleton } from "@/components/Skeleton/MemberListWithSkeleton";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { IMember } from "@/types/Member";
import { Pencil } from "lucide-react";
import { useEffect, useState } from "react";

// Portado de resgatar_app/src/screens/SettingsScreen/ModalChangePasswordMember.

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function ModalChangePasswordMember({ visible, onClose }: Props) {
  const [members, setMembers] = useState<IMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<IMember | null>(null);
  const { listMembers } = useAuth();
  const { colors } = useAppTheme();
  const [openChangePassword, setOpenChangePassword] = useState(false);

  async function loadMembers() {
    setLoading(true);
    try {
      const response = await listMembers();
      setMembers(response as unknown as IMember[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!visible) return;
    loadMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleSelectMember = (member: IMember) => {
    setSelectedMember(member);
    setOpenChangePassword(true);
  };

  return (
    <ModalBase onClose={onClose} visible={visible} title="Atualizar senha">
      <MemberListWithSkeleton
        members={members}
        loading={loading}
        onAction={handleSelectMember}
        iconAction={<Pencil size={20} color={colors.primary} />}
        variant="edit"
      />
      {openChangePassword && (
        <ModalUpdatePassword
          passwordModalVisible={openChangePassword}
          onClose={() => setOpenChangePassword(false)}
          memberIdPasswordWillBeChanged={selectedMember?._id}
        />
      )}
    </ModalBase>
  );
}
