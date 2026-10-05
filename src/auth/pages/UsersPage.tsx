import { useMemo, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ShellContext } from '../../shell-contract';
import { authApi } from '../api/authApi';
import { NewUserForm } from '../components/NewUserForm';
import { formatDate, initials, ROLE_LABEL, ROLES } from '../model/user';

/** Administers people (create, deactivate, reactivate). Only for ADMIN. */
export function UsersPage({ shell }: { shell: ShellContext }): ReactNode {
  const { ui } = shell;
  const api = useMemo(() => authApi(shell.api), [shell.api]);
  const [params, setParams] = useSearchParams();
  const [text, setText] = useState(params.get('q') ?? '');
  const [creating, setCreating] = useState(false);
  const [version, setVersion] = useState(0);
  const q = ui.useDebounced(text.trim(), 300);
  const role = (params.get('role') ?? '') as '' | (typeof ROLES)[number]['value'];
  const active = (params.get('active') ?? '') as '' | 'true' | 'false';
  const page = Number(params.get('page') ?? '1') || 1;

  const { state, reload } = ui.useLoad((signal) => api.listUsers({ q, role, active, page }, signal), [q, role, active, page, version]);

  function update(next: Record<string, string>): void {
    const merged = new URLSearchParams(params);
    for (const [key, value] of Object.entries(next)) {
      if (value) merged.set(key, value);
      else merged.delete(key);
    }
    setParams(merged, { replace: true });
  }

  async function toggle(id: string, makeActive: boolean): Promise<void> {
    try {
      await api.setActive(id, makeActive);
      shell.notify(makeActive ? 'Usuario activado' : 'Usuario desactivado', 'success');
      setVersion((v) => v + 1);
    } catch (error) {
      shell.notify((error as { info?: { userMessage: string } }).info?.userMessage ?? 'No se pudo actualizar.', 'error');
    }
  }

  return (
    <>
      <ui.PageHeader
        title="Usuarios"
        actions={!creating ? <button type="button" className="btn" onClick={() => setCreating(true)}>Nuevo usuario</button> : null}
      />
      {creating ? (
        <NewUserForm shell={shell} onCancel={() => setCreating(false)} onCreated={() => { setCreating(false); setVersion((v) => v + 1); }} />
      ) : null}
      <div className="toolbar" role="search">
        <ui.TextField id="user-search" label="Buscar" type="search" placeholder="Usuario o nombre" value={text}
          onChange={(value) => { setText(value); update({ page: '' }); }} maxLength={60} />
        <ui.SelectField id="user-role" label="Rol" value={role} placeholder="Todos"
          onChange={(value) => update({ role: value, page: '' })} options={ROLES} />
        <ui.SelectField id="user-active" label="Estado" value={active} placeholder="Todos"
          onChange={(value) => update({ active: value, page: '' })}
          options={[{ value: 'true', label: 'Activos' }, { value: 'false', label: 'Inactivos' }]} />
      </div>
      <ui.DataState state={state} onRetry={reload} isEmpty={(r) => r.data.length === 0} emptyTitle="No encontramos usuarios">
        {(result) => (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Creado</th>
                    <th>Estado</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {result.data.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <span className="user-cell">
                          {/* TODO: switch to ui.Avatar (shared SharedUi.Avatar contract) once it lands in
                              shell-contract.ts from opti-front; this inline circle is a temporary fallback. */}
                          <span className="avatar-fallback" aria-hidden="true">{initials(user.fullName)}</span>
                          {user.username}
                        </span>
                      </td>
                      <td>{user.fullName}</td>
                      <td>{user.email ?? '—'}</td>
                      <td>{ROLE_LABEL[user.role]}</td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td>
                        <ui.Badge tone={user.active ? 'success' : 'neutral'}>{user.active ? 'Activo' : 'Inactivo'}</ui.Badge>
                      </td>
                      <td>
                        {user.id === shell.user.id ? null : user.active ? (
                          <button type="button" className="btn btn-danger" onClick={() => void toggle(user.id, false)}>
                            Desactivar
                          </button>
                        ) : (
                          <button type="button" className="btn btn-quiet" onClick={() => void toggle(user.id, true)}>
                            Activar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ui.Pager meta={result.meta} onPage={(next) => update({ page: next === 1 ? '' : String(next) })} />
          </>
        )}
      </ui.DataState>
    </>
  );
}
