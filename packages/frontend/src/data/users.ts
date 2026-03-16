import { z } from 'zod'

export const baseUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string({ message: 'Password is required' }).min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string({ message: 'Password confirmation is required' }),
})

export const newUserSchema = baseUserSchema.refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const editUserSchema = z
  .object({
    id: z.string({ message: 'Unexpected error. User ID' }).uuid(),
    email: z.string().email('Invalid email address'),
  })

export const changePasswordSchema = z
  .object({
    id: z.string({ message: 'Unexpected error. User ID' }).uuid(),
  })
  .merge(baseUserSchema.pick({ password: true, confirmPassword: true }))
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
