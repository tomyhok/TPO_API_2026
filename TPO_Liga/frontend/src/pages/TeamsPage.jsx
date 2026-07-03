import { useEffect, useState } from 'react';
import { apiRequest } from '../services/api';

export default function TeamsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiRequest('/api/teams');
        setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="text-gray-300">Cargando equipos...</div>;
  if (error) return <div className="text-red-300">Error: {error}</div>;

  return (
    <div className="max-w-5xl mx-auto rounded-xl border border-gray-700/60 bg-gray-800/40 p-6 shadow-2xl">
      <h2 className="text-2xl font-extrabold text-gray-100 mb-4">Equipos</h2>

      <ul className="space-y-2">
        {items.map((t) => (
          <li
            key={t.TeamID}
            className="rounded-lg border border-gray-700/60 bg-gray-900/30 p-3 flex items-start justify-between gap-4"
          >
            <div>
              <div className="font-semibold text-gray-100">{t.Name}</div>
              <div className="text-sm text-gray-400">TeamID: {t.TeamID}</div>

              {t.Coach && (
                <div className="text-sm text-gray-400">
                  Coach: <span className="text-gray-200">{t.Coach}</span>
                </div>
              )}
            </div>

            <div className="text-xs text-gray-400">(Después: Ver / Editar / Borrar)</div>
          </li>
        ))}

        {items.length === 0 && <li className="text-gray-400 italic">No hay equipos.</li>}
      </ul>
    </div>
  );
}