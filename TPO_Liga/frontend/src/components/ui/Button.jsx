import styles from '../../styles/ui/Button.module.css';

export default function Button({ type = 'button', variant = 'primary', className = '', ...props }) {
  const variants = {
    primary: styles.primary,
    secondary: styles.secondary,
    ghost: styles.ghost,
    danger: styles.danger,
  };

  return (
    <button
      type={type}
      className={`${styles.btn} ${variants[variant] || variants.primary} ${className}`}
      {...props}
    />
  );
}
