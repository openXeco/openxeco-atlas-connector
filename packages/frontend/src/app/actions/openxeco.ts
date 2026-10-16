'use server'

import type { ActionStateWithErrors } from '@/types'
import { getApiClient } from '@/lib/api-client'
import { loginSchema } from '@/schema'

export const oxeLogin = async (
  _initialState: unknown,
  formData: FormData,
): Promise<ActionStateWithErrors & { email: string }> => {
  const apiClient = getApiClient()

  const loginData = loginSchema.safeParse({ email: formData.get('email'), password: formData.get('password') })

  if (!loginData.success) {
    return {
      success: false,
      error: 'The form in invalid',
      fieldErrors: { ...loginData.error.flatten().fieldErrors },
      email: String(formData.get('email') || ''),
    }
  }

  try {
    await apiClient.post('/openxeco/login', { ...loginData.data }, { credentials: 'include' })
    return {
      success: true,
      message: 'User successfully logged in openXeco.',
      email: loginData.data.email,
    }
  } catch (_e) {
    return {
      success: false,
      error: 'Invalid email or password. Please try again.',
      email: String(formData.get('email')) || '',
    }
  }
}

export const oxeLogout = async (_initialState: unknown, _formData: FormData): Promise<ActionStateWithErrors> => {
  try {
    const apiClient = getApiClient()
    await apiClient.post('/openxeco/logout', {}, { credentials: 'include' })
    return {
      success: true,
      message: 'User successfully logged out.',
    }
  } catch (_e) {
    return {
      success: false,
      error: 'Error logging out.',
    }
  }
}
