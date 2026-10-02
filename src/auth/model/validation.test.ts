import { describe, expect, it } from 'vitest';
import { passwordProblem, validateLogin, validateNewUser, validatePasswordChange } from './validation';

describe('password policy', () => {
  it('accepts a strong password', () => {
    expect(passwordProblem('Correct-Horse-42', 'laura')).toBeUndefined();
  });

  it.each([
    ['short1A', 'longitud'],
    ['alllowercase123', 'mayúsculas'],
    ['ALLUPPERCASE123', 'mayúsculas'],
    ['NoDigitsHereAtAll', 'mayúsculas'],
  ])('rejects %s', (password) => {
    expect(passwordProblem(password, 'laura')).toBeDefined();
  });

  it('rejects the username as password, whatever its case', () => {
    expect(passwordProblem('Laura12345A', 'laura12345a')).toBeDefined();
  });

  it('counts bytes, not characters: 72 bytes is the limit of bcrypt', () => {
    expect(passwordProblem('Aa1' + 'ñ'.repeat(40))).toBeDefined();
    expect(passwordProblem('Aa1' + 'x'.repeat(60))).toBeUndefined();
  });
});

describe('form validation', () => {
  it('login asks for both fields', () => {
    expect(Object.keys(validateLogin({ username: ' ', password: '' })).sort()).toEqual(['password', 'username']);
    expect(validateLogin({ username: 'admin', password: 'x' })).toEqual({});
  });

  it('a new user names every invalid field at once', () => {
    const errors = validateNewUser({ username: 'A!', fullName: ' ', password: 'short', role: '' });
    expect(Object.keys(errors).sort()).toEqual(['fullName', 'password', 'role', 'username']);
  });

  it('a valid new user passes; the username is compared in lower case', () => {
    expect(validateNewUser({ username: 'Laura.Ortega', fullName: 'Laura Ortega', password: 'Correct-Horse-42', role: 'SELLER' })).toEqual({});
  });

  it('a password change needs the current one, a new different one and a matching confirmation', () => {
    const errors = validatePasswordChange({ currentPassword: '', newPassword: 'weak', confirmation: 'other' }, 'laura');
    expect(Object.keys(errors).sort()).toEqual(['confirmation', 'currentPassword', 'newPassword']);
    expect(validatePasswordChange({ currentPassword: 'Correct-Horse-42', newPassword: 'Correct-Horse-42', confirmation: 'Correct-Horse-42' }, 'laura').newPassword)
      .toBeDefined();
    expect(validatePasswordChange({ currentPassword: 'Correct-Horse-42', newPassword: 'Another-Pass-77', confirmation: 'Another-Pass-77' }, 'laura'))
      .toEqual({});
  });
});
