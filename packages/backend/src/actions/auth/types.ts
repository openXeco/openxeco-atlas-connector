import type { User } from '@/db/schema.js'

export type PresentationUser = Pick<User, 'id' | 'role' | 'email' | 'createdAt'>
