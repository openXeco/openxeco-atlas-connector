import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const updateUserSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export const changePasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
})
