import { NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import TeamList from './components/TeamList';
import MatchList from './components/MatchList';
import PlayerList from './components/PlayerList';
import Standings from './components/Standings';
import LoginForm from './components/LoginForm';
import Card from './components/ui/Card';
import PageHeader from './components/ui/PageHeader';
import Button from './components/ui/Button';
import Alert from './components/ui/Alert';
import Skeleton from './components/ui/Skeleton';
import { apiRequest, clearToken, getToken } from './services/api';
import { useEffect, useState } from 'react';

const navItems = [
  { to: '/', label: 'Inicio' },
  { to: '/standings', label: 'Standings' },
  { to: '/matches', label: 'Partidos' },
  { to: '/teams', label: 'Equipos' },
  { to: '/players', label: 'Jugadores' },
  { to: '/login', label: 'Login' },
];

function HomePage() {
  const [counts, setCounts] = useState({ teams: 0, players: 0, matches: 0, standings: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadCounts = async () => {
      setLoading(true);
      setError('');
      try {
        const [teams, players, matches, standings] = await Promise.all([
          apiRequest('/api/teams'),
          apiRequest('/api/players'),
          apiRequest('/api/matches'),
          apiRequest('/api/standings'),
        ]);

        setCounts({
          teams: Array.isArray(teams) ? teams.length : 0,
          players: Array.isArray(players) ? players.length : 0,
          matches: Array.isArray(matches) ? matches.length : 0,
          standings: Array.isArray(standings) ? standings.length : 0,
        });
      } catch (err) {
        setError(err.message || 'No se pudo cargar el dashboard.');
      } finally {
        setLoading(false);
      }
    };

    loadCounts();
  }, []);

  const cards = [
    { title: 'Equipos', value: counts.teams, to: '/teams' },
    { title: 'Jugadores', value: counts.players, to: '/players' },
    { title: 'Partidos', value: counts.matches, to: '/matches' },
    { title: 'Tabla', value: counts.standings, to: '/standings' },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Resumen rápido y accesos directos" />
      {error && <Alert message={error} />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title} className="space-y-2">
            <p className="text-sm text-gray-400">{card.title}</p>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold text-gray-100">{card.value}</p>
            )}
            <NavLink className="text-sm font-semibold text-indigo-300 hover:text-indigo-200" to={card.to}>
              Ver sección →
            </NavLink>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Layout() {
  const navigate = useNavigate();
  const [token, setToken] = useState(() => getToken());

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
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <header className="border-b border-gray-700/50 bg-gray-950/60 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
            Youth Basketball League Admin
          </h1>
          {token && (
            <Button variant="ghost" onClick={onLogout}>
              Cerrar sesión
            </Button>
          )}
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row">
        <aside className="w-full lg:w-60">
          <nav className="flex flex-wrap gap-2 lg:flex-col">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? 'border-indigo-400/50 bg-indigo-500/25 text-indigo-100'
                      : 'border-gray-700 bg-gray-800/50 text-gray-300 hover:bg-gray-700/60'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/standings" element={<Standings />} />
            <Route path="/matches" element={<MatchList />} />
            <Route path="/teams" element={<TeamList />} />
            <Route path="/players" element={<PlayerList />} />
            <Route path="/login" element={<LoginForm onLoginSuccess={() => setToken(getToken())} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return <Layout />;
}
