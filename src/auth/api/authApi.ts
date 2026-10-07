import type { ApiClient, Page } from '../../shell-contract';
import type { LoginResponse, User, UserRole } from '../model/user';

/** The identity API through the container's client: the portal never builds its own. */
export interface UserQuery {
  q?: string;
  role?: UserRole | '';
  active?: '' | 'true' | 'false';
  page?: number;
}

export interface NewUser {
  username: string;
  fullName: string;
  email: string | null;
  password: string;
  role: UserRole;
}

export function authApi(api: ApiClient) {
  return {
    login: (username: string, password: string) =>
      api.post<LoginResponse>('/api/v1/auth/login', { username: username.trim(), password }),

    me: (signal?: AbortSignal) => api.get<User>('/api/v1/auth/me', signal ? { signal } : {}),

    changePassword: (currentPassword: string, newPassword: string) =>
      api.post<null>('/api/v1/auth/change-password', { currentPassword, newPassword }),

    listUsers: (query: UserQuery, signal?: AbortSignal) =>
      api.get<Page<User>>('/api/v1/users', {
        query: { q: query.q, role: query.role, active: query.active, page: query.page, limit: 10 },
        ...(signal ? { signal } : {}),
      }),

    createUser: (body: NewUser, idempotencyKey: string) =>
      api.post<{ id: string }>('/api/v1/users', body, { idempotencyKey }),

    setActive: (id: string, active: boolean) => api.post<User>(`/api/v1/users/${id}/${active ? 'activate' : 'deactivate'}`),
  };
}

export type AuthApi = ReturnType<typeof authApi>;
