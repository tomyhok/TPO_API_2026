import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest, setToken } from '../services/api';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: { Username: username, Password: password },
      });

      const token = data?.token;
      if (!token) throw new Error('No llegó "token" desde /api/auth/login');

      setToken(token);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Error de login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto rounded-xl border border-gray-700/60 bg-gray-800/40 p-6 shadow-2xl">
      <h2 className="text-2xl font-extrabold text-gray-100 mb-4">Iniciar sesión</h2>

      {error && (
        <div className="mb-4 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1">Username</label>
          <input
            className="w-full rounded-lg bg-gray-900/40 border border-gray-700 px-3 py-2"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">Password</label>
          <input
            type="password"
            className="w-full rounded-lg bg-gray-900/40 border border-gray-700 px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-indigo-500/25 border border-indigo-400/40 text-indigo-100 font-semibold py-2 hover:bg-indigo-500/35 transition disabled:opacity-60"
        >
          {loading ? 'Ingresando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}