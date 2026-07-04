import { ComponentType } from "react";
import styles from "./IconButton.module.css";

// Portado de resgatar_app/src/components/IconButton.

interface IIconButton {
  onPress: () => void;
  size?: number;
  icon: ComponentType<{ size?: number; color?: string }>;
  color: string;
}

export const IconButton = ({ onPress, size = 22, icon: Icon, color }: IIconButton) => {
  return (
    <button type="button" onClick={onPress} className={styles.iconButton}>
      <Icon size={size} color={color} />
    </button>
  );
};
