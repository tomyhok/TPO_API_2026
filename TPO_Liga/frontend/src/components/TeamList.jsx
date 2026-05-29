import { useEffect, useState } from 'react';
import { apiRequest } from '../services/api';
import Alert from './ui/Alert';
import Card from './ui/Card';
import PageHeader from './ui/PageHeader';
import Skeleton from './ui/Skeleton';

const TeamList = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTeams = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await apiRequest('/api/teams');
        setTeams(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || 'No se pudieron cargar los equipos.');
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  return (
    <div>
      <PageHeader title="Equipos" subtitle="Listado de equipos registrados" />
      <Alert message={error} />

      <Card className="overflow-x-auto">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : teams.length === 0 ? (
          <p className="text-center text-sm text-gray-400">No hay equipos cargados.</p>
        ) : (
          <table className="w-full min-w-[520px] text-left text-sm text-gray-200">
            <thead className="border-b border-gray-700 text-xs uppercase text-gray-400">
              <tr>
                <th className="px-3 py-3">ID</th>
                <th className="px-3 py-3">Nombre</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => (
                <tr key={team.TeamID} className="border-b border-gray-800/70">
                  <td className="px-3 py-3 font-semibold text-indigo-300">{team.TeamID}</td>
                  <td className="px-3 py-3">{team.TeamName || team.Equipo || team.Name || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
};

export default TeamList;
