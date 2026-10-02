import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import type { ShellContext } from '../../shell-contract';
import { authApi, type NewUser } from '../api/authApi';
import { ROLES, type UserRole } from '../model/user';
import { validateNewUser, type NewUserDraft } from '../model/validation';

const EMPTY: NewUserDraft = { username: '', fullName: '', password: '', role: '' };

export function NewUserForm({ shell, onCreated, onCancel }: {
  shell: ShellContext;
  onCreated: () => void;
  onCancel: () => void;
}): ReactNode {
  const { ui } = shell;
  const api = useMemo(() => authApi(shell.api), [shell.api]);
  const [draft, setDraft] = useState<NewUserDraft>(EMPTY);
  const [attempted, setAttempted] = useState(false);
  const clientErrors = validateNewUser(draft);
  const request: NewUser = {
    username: draft.username.trim().toLowerCase(),
    fullName: draft.fullName.trim(),
    password: draft.password,
    role: draft.role as UserRole,
  };
  const { submit, pending, error, fieldErrors } = ui.useSubmit((key) => api.createUser(request, key), JSON.stringify(draft));
  const errors = { ...(attempted ? clientErrors : {}), ...fieldErrors };

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setAttempted(true);
    if (Object.keys(clientErrors).length > 0) {
      return;
    }
    if (await submit()) {
      shell.notify('Usuario creado', 'success');
      onCreated();
    }
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} noValidate className="card" aria-label="Nuevo usuario">
      {error && Object.keys(fieldErrors).length === 0 ? (
        <ui.Banner kind="error" title="No se pudo crear el usuario">{error.userMessage}</ui.Banner>
      ) : null}
      <div className="grid-2">
        <ui.TextField id="new-username" label="Usuario" required value={draft.username}
          onChange={(v) => setDraft((d) => ({ ...d, username: v }))} error={errors.username} maxLength={40}
          hint="Letras, números, punto, guion o guion bajo" autoComplete="off" />
        <ui.TextField id="new-fullName" label="Nombre completo" required value={draft.fullName}
          onChange={(v) => setDraft((d) => ({ ...d, fullName: v }))} error={errors.fullName} maxLength={120} />
        <ui.TextField id="new-password" label="Contraseña temporal" required type="password" value={draft.password}
          onChange={(v) => setDraft((d) => ({ ...d, password: v }))} error={errors.password}
          hint="Al menos 10 caracteres, con mayúsculas, minúsculas y números" autoComplete="new-password" />
        <ui.SelectField id="new-role" label="Rol" required value={draft.role} placeholder="Elige…"
          onChange={(v) => setDraft((d) => ({ ...d, role: v as UserRole | '' }))} options={ROLES} error={errors.role} />
      </div>
      <div className="actions">
        <button type="submit" className="btn" disabled={pending}>
          {pending ? 'Creando…' : 'Crear usuario'}
        </button>
        <button type="button" className="btn btn-quiet" onClick={onCancel} disabled={pending}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
