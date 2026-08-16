/**
 * Shared shape for the signup forms (newsletter + free e-book).
 *
 * This lives outside src/app/actions.ts on purpose: that file carries the
 * 'use server' directive, and such a file may only export async functions.
 * Exporting the initial-state object from there makes Next throw at runtime
 * with «A "use server" file can only export async functions, found object.»
 */

export type FormState = {
  status: 'idle' | 'success' | 'error';
  message: string;
};

export const initialFormState: FormState = { status: 'idle', message: '' };
