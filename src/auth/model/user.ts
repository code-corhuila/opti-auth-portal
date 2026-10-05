/** Types of the identity API contract (same field names as the service). */

export type UserRole = 'ADMIN' | 'SELLER' | 'OPTOMETRIST';

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string | null;
  role: UserRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export const ROLES: { value: UserRole; label: string }[] = [
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'SELLER', label: 'Vendedor' },
  { value: 'OPTOMETRIST', label: 'Optómetra' },
];

export const ROLE_LABEL: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  SELLER: 'Vendedor',
  OPTOMETRIST: 'Optómetra',
};

export function formatDate(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}

/**
 * Up to two initials from a full name, for the avatar fallback (see the TODO in UsersPage/AccountPage:
 * switch to the shared `ui.Avatar` once `SharedUi.Avatar` lands in shell-contract.ts).
 */
export function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : '';
  return (first + last).toUpperCase();
}
