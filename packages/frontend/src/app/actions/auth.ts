'use server'

import { getApiClient } from '@/lib/api-client'
import type { ActionStateWithErrors, ActionState } from '@/types'
import { loginSchema, changePasswordSchema, editUserSchema, newUserSchema } from '@/schema'

export const login = async (
  _initialState: unknown,
  formData: FormData,
): Promise<ActionStateWithErrors & { email: string }> => {
  const apiClient = await getApiClient()
  const result = loginSchema.safeParse({ email: formData.get('email'), password: formData.get('password') })

  if (!result.success) {
    return {
      success: false,
      error: 'The form is invalid',
      fieldErrors: { ...result.error.flatten().fieldErrors },
      email: String(formData.get('email')) || '',
    }
  }

  try {
    await apiClient.loginUser(result.data.email, result.data.password)

    return {
      success: true,
      message: 'User successfully logged in',
      email: result.data.email,
    }
  } catch (_error) {
    return {
      success: false,
      error: 'Invalid email or password. Please try again.',
      email: String(formData.get('email')) || '',
    }
  }
}

export const logout = async (): Promise<{ success: boolean }> => {
  const apiClient = await getApiClient()

  await apiClient.logoutUser()

  return {
    success: true,
  }
}

export const createUser = async (
  _initialState: unknown,
  formData: FormData,
): Promise<ActionStateWithErrors & { email: string }> => {
  const raw = {
    email: formData.get('email') || '',
    password: formData.get('password') || undefined,
    confirmPassword: formData.get('confirmPassword') || undefined,
  }

  const parsed = newUserSchema.safeParse(raw)

  if (!parsed.success) {
    return {
      success: false,
      error: 'Backend validation failed.',
      fieldErrors: parsed.error.flatten().fieldErrors,
      email: String(raw.email),
    }
  }

  try {
    const apiClient = await getApiClient()
    await apiClient.post(
      '/users',
      { email: parsed.data.email, password: parsed.data.password },
      { credentials: 'include' },
    )

    return {
      success: true,
      message: 'User successfully created!',
      email: parsed.data.email,
    }
  } catch (e) {
    // biome-ignore lint/suspicious/noConsole: Needed
    console.error(e)
    return {
      success: false,
      error: 'Unexpected error. User not created.',
      email: String(raw.email),
    }
  }
}

export const updateUser = async (
  _initialState: unknown,
  formData: FormData,
): Promise<ActionStateWithErrors & { email: string }> => {
  const raw = {
    email: formData.get('email') || '',
    id: formData.get('id'),
  }

  const parsed = editUserSchema.safeParse(raw)

  if (!parsed.success) {
    return {
      success: false,
      error: 'Backend validation failed.',
      fieldErrors: parsed.error.flatten().fieldErrors,
      email: String(raw.email),
    }
  }

  try {
    const apiClient = await getApiClient()
    await apiClient.patch(`/users/${parsed.data.id}`, { email: parsed.data.email }, { credentials: 'include' })

    return {
      success: true,
      message: 'User successfully updated!',
      email: parsed.data.email,
    }
  } catch (e) {
    // biome-ignore lint/suspicious/noConsole: Needed to know the error
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
    return {
      success: false,
      error: 'Backend validation failed.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  try {
    const apiClient = await getApiClient()
    await apiClient.patch(
      `/users/${parsed.data.id}/password`,
      { password: parsed.data.password },
      { credentials: 'include' },
    )

    return {
      success: true,
      message: 'User successfully updated!',
    }
  } catch (e) {
    // biome-ignore lint/suspicious/noConsole: Needed
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
    return {
      success: false,
      error: 'Errod while deleting the user.',
    }
  }

  try {
    const apiClient = await getApiClient()
    await apiClient.delete(`/users/${parsed.data.id}`, { credentials: 'include' })

    return {
      success: true,
      message: 'User successfully deleted!',
    }
  } catch (e) {
    // biome-ignore lint/suspicious/noConsole: Needed
    console.error(e)
    return {
      success: false,
      error: 'Unexpected error. User not deleted.',
    }
  }
}
