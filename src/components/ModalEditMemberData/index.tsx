"use client";

import { Avatar } from "@/components/Avatar";
import { ModalBase } from "@/components/ModalBase";
import { RemoveMemberSkeleton } from "@/components/Skeleton/RemoveMemberSkeleton";
import { ToastMessage } from "@/components/Toast";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { MemberServices } from "@/services/MemberService";
import { IMember } from "@/types/Member";
import { useEffect, useState } from "react";
import styles from "./ModalEditMemberData.module.css";

// Portado de resgatar_app/src/screens/SettingsScreen/ModalEditMemberData. O
// Switch nativo vira um checkbox estilizado como toggle.

type Props = {
  visible: boolean;
  onClose: () => void;
};

const SKELETON_COUNT = 4;

export function ModalEditMemberData({ visible, onClose }: Props) {
  const [members, setMembers] = useState<IMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const { listMembers, member: loggedMember, reloadMemberData } = useAuth();
  const { colors } = useAppTheme();

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

  async function handleToggleRole(member: IMember, value: boolean) {
    const newRole = value ? "admin" : "user";
    setUpdating(member._id);
    try {
      // Envia só os campos aceitos pelo editMemberSchema (additionalProperties:
      // false) — espalhar o IMember inteiro incluía readingStreak e quebrava
      // com 500.
      await MemberServices.editMember({
        _id: member._id,
        email: member.email,
        phoneNumber: member.phoneNumber,
        firstName: member.firstName,
        lastName: member.lastName,
        bio: member.bio,
        profileImage: member.profileImage,
        dateOfBirth: Number(member.dateOfBirth),
        address: member.address,
        paymentInfo: member.paymentInfo,
        identification: member.identification,
        role: newRole,
      });
      setMembers((prev) =>
        prev.map((m) => (m._id === member._id ? { ...m, role: newRole } : m)),
      );
      if (member._id === loggedMember?._id) {
        await reloadMemberData();
      }
    } catch {
      ToastMessage.error("Erro", "Falha ao atualizar permissão.");
    } finally {
      setUpdating(null);
    }
  }

  return (
    <ModalBase
      onClose={onClose}
      visible={visible}
      title="Permissões de membros"
    >
      <div className={styles.list}>
        {loading
          ? Array.from({ length: SKELETON_COUNT }).map((_, index) => (
              <RemoveMemberSkeleton key={`skeleton-${index}`} />
            ))
          : members.map((item) => (
              <div key={item._id} className={styles.card}>
                <div className={styles.userInfo}>
                  <Avatar photo={item.profileImage} size={40} />
                  <div>
                    <p className={styles.userName}>{item.firstName}</p>
                    <p className={styles.userEmail}>{item.email}</p>
                  </div>
                </div>

                <div className={styles.action}>
                  {updating === item._id ? (
                    <span
                      className={styles.spinner}
                      style={{ borderTopColor: colors.primary }}
                    />
                  ) : (
                    <label className={styles.switch}>
                      <input
                        type="checkbox"
                        checked={item.role === "admin"}
                        onChange={(e) =>
                          handleToggleRole(item, e.target.checked)
                        }
                        className={styles.switchInput}
                      />
                      <span className={styles.switchTrack}>
                        <span className={styles.switchThumb} />
                      </span>
                    </label>
                  )}
                </div>
              </div>
            ))}
      </div>
    </ModalBase>
  );
}
