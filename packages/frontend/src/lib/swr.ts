import type { SWRConfiguration } from 'swr'

export async function apiFetcher<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }))
    throw new Error(error.message || 'An error occurred')
  }

  return response.json()
}

export const swrDefaultOptions: SWRConfiguration = {
  revalidateOnFocus: false,
  refreshInterval: 60000,
}
