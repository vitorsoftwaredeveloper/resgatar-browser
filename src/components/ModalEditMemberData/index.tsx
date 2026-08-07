"use client";

import { Avatar } from "@/components/Avatar";
import { Dialog } from "@/components/Dialog";
import { ModalBase } from "@/components/ModalBase";
import { RemoveMemberSkeleton } from "@/components/Skeleton/RemoveMemberSkeleton";
import { SelectField } from "@/components/SelectField";
import { ToastMessage } from "@/components/Toast";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { MemberServices } from "@/services/MemberService";
import { IMember, MemberRole } from "@/types/Member";
import { getApiErrorMessage } from "@/utils/apiError";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./ModalEditMemberData.module.css";

type Props = {
  visible: boolean;
  onClose: () => void;
  initialFilter?: RoleFilter;
};

type RoleFilter = "all" | MemberRole;

const SKELETON_COUNT = 4;

const ROLE_OPTIONS: { label: string; value: MemberRole }[] = [
  { label: "Convidado", value: "guest" },
  { label: "Membro", value: "user" },
  { label: "Administrador", value: "admin" },
];

const ROLE_FILTERS: { label: string; value: RoleFilter }[] = [
  { label: "Todos", value: "all" },
  { label: "Convidados", value: "guest" },
  { label: "Membros", value: "user" },
  { label: "Administradores", value: "admin" },
];

export function ModalEditMemberData({
  visible,
  onClose,
  initialFilter = "all",
}: Props) {
  const [members, setMembers] = useState<IMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filter, setFilter] = useState<RoleFilter>(initialFilter);
  const [pendingChange, setPendingChange] = useState<{
    member: IMember;
    nextRole: MemberRole;
  } | null>(null);
  const { listMembers, member: loggedMember, reloadMemberData } = useAuth();
  const { isAdmin } = usePermissions();
  const listMembersRef = useRef(listMembers);

  useEffect(() => {
    listMembersRef.current = listMembers;
  });

  async function loadMembers() {
    setLoading(true);
    try {
      const response = await listMembersRef.current();
      setMembers(response as unknown as IMember[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (visible) loadMembers();
  }, [visible]);

  const filteredMembers = useMemo(
    () =>
      filter === "all"
        ? members
        : members.filter((m) => (m.role ?? "guest") === filter),
    [members, filter],
  );

  async function applyRoleChange(member: IMember, nextRole: MemberRole) {
    setUpdating(member._id);
    try {
      await MemberServices.editMember({
        _id: member._id,
        role: nextRole,
      } as IMember);
      setMembers((prev) =>
        prev.map((m) => (m._id === member._id ? { ...m, role: nextRole } : m)),
      );
      if (member._id === loggedMember?._id) {
        await reloadMemberData();
      }
      ToastMessage.success("Nível de acesso atualizado");
    } catch (error) {
      ToastMessage.error(
        "Erro",
        getApiErrorMessage(error, "Falha ao atualizar nível de acesso."),
      );
    } finally {
      setUpdating(null);
    }
  }

  return (
    <ModalBase onClose={onClose} visible={visible} title="Níveis de acesso">
      <div className={styles.content}>
        <div className={styles.filters}>
          {ROLE_FILTERS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFilter(option.value)}
              className={[
                styles.filterItem,
                filter === option.value && styles.filterItemActive,
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <span
                className={[
                  styles.filterText,
                  filter === option.value && styles.filterTextActive,
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {option.label}
              </span>
            </button>
          ))}
        </div>

        {!isAdmin && (
          <p className={styles.noticeText}>
            Somente administradores podem alterar o nível de acesso de outro
            usuário.
          </p>
        )}

        <div className={styles.list}>
          {loading
            ? Array.from({ length: SKELETON_COUNT }).map((_, index) => (
                <RemoveMemberSkeleton key={`skeleton-${index}`} />
              ))
            : filteredMembers.map((item) => {
                const isSelf = item._id === loggedMember?._id;
                const canChangeRole = isAdmin && !isSelf;
                return (
                  <div key={item._id} className={styles.card}>
                    <div className={styles.userInfo}>
                      <Avatar photo={item.profileImage} size={40} />
                      <div className={styles.userTexts}>
                        <p className={styles.userName}>{item.firstName}</p>
                        <p className={styles.userEmail}>{item.email}</p>
                      </div>
                    </div>

                    <div className={styles.action}>
                      {updating === item._id ? (
                        <span className={styles.spinner} />
                      ) : (
                        <SelectField
                          value={item.role ?? "guest"}
                          options={ROLE_OPTIONS}
                          className={[
                            styles.selectWrapper,
                            !canChangeRole && styles.selectWrapperDisabled,
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          onSelect={(value) => {
                            if (!canChangeRole) return;
                            setPendingChange({
                              member: item,
                              nextRole: value as MemberRole,
                            });
                          }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}

          {!loading && filteredMembers.length === 0 && (
            <p className={styles.emptyText}>Nenhum membro nesse nível.</p>
          )}
        </div>
      </div>

      <Dialog
        visible={!!pendingChange}
        title="Alterar nível de acesso?"
        description={
          pendingChange
            ? `${pendingChange.member.firstName} passará a ser "${
                ROLE_OPTIONS.find((o) => o.value === pendingChange.nextRole)
                  ?.label
              }".`
            : undefined
        }
        onClose={() => setPendingChange(null)}
        actions={[
          {
            label: "cancelar",
            onPress: () => setPendingChange(null),
            variant: "secondary",
          },
          {
            label: "confirmar",
            onPress: () => {
              if (!pendingChange) return;
              const { member, nextRole } = pendingChange;
              setPendingChange(null);
              applyRoleChange(member, nextRole);
            },
            variant: "primary",
          },
        ]}
      />
    </ModalBase>
  );
}
