import { useEffect, useState } from 'react';
import { apiRequest } from '../services/api';
import Alert from './ui/Alert';
import Card from './ui/Card';
import PageHeader from './ui/PageHeader';
import Skeleton from './ui/Skeleton';

const MatchList = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await apiRequest('/api/matches');
        setMatches(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || 'No se pudieron cargar los partidos.');
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  return (
    <div>
      <PageHeader title="Partidos" subtitle="Calendario y resultados" />
      <Alert message={error} />

      <Card className="overflow-x-auto">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : matches.length === 0 ? (
          <p className="text-center text-sm text-gray-400">No hay partidos cargados.</p>
        ) : (
          <table className="w-full min-w-[700px] text-left text-sm text-gray-200">
            <thead className="border-b border-gray-700 text-xs uppercase text-gray-400">
              <tr>
                <th className="px-3 py-3">MatchID</th>
                <th className="px-3 py-3">Local</th>
                <th className="px-3 py-3">Visitante</th>
                <th className="px-3 py-3">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((match) => {
                const localTeam =
                  match.HomeTeamName ||
                  match.Local ||
                  match.HomeTeamID ||
                  match.LocalTeamID ||
                  '-';
                const visitorTeam =
                  match.AwayTeamName ||
                  match.Visitante ||
                  match.AwayTeamID ||
                  match.VisitorTeamID ||
                  '-';
                const localScore = match.HomeScore ?? match.LocalPoints ?? match.HomePoints;
                const visitorScore = match.AwayScore ?? match.VisitorPoints ?? match.AwayPoints;

                return (
                  <tr key={match.MatchID} className="border-b border-gray-800/70">
                    <td className="px-3 py-3 font-semibold text-indigo-300">{match.MatchID}</td>
                    <td className="px-3 py-3">{localTeam}</td>
                    <td className="px-3 py-3">{visitorTeam}</td>
                    <td className="px-3 py-3">
                      {localScore ?? '-'} - {visitorScore ?? '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
};

export default MatchList;
