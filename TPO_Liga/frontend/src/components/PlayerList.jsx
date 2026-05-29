import { useEffect, useState } from 'react';
import { apiRequest } from '../services/api';
import Alert from './ui/Alert';
import Card from './ui/Card';
import PageHeader from './ui/PageHeader';
import Skeleton from './ui/Skeleton';

const PlayerList = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPlayers = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await apiRequest('/api/players');
        setPlayers(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || 'No se pudieron cargar los jugadores.');
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  return (
    <div>
      <PageHeader title="Jugadores" subtitle="Listado general de jugadores" />
      <Alert message={error} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-28 w-full" />)
          : players.map((player) => {
              const nameParts = [player.FirstName, player.LastName].filter(Boolean);
              const displayName =
                nameParts.length > 0
                  ? nameParts.join(' ')
                  : player.PlayerName || player.Nombre || player.Name || 'Jugador';

              return (
                <Card key={player.PlayerID} className="space-y-2">
                  <p className="text-lg font-semibold text-gray-100">{displayName}</p>
                  <p className="text-sm text-gray-400">PlayerID: {player.PlayerID}</p>
                  {player.TeamID !== undefined && player.TeamID !== null && (
                    <p className="text-sm text-gray-400">TeamID: {player.TeamID}</p>
                  )}
                  {player.Category && <p className="text-sm text-gray-400">Categoría: {player.Category}</p>}
                </Card>
              );
            })}
      </div>

      {!loading && players.length === 0 && (
        <Card className="mt-4">
          <p className="text-center text-sm text-gray-400">No hay jugadores cargados.</p>
        </Card>
      )}
    </div>
  );
};

export default PlayerList;
