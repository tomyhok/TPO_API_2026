import './App.css';
import { Link, Routes, Route, Navigate } from 'react-router-dom';

import Standings from './components/Standings';
import LoginPage from './pages/LoginPage';
import TeamsPage from './pages/TeamsPage';
import PlayersPage from './pages/PlayersPage';
import MatchesPage from './pages/MatchesPage';

function Home() {
  const card =
    'block rounded-xl border border-gray-700/60 bg-gray-800/40 hover:bg-gray-800/80 transition p-6 shadow-lg';

  return (
    <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <Link className={card} to="/standings">
        <h2 className="text-xl font-bold text-gray-100 mb-2">Tabla / Standings</h2>
        <p className="text-sm text-gray-300">Posiciones y puntos.</p>
      </Link>

      <Link className={card} to="/matches">
        <h2 className="text-xl font-bold text-gray-100 mb-2">Partidos</h2>
        <p className="text-sm text-gray-300">Listado y gestión.</p>
      </Link>

      <Link className={card} to="/teams">
        <h2 className="text-xl font-bold text-gray-100 mb-2">Equipos</h2>
        <p className="text-sm text-gray-300">Listado y gestión.</p>
      </Link>

      <Link className={card} to="/players">
        <h2 className="text-xl font-bold text-gray-100 mb-2">Jugadores</h2>
        <p className="text-sm text-gray-300">Listado y gestión.</p>
      </Link>

      <Link className={card} to="/login">
        <h2 className="text-xl font-bold text-gray-100 mb-2">Login</h2>
        <p className="text-sm text-gray-300">Obtener token para crear/editar/borrar.</p>
      </Link>
    </section>
  );
}

export default function App() {
  const linkBase =
    'px-4 py-2 rounded-lg bg-gray-800/40 border border-gray-700/60 text-gray-200 hover:bg-gray-800/70 transition';

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <header className="max-w-6xl mx-auto mb-10">
        <h1 className="text-4xl font-extrabold text-center mt-6 mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 drop-shadow-md">
          Youth Basketball League
        </h1>

        <nav className="flex flex-wrap gap-3 justify-center">
          <Link className={linkBase} to="/">
            Inicio
          </Link>
          <Link className={linkBase} to="/standings">
            Standings
          </Link>
          <Link className={linkBase} to="/matches">
            Partidos
          </Link>
          <Link className={linkBase} to="/teams">
            Equipos
          </Link>
          <Link className={linkBase} to="/players">
            Jugadores
          </Link>
          <Link className={linkBase} to="/login">
            Login
          </Link>
        </nav>
      </header>

      <main className="max-w-6xl mx-auto">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />

          <Route path="/standings" element={<Standings />} />
          <Route path="/matches" element={<MatchesPage />} />
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/players" element={<PlayersPage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}