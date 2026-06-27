import { useEffect, useState } from 'react';
import { apiRequest, getToken } from '../services/api';
import { useSeason } from '../contexts/SeasonContext';
import { useCategories } from '../contexts/CategoryContext';
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
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [filterTeamId, setFilterTeamId] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 18;
  const isAdmin = !!getToken();
  const { selectedSeasonId, loading: seasonLoading } = useSeason();
  const { categories, categoriesLoading } = useCategories();
  
  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [formData, setFormData] = useState({ FirstName: '', LastName: '', JerseyNumber: '', Position: '', TeamID: '', CategoryID: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!selectedSeasonId) {
      if (!seasonLoading) setLoading(false);
      return;
    }

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
  }, [selectedSeasonId, seasonLoading]);

  useEffect(() => {
    if (!activeCategoryId && categories.length > 0) {
      setActiveCategoryId(categories[0].CategoryID);
    }
  }, [categories, activeCategoryId]);

  const openModal = (player = null) => {
    if (player) {
      setEditingPlayer(player);
      setFormData({ 
        FirstName: player.FirstName || '', 
        LastName: player.LastName || '', 
        JerseyNumber: player.JerseyNumber || '', 
        Position: player.Position || '', 
        TeamID: player.TeamID || '',
        CategoryID: player.CategoryID || activeCategoryId || ''
      });
    } else {
      setEditingPlayer(null);
      setFormData({ FirstName: '', LastName: '', JerseyNumber: '', Position: '', TeamID: '', CategoryID: activeCategoryId || '' });
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

      {/* Category Tabs & Filters */}
      {!categoriesLoading && categories.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
          <div className="flex border-b border-stone-200/80 overflow-x-auto no-scrollbar w-full sm:w-auto">
            {categories.map(cat => (
              <button
                key={cat.CategoryID}
                onClick={() => {
                  setActiveCategoryId(cat.CategoryID);
                  setFilterTeamId('');
                  setCurrentPage(1);
                }}
                className={`px-6 py-4 font-semibold text-sm whitespace-nowrap transition-all border-b-2 ${
                  activeCategoryId === cat.CategoryID 
                    ? 'border-orange-500 text-orange-400 bg-orange-500/5' 
                    : 'border-transparent text-stone-600 hover:text-stone-800 hover:bg-stone-200/30'
                }`}
              >
                {cat.Name}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-auto">
            <select 
              className="w-full sm:w-64 rounded-xl border border-stone-300 bg-stone-100/50 px-4 py-2.5 text-sm text-stone-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 shadow-sm"
              value={filterTeamId}
              onChange={(e) => { setFilterTeamId(e.target.value); setCurrentPage(1); }}
            >
              <option value="">Todos los equipos</option>
              {teams.map(t => (
                <option key={t.TeamID} value={t.TeamID}>{t.TeamName || t.Name || t.Equipo}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {loading || categoriesLoading ? (
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
      ) : (() => {
        const filteredPlayers = players.filter(p => 
          p.CategoryID === activeCategoryId && 
          (filterTeamId === '' || String(p.TeamID) === String(filterTeamId))
        );

        if (filteredPlayers.length === 0) {
          return (
            <Card className="mt-4 text-center py-12">
               <div className="text-4xl mb-4 opacity-50">⛹️‍♂️</div>
              <p className="text-lg text-stone-600">
                {filterTeamId ? 'No hay jugadores en este equipo para la categoría seleccionada.' : 'No hay jugadores cargados en esta categoría.'}
              </p>
            </Card>
          );
        }

        const totalPages = Math.ceil(filteredPlayers.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const paginatedPlayers = filteredPlayers.slice(startIndex, startIndex + itemsPerPage);

        return (
          <div className="space-y-8">
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {paginatedPlayers.map((player) => {
              const nameParts = [player.FirstName, player.LastName].filter(Boolean);
              const displayName =
                nameParts.length > 0
                  ? nameParts.join(' ')
                  : player.PlayerName || player.Nombre || player.Name || 'Jugador';
  
              const teamName = player.TeamID ? (teams.find(t => String(t.TeamID) === String(player.TeamID))?.TeamName || teams.find(t => String(t.TeamID) === String(player.TeamID))?.Name || teams.find(t => String(t.TeamID) === String(player.TeamID))?.Equipo || `Equipo ${player.TeamID}`) : null;

              return (
                <Card key={player.PlayerID} className="group hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden">
                  {/* Subtle background glow based on category if available */}
                  {player.CategoryName && (
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-colors"></div>
                  )}
                  
                  {isAdmin && (
                    <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                      <button onClick={() => openModal(player)} className="p-1 rounded bg-stone-200/80 text-orange-400 hover:bg-stone-300 hover:text-orange-300 transition-colors backdrop-blur-sm border border-stone-300/50 text-sm">
                        ✏️
                      </button>
                      <button onClick={() => handleDelete(player.PlayerID)} className="p-1 rounded bg-stone-200/80 text-red-500 hover:bg-stone-300 hover:text-red-400 transition-colors backdrop-blur-sm border border-stone-300/50 text-sm">
                        🗑️
                      </button>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 w-full relative z-10">
                    <div className="flex-shrink-0 w-14 h-14 rounded-full bg-gradient-to-tr from-stone-300 to-stone-400 border border-stone-400 flex items-center justify-center text-2xl shadow-inner overflow-hidden">
                      🧑‍🚀
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-lg font-bold text-stone-900 truncate group-hover:text-orange-300 transition-colors">
                        {displayName}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {player.JerseyNumber && (
                          <span className="inline-flex items-center rounded-md bg-stone-200/80 px-2 py-0.5 text-xs font-medium text-stone-600 border border-stone-300">
                            #{player.JerseyNumber}
                          </span>
                        )}
                        {teamName && (
                          <span className="inline-flex items-center rounded-md bg-orange-500/10 px-2 py-0.5 text-xs font-medium text-orange-500 border border-orange-500/20 truncate max-w-[120px]" title={teamName}>
                            {teamName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
            </div>
            
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8 bg-stone-100/50 py-3 px-6 rounded-2xl w-fit mx-auto border border-stone-200 shadow-sm">
                <Button 
                  variant="ghost" 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                  disabled={currentPage === 1}
                  className="bg-white hover:bg-stone-50 border border-stone-200 shadow-sm"
                >
                  ← Anterior
                </Button>
                <div className="flex flex-col items-center px-4">
                  <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">Página</span>
                  <span className="font-black text-stone-800 text-lg leading-tight">{currentPage} de {totalPages}</span>
                </div>
                <Button 
                  variant="ghost" 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                  disabled={currentPage === totalPages}
                  className="bg-white hover:bg-stone-50 border border-stone-200 shadow-sm"
                >
                  Siguiente →
                </Button>
              </div>
            )}
          </div>
        );
      })()}

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
            <label className="text-sm font-semibold text-stone-700">Equipo</label>
            <select 
              className="w-full rounded-xl border border-stone-300 bg-stone-100/50 px-4 py-3 text-stone-900 placeholder:text-stone-500 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
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
          <div className="space-y-1">
            <label className="text-sm font-semibold text-stone-700">Categoría</label>
            <select 
              className="w-full rounded-xl border border-stone-300 bg-stone-100/50 px-4 py-3 text-stone-900 placeholder:text-stone-500 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
              value={formData.CategoryID}
              onChange={e => setFormData({...formData, CategoryID: e.target.value})}
              required
            >
              <option value="">Seleccione una categoría...</option>
              {categories.map(c => (
                <option key={c.CategoryID} value={c.CategoryID}>{c.Name}</option>
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
