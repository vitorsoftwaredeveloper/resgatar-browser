import { RemoveMemberSkeleton } from "@/components/Skeleton/RemoveMemberSkeleton";
import { SettingsMemberCard } from "@/components/SettingsMemberCard";
import { IMember } from "@/types/Member";
import { ReactElement } from "react";
import styles from "./MemberListWithSkeleton.module.css";

// Portado de resgatar_app/src/components/Skeleton/MemberListWithSkeleton.

interface Props {
  members: IMember[];
  loading: boolean;
  onAction: (member: IMember) => void;
  iconAction: ReactElement;
  variant: "delete" | "edit";
  loadingMemberId?: string;
}

const SKELETON_COUNT = 4;

export function MemberListWithSkeleton({ members, loading, onAction, iconAction, variant, loadingMemberId }: Props) {
  return (
    <div className={styles.list}>
      {loading
        ? Array.from({ length: SKELETON_COUNT }).map((_, index) => <RemoveMemberSkeleton key={`skeleton-${index}`} />)
        : members.map((item) => (
            <SettingsMemberCard
              key={item._id}
              member={item}
              onAction={onAction}
              iconAction={iconAction}
              variant={variant}
              loading={loadingMemberId === item._id}
            />
          ))}
    </div>
  );
}
