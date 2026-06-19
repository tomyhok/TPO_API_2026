import { useEffect, useState } from 'react';
import { apiRequest, getToken } from '../services/api';
import { useSeason } from '../contexts/SeasonContext';
import Alert from './ui/Alert';
import Card from './ui/Card';
import PageHeader from './ui/PageHeader';
import Skeleton from './ui/Skeleton';
import Button from './ui/Button';
import Input from './ui/Input';
import Modal from './ui/Modal';

const PlayerList = () => {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isAdmin = !!getToken();
  const { selectedSeasonId } = useSeason();
  
  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [formData, setFormData] = useState({ FirstName: '', LastName: '', JerseyNumber: '', Position: '', TeamID: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!selectedSeasonId) return;

    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [playersData, teamsData] = await Promise.all([
          apiRequest(`/api/players?seasonId=${selectedSeasonId}`),
          apiRequest(`/api/teams?seasonId=${selectedSeasonId}`)
        ]);
        setPlayers(Array.isArray(playersData) ? playersData : []);
        setTeams(Array.isArray(teamsData) ? teamsData : []);
      } catch (err) {
        setError(err.message || 'No se pudieron cargar los datos.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedSeasonId]);

  const openModal = (player = null) => {
    if (player) {
      setEditingPlayer(player);
      setFormData({ 
        FirstName: player.FirstName || '', 
        LastName: player.LastName || '', 
        JerseyNumber: player.JerseyNumber || '', 
        Position: player.Position || '', 
        TeamID: player.TeamID || '' 
      });
    } else {
      setEditingPlayer(null);
      setFormData({ FirstName: '', LastName: '', JerseyNumber: '', Position: '', TeamID: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingPlayer) {
        const res = await apiRequest(`/api/players/${editingPlayer.PlayerID}`, {
          method: 'PUT',
          body: formData,
          auth: true
        });
        setPlayers(players.map(p => p.PlayerID === editingPlayer.PlayerID ? { ...p, ...res } : p));
      } else {
        const res = await apiRequest('/api/players', {
          method: 'POST',
          body: { ...formData, seasonId: selectedSeasonId },
          auth: true
        });
        setPlayers([...players, res]);
      }
      setIsModalOpen(false);
    } catch (err) {
      setError(err.message || 'Error al guardar el jugador.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este jugador?')) return;
    try {
      await apiRequest(`/api/players/${id}`, { method: 'DELETE', auth: true });
      setPlayers(players.filter(p => p.PlayerID !== id));
    } catch (err) {
      setError(err.message || 'Error al eliminar el jugador.');
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Jugadores" 
        subtitle="Listado general de jugadores registrados" 
        action={isAdmin && <Button onClick={() => openModal()}>+ Nuevo Jugador</Button>}
      />
      <Alert message={error} />

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="h-32 flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </Card>
          ))}
        </div>
      ) : players.length === 0 ? (
        <Card className="mt-4 text-center py-12">
           <div className="text-4xl mb-4 opacity-50">⛹️‍♂️</div>
          <p className="text-lg text-zinc-400">No hay jugadores cargados.</p>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {players.map((player) => {
            const nameParts = [player.FirstName, player.LastName].filter(Boolean);
            const displayName =
              nameParts.length > 0
                ? nameParts.join(' ')
                : player.PlayerName || player.Nombre || player.Name || 'Jugador';

            return (
              <Card key={player.PlayerID} className="group hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden">
                {/* Subtle background glow based on category if available */}
                {player.Category && (
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-colors"></div>
                )}
                
                {isAdmin && (
                  <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <button onClick={() => openModal(player)} className="p-1 rounded bg-zinc-800/80 text-orange-400 hover:bg-zinc-700 hover:text-orange-300 transition-colors backdrop-blur-sm border border-zinc-700/50 text-sm">
                      ✏️
                    </button>
                    <button onClick={() => handleDelete(player.PlayerID)} className="p-1 rounded bg-zinc-800/80 text-red-500 hover:bg-zinc-700 hover:text-red-400 transition-colors backdrop-blur-sm border border-zinc-700/50 text-sm">
                      🗑️
                    </button>
                  </div>
                )}
                
                <div className="flex items-center gap-4 relative z-10">
                  <div className="flex-shrink-0 w-14 h-14 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-800 border border-zinc-600 flex items-center justify-center text-2xl shadow-inner overflow-hidden">
                    🧑‍🚀
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-bold text-zinc-100 truncate group-hover:text-orange-300 transition-colors">
                      {displayName}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center rounded-md bg-zinc-800/80 px-2 py-0.5 text-xs font-medium text-zinc-400 border border-zinc-700">
                        ID: {player.PlayerID}
                      </span>
                      {player.TeamID !== undefined && player.TeamID !== null && (
                        <span className="inline-flex items-center rounded-md bg-orange-500/10 px-2 py-0.5 text-xs font-medium text-orange-400 border border-orange-500/20">
                          Equipo {player.TeamID}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {player.Category && (
                  <div className="mt-4 pt-4 border-t border-zinc-700/50 flex justify-between items-center relative z-10">
                    <span className="text-xs font-medium text-zinc-500 uppercase">Categoría</span>
                    <span className="text-sm font-semibold text-zinc-200">{player.Category}</span>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingPlayer ? 'Editar Jugador' : 'Nuevo Jugador'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input 
            label="Nombre" 
            value={formData.FirstName} 
            onChange={e => setFormData({...formData, FirstName: e.target.value})} 
            required 
          />
          <Input 
            label="Apellido" 
            value={formData.LastName} 
            onChange={e => setFormData({...formData, LastName: e.target.value})} 
            required 
          />
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Dorsal" 
              type="number"
              value={formData.JerseyNumber} 
              onChange={e => setFormData({...formData, JerseyNumber: e.target.value})} 
            />
            <Input 
              label="Posición" 
              value={formData.Position} 
              onChange={e => setFormData({...formData, Position: e.target.value})} 
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-zinc-300">Equipo</label>
            <select 
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900/50 px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
              value={formData.TeamID}
              onChange={e => setFormData({...formData, TeamID: e.target.value})}
              required
            >
              <option value="">Seleccione un equipo...</option>
              {teams.map(t => (
                <option key={t.TeamID} value={t.TeamID}>{t.TeamName || t.Name || t.Equipo}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PlayerList;
