export default function Card({ children, className = '' }) {
  return (
    <section className={`rounded-xl border border-gray-700/60 bg-gray-800/40 p-5 shadow-lg ${className}`}>
      {children}
    </section>
  );
}
