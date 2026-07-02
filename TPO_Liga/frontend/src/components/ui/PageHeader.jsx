import styles from '../../styles/ui/PageHeader.module.css';

export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className={styles.header}>
      <div className={styles.textContainer}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
