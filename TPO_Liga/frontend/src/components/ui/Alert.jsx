import styles from '../../styles/ui/Alert.module.css';

export default function Alert({ message, tone = 'error' }) {
  const tones = {
    error: styles.error,
    info: styles.info,
    success: styles.success,
  };

  if (!message) return null;

  return <div className={`${styles.container} ${tones[tone]}`}>{message}</div>;
}
