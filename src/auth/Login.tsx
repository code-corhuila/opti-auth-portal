import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import type { PublicShellContext } from '../shell-contract';
import { authApi } from './api/authApi';
import { validateLogin } from './model/validation';

/**
 * Sign-in. Mounted by opti-front at /login, before there is a session: it only receives the public
 * part of the shell (the client and the UI kit), never the token.
 */
export default function Login({ shell, onSignedIn }: { shell: PublicShellContext; onSignedIn?: () => void }): ReactNode {
  const { ui } = shell;
  const api = useMemo(() => authApi(shell.api), [shell.api]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const clientErrors = validateLogin({ username, password });
  const errors = attempted ? clientErrors : {};

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setAttempted(true);
    setFailure(null);
    if (pending || Object.keys(clientErrors).length > 0) {
      return;
    }
    setPending(true);
    try {
      const response = await api.login(username, password);
      shell.signIn(response.accessToken, {
        id: response.user.id,
        username: response.user.username,
        fullName: response.user.fullName,
        role: response.user.role,
      });
      shell.notify(`Bienvenido, ${response.user.fullName.split(' ')[0]}`, 'success');
      onSignedIn?.();
    } catch (error) {
      const info = (error as { info?: { userMessage: string } }).info;
      setFailure(info?.userMessage ?? 'Usuario o contraseña incorrectos.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="login-card">
      <h1>OptiView</h1>
      <p className="subtitle">Ingresa con tu usuario y contraseña.</p>
      <form onSubmit={(event) => void onSubmit(event)} noValidate>
        {failure ? <ui.Banner kind="error">{failure}</ui.Banner> : null}
        <ui.TextField id="username" label="Usuario" required value={username} onChange={setUsername}
          error={errors.username} autoComplete="username" maxLength={40} />
        <ui.TextField id="password" label="Contraseña" required type="password" value={password} onChange={setPassword}
          error={errors.password} autoComplete="current-password" />
        <div className="actions">
          <button type="submit" className="btn" disabled={pending}>
            {pending ? 'Ingresando…' : 'Ingresar'}
          </button>
        </div>
      </form>
    </div>
  );
}
