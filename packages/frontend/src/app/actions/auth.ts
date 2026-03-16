'use server'

import { cookies } from 'next/headers'
import { cache } from 'react'
import { refresh as authRefresh } from '@/data/auth'
import { apiClientBackend } from '@/lib/api-backend'
import { User, ActionStateWithErrors, ActionState } from '@/types'
import { loginSchema } from '@/lib/auth'
import { refresh } from 'next/cache'
import { newUserSchema, editUserSchema, changePasswordSchema } from '@/data/users'

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

export const login = async (_initialState: unknown, formData: FormData) => {
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

export const createUser = async (
  _initialState: unknown,
  formData: FormData
): Promise<ActionStateWithErrors & { email: string }> => {
  console.log(formData)
  const raw = {
    email: formData.get('email') || '',
    password: formData.get('password') || undefined,
    confirmPassword: formData.get('confirmPassword') || undefined,
  }

  const parsed = newUserSchema.safeParse(raw)

  if (!parsed.success) {
    console.log(parsed.error.flatten())
    return {
      success: false,
      error: 'Backend validation failed.',
      fieldErrors: parsed.error.flatten()['fieldErrors'],
      email: String(raw.email),
    }
  }

  try {
    await apiClientBackend.post(
      '/api/users',
      { email: parsed.data.email, password: parsed.data.password },
      { credentials: 'include' }
    )

    return {
      success: true,
      message: 'User successfully created!',
      email: parsed.data.email,
    }
  } catch (e) {
    console.error(e)
    return {
      success: false,
      error: 'Unexpected error. User not created.',
      email: String(raw.email),
    }
  }
}

export const updateUser = async (
  initialState: unknown,
  formData: FormData
): Promise<ActionStateWithErrors & { email: string }> => {
  const raw = {
    email: formData.get('email') || '',
    id: formData.get('id'),
  }

  const parsed = editUserSchema.safeParse(raw)

  if (!parsed.success) {
    console.log(parsed.error.flatten())
    return {
      success: false,
      error: 'Backend validation failed.',
      fieldErrors: parsed.error.flatten()['fieldErrors'],
      email: String(raw.email),
    }
  }

  try {
    await apiClientBackend.patch(
      `/api/users/${parsed.data.id}`,
      { email: parsed.data.email },
      { credentials: 'include' }
    )

    return {
      success: true,
      message: 'User successfully updated!',
      email: parsed.data.email,
    }
  } catch (e) {
    console.error(e)
    return {
      success: false,
      error: 'Unexpected error. User not updated.',
      email: String(raw.email),
    }
  }
}

export const changePassword = async (_initialState: unknown, formData: FormData): Promise<ActionStateWithErrors> => {
  const raw = {
    password: formData.get('password') || '',
    confirmPassword: formData.get('confirmPassword') || undefined,
    id: formData.get('id'),
  }

  const parsed = changePasswordSchema.safeParse(raw)

  if (!parsed.success) {
    console.log(parsed.error.flatten())
    return {
      success: false,
      error: 'Backend validation failed.',
      fieldErrors: parsed.error.flatten()['fieldErrors'],
    }
  }

  try {
    await apiClientBackend.patch(
      `/api/users/${parsed.data.id}/password`,
      { password: parsed.data.password },
      { credentials: 'include' }
    )

    return {
      success: true,
      message: 'User successfully updated!',
    }
  } catch (e) {
    console.error(e)
    return {
      success: false,
      error: 'Unexpected error. Password not changed.',
    }
  }
}

export const deleteUser = async (_initialState: unknown, formData: FormData): Promise<ActionState> => {
  const id = formData.get('id')

  const parsed = editUserSchema.pick({ id: true }).safeParse({ id })

  if (!parsed.success) {
    console.log(parsed.error.flatten())
    return {
      success: false,
      error: 'Errod while deleting the user.',
    }
  }

  try {
    await apiClientBackend.delete(
      `/api/users/${parsed.data.id}`,
      { credentials: 'include' }
    )

    return {
      success: true,
      message: 'User successfully deleted!',
    }
  } catch (e) {
    console.error(e)
    return {
      success: false,
      error: 'Unexpected error. User not deleted.',
    }
  }
}
