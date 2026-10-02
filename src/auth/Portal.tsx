import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import type { ShellContext } from '../shell-contract';
import { RequireRole } from './RequireRole';
import { AccountPage } from './pages/AccountPage';
import { UsersPage } from './pages/UsersPage';

/** The identity portal: mounted by opti-front under /auth. */
export default function Portal({ shell }: { shell: ShellContext }): ReactNode {
  return (
    <Routes>
      <Route index element={<Navigate to="account" replace />} />
      <Route path="account" element={<AccountPage shell={shell} />} />
      <Route
        path="users"
        element={
          <RequireRole shell={shell} role="ADMIN">
            <UsersPage shell={shell} />
          </RequireRole>
        }
      />
      <Route path="*" element={<Navigate to="/auth/account" replace />} />
    </Routes>
  );
}
