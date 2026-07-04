import { Avatar } from "@/components/Avatar";
import { CoachTarget } from "@/components/CoachTarget";
import { IMember } from "@/types/Member";
import { maskCPFOrCNPJ } from "@/utils/mask";
import styles from "./ProfileHeaderCard.module.css";

// Portado de resgatar_app/src/components/ProfileHeaderCard.

interface Props {
  member: IMember;
  onPressAvatar?: () => void;
}

export function ProfileHeaderCard({ member, onPressAvatar }: Props) {
  return (
    <div className={styles.card}>
      <CoachTarget id="profile-photo" className={styles.avatarWrapper}>
        <Avatar photo={member.profileImage} size={56} onPress={onPressAvatar} editable={!!onPressAvatar} />
      </CoachTarget>

      <div className={styles.info}>
        <p className={styles.name}>
          {member.firstName} {member.lastName}
        </p>
        <p className={styles.document}>
          {maskCPFOrCNPJ(member.identification.numberType, member.identification.type)}
        </p>
        <p className={styles.document}>{member.email}</p>
      </div>
    </div>
  );
}
