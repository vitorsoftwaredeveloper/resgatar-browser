import styles from "./Switch.module.css";

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
}

export const Switch = ({ checked, onChange, disabled = false, label }: Props) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={[styles.track, checked && styles.trackOn].filter(Boolean).join(" ")}
    >
      <span className={[styles.thumb, checked && styles.thumbOn].filter(Boolean).join(" ")} />
    </button>
  );
};
