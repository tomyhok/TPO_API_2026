import { NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import TeamList from './components/TeamList';
import MatchList from './components/MatchList';
import PlayerList from './components/PlayerList';
import SeasonList from './components/SeasonList';
import Standings from './components/Standings';
import StandingsWidget from './components/widgets/StandingsWidget';
import LoginForm from './components/LoginForm';
import HomePage from './components/HomePage';
import Button from './components/ui/Button';
import { clearToken, getToken } from './services/api';
import { useEffect, useState } from 'react';
import { useSeason } from './contexts/SeasonContext';
import { useRightPanel } from './contexts/RightPanelContext';

const navItems = [
  { to: '/', label: 'Inicio' },
  { to: '/standings', label: 'Posiciones' },
  { to: '/matches', label: 'Partidos' },
  { to: '/teams', label: 'Equipos' },
  { to: '/players', label: 'Jugadores' },
  { to: '/seasons', label: 'Temporadas', adminOnly: true },
  { to: '/login', label: 'Login', guestOnly: true },
];

function Layout() {
  const navigate = useNavigate();
  const [token, setToken] = useState(() => getToken());
  const { seasons, selectedSeasonId, setSelectedSeasonId, loading: seasonLoading } = useSeason();
  const { panelContent, isOpen, closePanel } = useRightPanel();

  useEffect(() => {
    const syncAuth = () => setToken(getToken());
    window.addEventListener('storage', syncAuth);
    return () => window.removeEventListener('storage', syncAuth);
  }, []);

  const onLogout = () => {
    clearToken();
    setToken(null);
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col lg:flex-row font-sans selection:bg-orange-500/30">
      
      {/* Mobile Header */}
      <header className="lg:hidden glass-panel sticky top-0 z-50 flex flex-col gap-2 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight text-gradient">{token ? 'YBL Admin' : 'YBL'}</h1>
          {token && (
            <Button variant="ghost" onClick={onLogout} className="!px-3 !py-1 text-xs">
              Salir
            </Button>
          )}
        </div>
        {/* Mobile Season Selector */}
        {!seasonLoading && seasons.length > 0 && (
          <select 
            className="w-full bg-zinc-900/50 border border-zinc-700/50 text-zinc-300 text-xs rounded-lg px-2 py-1.5 focus:border-orange-500/50 appearance-none text-center"
            value={selectedSeasonId || ''}
            onChange={(e) => setSelectedSeasonId(Number(e.target.value))}
          >
            {seasons.map(s => (
              <option key={s.SeasonID} value={s.SeasonID}>
                {s.Name} {s.IsActive ? '⭐' : ''}
              </option>
            ))}
          </select>
        )}
      </header>

      {/* Sidebar (Desktop) */}
      <aside className="lg:w-64 lg:h-screen lg:sticky lg:top-0 lg:flex lg:flex-col glass-panel border-r border-zinc-800/50 hidden lg:block flex-shrink-0">
        <div className="p-8 pb-4">
          <h1 className="text-2xl font-bold tracking-tight text-gradient leading-tight">
            Youth Basketball<br />League
          </h1>
        </div>
        
        {/* Desktop Season Selector */}
        <div className="px-6 mb-6">
          {seasonLoading ? (
            <div className="h-10 bg-zinc-800/50 animate-pulse rounded-xl"></div>
          ) : seasons.length > 0 ? (
            <div className="relative">
              <select 
                className="w-full bg-zinc-900/80 border border-zinc-700/50 text-zinc-300 text-sm font-semibold rounded-xl pl-4 pr-10 py-2.5 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-colors cursor-pointer appearance-none shadow-inner"
                value={selectedSeasonId || ''}
                onChange={(e) => setSelectedSeasonId(Number(e.target.value))}
              >
                {seasons.map(s => (
                  <option key={s.SeasonID} value={s.SeasonID}>
                    {s.Name} {s.IsActive ? '(Actual)' : ''}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs opacity-50 pointer-events-none">▼</div>
            </div>
          ) : null}
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => {
            if (item.guestOnly && token) return null;
            if (item.adminOnly && !token) return null;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/10 text-orange-300 border border-orange-500/20 shadow-lg shadow-orange-500/5'
                      : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                  }`
                }
              >
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {token && (
          <div className="p-4 mt-auto">
            <Button variant="secondary" onClick={onLogout} className="w-full justify-center">
              Cerrar sesión
            </Button>
          </div>
        )}
      </aside>

      {/* Main Content (Center) */}
      <main className="flex-1 flex justify-center w-full min-w-0">
        <div className="w-full max-w-5xl px-4 py-8 sm:px-8 xl:px-12">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/standings" element={<Standings />} />
            <Route path="/matches" element={<MatchList />} />
            <Route path="/teams" element={<TeamList />} />
            <Route path="/players" element={<PlayerList />} />
            <Route path="/seasons" element={<SeasonList />} />
            <Route path="/login" element={<LoginForm onLoginSuccess={() => setToken(getToken())} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>

      {/* Right Panel (Desktop) */}
      <aside className="hidden xl:flex xl:w-80 2xl:w-96 border-l border-zinc-800/50 bg-zinc-950/50 h-screen sticky top-0 flex-col overflow-y-auto flex-shrink-0">
        <div className="p-6 h-full">
          {panelContent ? panelContent : <StandingsWidget />}
        </div>
      </aside>

      {/* Right Panel (Mobile Overlay) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end xl:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closePanel}></div>
          <div className="relative w-full max-w-md bg-zinc-950 border-l border-zinc-800 h-full overflow-y-auto animate-slide-in-right shadow-2xl">
            <div className="sticky top-0 bg-zinc-900/90 backdrop-blur border-b border-zinc-800 p-4 flex justify-between items-center z-10">
              <h3 className="font-bold text-zinc-100">Detalles</h3>
              <Button variant="ghost" onClick={closePanel} className="!p-2 text-zinc-400 hover:text-white">✕</Button>
            </div>
            <div className="p-4">
              {panelContent}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden glass-panel fixed bottom-0 left-0 right-0 z-50 flex justify-around p-3 pb-safe">
        {navItems.map((item) => {
           if (item.guestOnly && token) return null;
           if (item.adminOnly && !token) return null;
           return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                  isActive ? 'text-orange-400' : 'text-zinc-500 hover:text-zinc-300'
                }`
              }
            >
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
           );
        })}
      </nav>
      {/* Padding for mobile bottom nav */}
      <div className="h-20 lg:hidden"></div>
    </div>
  );
}

export default function App() {
  return <Layout />;
}
