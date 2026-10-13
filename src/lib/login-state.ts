/**
 * Shared shape for the /connexion form. Kept out of src/app/auth-actions.ts
 * because a 'use server' file may only export async functions.
 */

export type LoginState = {
  step: 'email' | 'code';
  email: string;
  status: 'idle' | 'sent' | 'error' | 'no_access';
  message: string;
};

export const initialLoginState: LoginState = { step: 'email', email: '', status: 'idle', message: '' };
