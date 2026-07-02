import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Alert from './ui/Alert';
import Button from './ui/Button';
import Card from './ui/Card';
import Input from './ui/Input';
import Spinner from './ui/Spinner';
import { ApiError, login, setToken } from '../services/api';
import styles from '../styles/components/LoginForm.module.css';

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
    <div className={styles.container}>
      {/* Decorative blurred blobs */}
      <div className={styles.blob1}></div>
      <div className={styles.blob2}></div>

      <div className={styles.formWrapper}>
        <div className={styles.header}>
          <h1 className={styles.title}>Bienvenido</h1>
          <p className={styles.subtitle}>Ingresa tus credenciales para continuar</p>
        </div>

        <Card className={styles.card}>
          <form onSubmit={handleLogin} className={styles.form}>
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
            
            <Button type="submit" className={styles.submitBtn} disabled={loading}>
              <span className={styles.btnContent}>
                {loading && <Spinner className={styles.spinner} />}
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
