import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Alert from './ui/Alert';
import Button from './ui/Button';
import Card from './ui/Card';
import Input from './ui/Input';
import PageHeader from './ui/PageHeader';
import Spinner from './ui/Spinner';
import { ApiError, login, setToken } from '../services/api';

const LoginForm = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const validate = () => {
    const nextErrors = {};
    if (!username.trim()) nextErrors.username = 'El nombre de usuario es obligatorio';
    if (!password.trim()) nextErrors.password = 'La contraseña es obligatoria';
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!validate()) return;

    setLoading(true);

    try {
      const data = await login(username, password);
      const token = data?.token;

      if (!token) {
        throw new Error('La respuesta no incluyó token.');
      }

      setToken(token);
      onLoginSuccess?.();
      navigate('/', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`Login falló (${err.status}): ${err.message}`);
      } else {
        setError(err.message || 'No se pudo iniciar sesión.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center animate-fade-in relative">
      {/* Decorative blurred blobs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-500/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-amber-500/20 rounded-full blur-[80px] pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-gradient mb-2">Bienvenido</h1>
          <p className="text-zinc-400">Ingresa tus credenciales para continuar</p>
        </div>

        <Card className="!p-8 backdrop-blur-xl bg-zinc-900/60 border-zinc-700/50 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            <Alert message={error} />
            
            <Input
              label="Usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              error={fieldErrors.username}
              placeholder="admin"
            />
            
            <Input
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              error={fieldErrors.password}
              placeholder="••••••••"
            />
            
            <Button type="submit" className="w-full !py-3 !text-base mt-2" disabled={loading}>
              <span className="inline-flex items-center justify-center gap-2">
                {loading && <Spinner className="h-5 w-5" />}
                {loading ? 'Ingresando...' : 'Entrar'}
              </span>
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default LoginForm;
