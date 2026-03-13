'use server'

import { cookies } from 'next/headers'
import { cache } from 'react'
import { refresh as authRefresh } from '@/data/auth'
import { apiClientBackend } from '@/lib/api-backend'
import { User } from '@/types'
import { loginSchema } from '@/lib/auth'
import { refresh } from 'next/cache'

export async function createSession(refreshToken: string, refreshTokenExpiresIn: number) {
  const cookieStore = await cookies()

  cookieStore.set('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'strict',
    path: '/',
    maxAge: refreshTokenExpiresIn,
  })
}

export async function destroySession() {
  const cookieStore = await cookies()

  cookieStore.delete('refreshToken')
}

export const getAccessToken = cache(async (): Promise<string | undefined> => {
  const refreshToken = (await cookies()).get('refreshToken')?.value

  if (!refreshToken) {
    return
  }

  const result = await authRefresh(refreshToken)

  return result.accessToken
})

export const login = async (initialState: unknown, formData: FormData) => {
  'use server'
  const result = loginSchema.safeParse({ email: formData.get('email'), password: formData.get('password') })

  if (!result.success) {
    return {
      message: 'The form is invalid',
      errors: { ...result.error.flatten().fieldErrors },
      values: { email: String(formData.get('email')) || '' },
    }
  }

  try {
    const response = await apiClientBackend.post<{
      accessToken: string
      refreshToken: string
      refreshTokenExpiresIn: number
      user: User
    }>('/api/auth/login', { email: result.data.email, password: result.data.password })

    await createSession(response.refreshToken, response.refreshTokenExpiresIn)

    refresh()
  } catch (_error) {
    return {
      message: 'Invalid email or password. Please try again.',
      values: { email: String(formData.get('email')) || '' },
    }
  }
}

export const logout = async (): Promise<void> => {
  await destroySession()
  refresh()
}
