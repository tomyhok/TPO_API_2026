import { NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import TeamList from './components/TeamList';
import MatchList from './components/MatchList';
import PlayerList from './components/PlayerList';
import SeasonList from './components/SeasonList';
import Standings from './components/Standings';
import LoginForm from './components/LoginForm';
import HomePage from './components/HomePage';
import Button from './components/ui/Button';
import { clearToken, getToken } from './services/api';
import { useEffect, useState } from 'react';
import { useSeason } from './contexts/SeasonContext';

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

      {/* Sidebar (Desktop) / Bottom Nav (Mobile - basic fallback) */}
      <aside className="lg:w-72 lg:h-screen lg:sticky lg:top-0 lg:flex lg:flex-col glass-panel border-r border-zinc-800/50 hidden lg:block">
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

      {/* Main Content */}
      <main className="flex-1 px-4 py-8 sm:px-8 lg:px-12 max-w-7xl mx-auto w-full">
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
      </main>

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
