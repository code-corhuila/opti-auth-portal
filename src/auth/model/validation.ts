import type { UserRole } from './user';

/**
 * Field rules, the same ones the identity service enforces (the service stays the authority: this
 * only saves a round trip and points at the field). Each function returns errors by field name.
 */
export type Errors = Record<string, string>;

const USERNAME = /^[a-z0-9._-]{3,40}$/;
const MIN_PASSWORD = 10;
const MAX_PASSWORD_BYTES = 72;

/** What is wrong with a new password, in the order a person can fix it; undefined when it is fine. */
export function passwordProblem(password: string, username = ''): string | undefined {
  if (password.length < MIN_PASSWORD) {
    return `Debe tener al menos ${MIN_PASSWORD} caracteres`;
  }
  if (new TextEncoder().encode(password).length > MAX_PASSWORD_BYTES) {
    return `Debe tener como máximo ${MAX_PASSWORD_BYTES} bytes`;
  }
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Debe mezclar mayúsculas, minúsculas y números';
  }
  if (username && password.toLowerCase() === username.trim().toLowerCase()) {
    return 'No puede ser igual al nombre de usuario';
  }
  return undefined;
}

export function validateLogin(draft: { username: string; password: string }): Errors {
  const errors: Errors = {};
  if (!draft.username.trim()) {
    errors.username = 'Escribe tu usuario';
  }
  if (!draft.password) {
    errors.password = 'Escribe tu contraseña';
  }
  return errors;
}

export interface NewUserDraft {
  username: string;
  fullName: string;
  password: string;
  role: UserRole | '';
}

export function validateNewUser(draft: NewUserDraft): Errors {
  const errors: Errors = {};
  if (!USERNAME.test(draft.username.trim().toLowerCase())) {
    errors.username = 'De 3 a 40 caracteres: letras, números, punto, guion o guion bajo';
  }
  const name = draft.fullName.trim();
  if (name.length < 2 || name.length > 120) {
    errors.fullName = 'El nombre completo es obligatorio (2 a 120 caracteres)';
  }
  const problem = passwordProblem(draft.password, draft.username);
  if (problem) {
    errors.password = problem;
  }
  if (!draft.role) {
    errors.role = 'Elige un rol';
  }
  return errors;
}

export interface PasswordChangeDraft {
  currentPassword: string;
  newPassword: string;
  confirmation: string;
}

export function validatePasswordChange(draft: PasswordChangeDraft, username: string): Errors {
  const errors: Errors = {};
  if (!draft.currentPassword) {
    errors.currentPassword = 'Escribe tu contraseña actual';
  }
  const problem = passwordProblem(draft.newPassword, username);
  if (problem) {
    errors.newPassword = problem;
  } else if (draft.newPassword === draft.currentPassword) {
    errors.newPassword = 'Debe ser distinta de la actual';
  }
  if (draft.confirmation !== draft.newPassword) {
    errors.confirmation = 'La confirmación no coincide';
  }
  return errors;
}
