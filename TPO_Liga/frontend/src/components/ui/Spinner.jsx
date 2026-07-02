import styles from '../../styles/ui/Spinner.module.css';

export default function Spinner({ className = '' }) {
  return (
    <span
      role="status"
      aria-live="polite"
      className={`${styles.spinner} ${className}`}
    />
  );
}
