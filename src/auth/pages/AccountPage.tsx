import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import type { LoadState, ShellContext } from '../../shell-contract';
import { authApi } from '../api/authApi';
import { ROLE_LABEL, type User } from '../model/user';
import { validatePasswordChange, type PasswordChangeDraft } from '../model/validation';

const EMPTY: PasswordChangeDraft = { currentPassword: '', newPassword: '', confirmation: '' };

type Tab = 'profile' | 'security' | 'preferences';

const TABS: { id: Tab; label: string }[] = [
  { id: 'profile', label: 'Perfil' },
  { id: 'security', label: 'Seguridad' },
  { id: 'preferences', label: 'Preferencias' },
];

/** The signed-in person's own account: profile data, password change and theme preference, as tabs. */
export function AccountPage({ shell }: { shell: ShellContext }): ReactNode {
  const { ui } = shell;
  const api = useMemo(() => authApi(shell.api), [shell.api]);
  const [tab, setTab] = useState<Tab>('profile');
  const { state, reload } = ui.useLoad((signal) => api.me(signal), []);

  return (
    <>
      <ui.PageHeader title="Mi cuenta" />
      <div className="tabs" role="tablist" aria-label="Mi cuenta">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id}
            className={`tab-btn${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'profile' ? <ProfileTab state={state} onRetry={reload} ui={ui} /> : null}
      {tab === 'security' ? <SecurityTab shell={shell} /> : null}
      {tab === 'preferences' ? <PreferencesTab /> : null}
    </>
  );
}

function ProfileTab({ state, onRetry, ui }: {
  state: LoadState<User>;
  onRetry: () => void;
  ui: ShellContext['ui'];
}): ReactNode {
  return (
    <ui.DataState state={state} onRetry={onRetry}>
      {(person) => {
        const role = ROLE_LABEL[person.role] ?? person.role;
        return (
          <section className="card">
            <div className="profile-header">
              <ui.Avatar name={person.fullName} />
              <h2>{person.fullName}</h2>
            </div>
            <dl className="facts">
              <dt>Usuario</dt>
              <dd>{person.username}</dd>
              <dt>Nombre</dt>
              <dd>{person.fullName}</dd>
              <dt>Email</dt>
              <dd>{person.email ?? '—'}</dd>
              <dt>Rol</dt>
              <dd>{role}</dd>
            </dl>
          </section>
        );
      }}
    </ui.DataState>
  );
}

/** The password-change form, unchanged: same logic and validation as before, only moved into this tab. */
function SecurityTab({ shell }: { shell: ShellContext }): ReactNode {
  const { ui, user } = shell;
  const api = useMemo(() => authApi(shell.api), [shell.api]);
  const [draft, setDraft] = useState(EMPTY);
  const [attempted, setAttempted] = useState(false);
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const clientErrors = validatePasswordChange(draft, user.username);
  const errors = { ...(attempted ? clientErrors : {}), ...serverErrors };

  const set = (key: keyof PasswordChangeDraft) => (value: string) => setDraft((d) => ({ ...d, [key]: value }));

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setAttempted(true);
    setFailure(null);
    setServerErrors({});
    if (pending || Object.keys(clientErrors).length > 0) {
      return;
    }
    setPending(true);
    try {
      await api.changePassword(draft.currentPassword, draft.newPassword);
      shell.notify('Contraseña actualizada', 'success');
      setDraft(EMPTY);
      setAttempted(false);
    } catch (error) {
      const info = (error as { info?: { userMessage: string; details: { field: string; message: string }[] } }).info;
      setServerErrors(Object.fromEntries((info?.details ?? []).map((d) => [d.field, d.message])));
      setFailure(info?.userMessage ?? 'No se pudo cambiar la contraseña.');
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="card">
      <h2>Cambiar contraseña</h2>
      <form onSubmit={(event) => void onSubmit(event)} noValidate>
        {failure && Object.keys(serverErrors).length === 0 ? <ui.Banner kind="error">{failure}</ui.Banner> : null}
        <ui.TextField id="currentPassword" label="Contraseña actual" required type="password"
          value={draft.currentPassword} onChange={set('currentPassword')} error={errors.currentPassword}
          autoComplete="current-password" />
        <ui.TextField id="newPassword" label="Contraseña nueva" required type="password" value={draft.newPassword}
          onChange={set('newPassword')} error={errors.newPassword} autoComplete="new-password"
          hint="Al menos 10 caracteres, con mayúsculas, minúsculas y números" />
        <ui.TextField id="confirmation" label="Confirma la contraseña nueva" required type="password"
          value={draft.confirmation} onChange={set('confirmation')} error={errors.confirmation}
          autoComplete="new-password" />
        <div className="actions">
          <button type="submit" className="btn" disabled={pending}>
            {pending ? 'Guardando…' : 'Cambiar contraseña'}
          </button>
        </div>
      </form>
    </section>
  );
}

type Theme = 'light' | 'dark';
const THEME_KEY = 'opti.theme';

function currentTheme(): Theme {
  const explicit = document.documentElement.dataset.theme;
  if (explicit === 'light' || explicit === 'dark') {
    return explicit;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * A second way to switch the theme, besides the topbar toggle in opti-front's Shell (left untouched:
 * removing it there is a separate, coordinated task). Uses the same mechanism the shell already uses:
 * `document.documentElement.dataset.theme` plus the `opti.theme` localStorage key.
 */
function PreferencesTab(): ReactNode {
  const [theme, setTheme] = useState<Theme>(currentTheme);

  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(currentTheme()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  function applyTheme(next: Theme): void {
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // the preference just is not remembered
    }
    setTheme(next);
  }

  return (
    <section className="card">
      <h2>Tema</h2>
      <p>Elige cómo se ve OptiView en este dispositivo.</p>
      <div className="actions">
        <button type="button" className={`btn${theme === 'light' ? '' : ' btn-quiet'}`}
          onClick={() => applyTheme('light')} aria-pressed={theme === 'light'}>
          Tema claro
        </button>
        <button type="button" className={`btn${theme === 'dark' ? '' : ' btn-quiet'}`}
          onClick={() => applyTheme('dark')} aria-pressed={theme === 'dark'}>
          Tema oscuro
        </button>
      </div>
    </section>
  );
}
