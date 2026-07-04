import styles from "./DocTypeToggle.module.css";

// Portado de resgatar_app/src/components/DocTypeToggle.

interface Props {
  value: "CPF" | "CNPJ";
  onChange: (type: "CPF" | "CNPJ") => void;
}

export const DocTypeToggle = ({ value, onChange }: Props) => {
  return (
    <div className={styles.toggle}>
      {(["CPF", "CNPJ"] as const).map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => onChange(type)}
          className={[styles.item, value === type && styles.itemActive].filter(Boolean).join(" ")}
        >
          <span className={[styles.text, value === type && styles.textActive].filter(Boolean).join(" ")}>
            {type}
          </span>
        </button>
      ))}
    </div>
  );
};
