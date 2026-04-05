import { z } from 'zod';

export const signInSchema = z.object({
  email: z.string().email('Virheellinen sähköpostiosoite'),
  password: z.string().min(1, 'Kenttä on pakollinen'),
});

export const signUpSchema = z.object({
  email: z.string().email('Virheellinen sähköpostiosoite'),
  password: z.string().min(8, 'Salasanan on oltava vähintään 8 merkkiä'),
});

export type SignInSchema = z.infer<typeof signInSchema>;
export type SignUpSchema = z.infer<typeof signUpSchema>;
