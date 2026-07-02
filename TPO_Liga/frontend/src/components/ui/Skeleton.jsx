import styles from '../../styles/ui/Skeleton.module.css';

export default function Skeleton({ className = '' }) {
  return <div className={`${styles.skeleton} ${className}`} />;
}
