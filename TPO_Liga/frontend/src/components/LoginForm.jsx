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
    if (!username.trim()) nextErrors.username = 'El username es obligatorio';
    if (!password.trim()) nextErrors.password = 'La password es obligatoria';
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
    <div className="mx-auto max-w-lg">
      <PageHeader title="Iniciar sesión" subtitle="Autenticarse para operaciones protegidas" />
      <Card>
        <form onSubmit={handleLogin} className="space-y-4">
          <Alert message={error} />
          <Input
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            error={fieldErrors.username}
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            error={fieldErrors.password}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            <span className="inline-flex items-center gap-2">
              {loading && <Spinner className="h-4 w-4" />}
              {loading ? 'Ingresando...' : 'Entrar'}
            </span>
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default LoginForm;
