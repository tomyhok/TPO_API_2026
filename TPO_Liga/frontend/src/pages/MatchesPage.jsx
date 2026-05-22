import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../services/api';

function formatDate(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString();
}

function formatTime(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function MatchesPage() {
  const [items, setItems] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mapa TeamID -> Name para poder mostrar nombres en vez de IDs
  const teamNameById = useMemo(() => {
    const map = new Map();
    for (const t of teams) map.set(String(t.TeamID), t.Name);
    return map;
  }, [teams]);

  useEffect(() => {
    (async () => {
      try {
        const [matchesData, teamsData] = await Promise.all([
          apiRequest('/api/matches'),
          apiRequest('/api/teams'),
        ]);

        setItems(Array.isArray(matchesData) ? matchesData : []);
        setTeams(Array.isArray(teamsData) ? teamsData : []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="text-gray-300">Cargando partidos...</div>;
  if (error) return <div className="text-red-300">Error: {error}</div>;

  return (
    <div className="max-w-5xl mx-auto rounded-xl border border-gray-700/60 bg-gray-800/40 p-6 shadow-2xl">
      <h2 className="text-2xl font-extrabold text-gray-100 mb-4">Partidos</h2>

      <ul className="space-y-2">
        {items.map((m) => {
          const localId = String(m.LocalTeamID);
          const visitorId = String(m.VisitorTeamID);

          const localName = teamNameById.get(localId) ?? `Equipo ${localId}`;
          const visitorName = teamNameById.get(visitorId) ?? `Equipo ${visitorId}`;

          return (
            <li key={m.MatchID} className="rounded-lg border border-gray-700/60 bg-gray-900/30 p-3">
              <div className="font-semibold text-gray-100">
                {localName} vs {visitorName}
              </div>

              <div className="text-sm text-gray-400">MatchID: {m.MatchID}</div>

              <div className="text-sm text-gray-400 mt-1">
                {formatDate(m.MatchDate)} — {formatTime(m.MatchTime)} — {m.Location || '-'}
              </div>

              <div className="text-sm text-gray-200 mt-1">
                Resultado: {m.LocalPoints ?? '-'} - {m.VisitorPoints ?? '-'}
              </div>
            </li>
          );
        })}

        {items.length === 0 && <li className="text-gray-400 italic">No hay partidos.</li>}
      </ul>
    </div>
  );
}