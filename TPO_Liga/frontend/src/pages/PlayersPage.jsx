import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../services/api';

export default function PlayersPage() {
  const [items, setItems] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const teamNameById = useMemo(() => {
    const map = new Map();
    for (const t of teams) map.set(String(t.TeamID), t.Name);
    return map;
  }, [teams]);

  useEffect(() => {
    (async () => {
      try {
        const [playersData, teamsData] = await Promise.all([
          apiRequest('/api/players'),
          apiRequest('/api/teams'),
        ]);

        setItems(Array.isArray(playersData) ? playersData : []);
        setTeams(Array.isArray(teamsData) ? teamsData : []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="text-gray-300">Cargando jugadores...</div>;
  if (error) return <div className="text-red-300">Error: {error}</div>;

  return (
    <div className="max-w-5xl mx-auto rounded-xl border border-gray-700/60 bg-gray-800/40 p-6 shadow-2xl">
      <h2 className="text-2xl font-extrabold text-gray-100 mb-4">Jugadores</h2>

      <ul className="space-y-2">
        {items.map((p) => {
          const teamId = String(p.TeamID);
          const teamName = teamNameById.get(teamId) ?? `Equipo ${teamId}`;

          return (
            <li
              key={p.PlayerID}
              className="rounded-lg border border-gray-700/60 bg-gray-900/30 p-3 flex items-start justify-between gap-4"
            >
              <div>
                <div className="font-semibold text-gray-100">
                  {p.FirstName} {p.LastName}
                </div>

                <div className="text-sm text-gray-400">PlayerID: {p.PlayerID}</div>
                <div className="text-sm text-gray-400">
                  Equipo: <span className="text-gray-200">{teamName}</span> (TeamID: {p.TeamID})
                </div>

                {p.Category && <div className="text-sm text-gray-400">Categoría: {p.Category}</div>}
              </div>

              <div className="text-xs text-gray-400">(Después: Ver / Editar / Borrar)</div>
            </li>
          );
        })}

        {items.length === 0 && <li className="text-gray-400 italic">No hay jugadores.</li>}
      </ul>
    </div>
  );
}