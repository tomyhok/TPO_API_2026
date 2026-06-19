export default function Card({ children, className = '', ...props }) {
  return (
    <div className={`glass-card rounded-2xl p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}
