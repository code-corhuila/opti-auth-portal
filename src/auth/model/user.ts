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
