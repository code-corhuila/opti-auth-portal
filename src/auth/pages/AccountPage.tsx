import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import type { ShellContext } from '../../shell-contract';
import { authApi } from '../api/authApi';
import { ROLE_LABEL } from '../model/user';
import { validatePasswordChange, type PasswordChangeDraft } from '../model/validation';

const EMPTY: PasswordChangeDraft = { currentPassword: '', newPassword: '', confirmation: '' };

/** The signed-in person's own account: who they are, and changing their password. */
export function AccountPage({ shell }: { shell: ShellContext }): ReactNode {
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
    <>
      <ui.PageHeader title="Mi cuenta" />
      <section className="card">
        <h2>Datos</h2>
        <dl className="facts">
          <dt>Usuario</dt>
          <dd>{user.username}</dd>
          <dt>Nombre</dt>
          <dd>{user.fullName}</dd>
          <dt>Rol</dt>
          <dd>{ROLE_LABEL[user.role as keyof typeof ROLE_LABEL] ?? user.role}</dd>
        </dl>
      </section>
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
    </>
  );
}
