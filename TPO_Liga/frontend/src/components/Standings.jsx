import { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import Alert from './ui/Alert';
import Card from './ui/Card';
import PageHeader from './ui/PageHeader';
import Skeleton from './ui/Skeleton';

const Standings = () => {
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStandings = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await apiRequest('/api/standings');
        setStandings(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || 'No se pudo cargar la tabla.');
      } finally {
        setLoading(false);
      }
    };

    fetchStandings();
  }, []);

  return (
    <div>
      <PageHeader title="Standings" subtitle="Posiciones y rendimiento de equipos" />
      <Alert message={error} />

      <Card className="overflow-x-auto">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : standings.length === 0 ? (
          <p className="text-center text-sm text-gray-400">No hay datos de posiciones.</p>
        ) : (
          <table className="w-full min-w-[860px] text-left text-sm text-gray-200">
            <thead className="border-b border-gray-700 text-xs uppercase text-gray-400">
              <tr>
                <th className="px-3 py-3">#</th>
                <th className="px-3 py-3">Equipo</th>
                <th className="px-3 py-3">Puntos</th>
                <th className="px-3 py-3">PJ</th>
                <th className="px-3 py-3">PG</th>
                <th className="px-3 py-3">PP</th>
                <th className="px-3 py-3">Dif.</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((team, index) => (
                <tr key={team.TeamID || index} className="border-b border-gray-800/70">
                  <td className="px-3 py-3 font-semibold text-indigo-300">{index + 1}</td>
                  <td className="px-3 py-3">{team.Equipo || team.TeamName || '-'}</td>
                  <td className="px-3 py-3">{team.Puntos ?? '-'}</td>
                  <td className="px-3 py-3">{team.PartidosJugados ?? '-'}</td>
                  <td className="px-3 py-3">{team.PartidosGanados ?? '-'}</td>
                  <td className="px-3 py-3">{team.PartidosPerdidos ?? '-'}</td>
                  <td className="px-3 py-3">{team.DiferenciaDeTantos ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
};

export default Standings;
