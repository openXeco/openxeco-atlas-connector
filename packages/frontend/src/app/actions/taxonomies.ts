'use server'

import { getApiClient } from '@/lib/api-client'
import type { ActionState, EntityTaxonomies, Taxonomy } from '@/types'
import { refresh } from 'next/cache'

export async function syncAll(): Promise<ActionState> {
  const apiClient = getApiClient()
  try {
    await apiClient.post('/taxonomies/sync', {}, { credentials: 'include' })
    return {
      success: true,
      message: 'Successfully synced all taxonomies.',
    }
  } catch (_e) {
    return {
      success: false,
      error: 'Error syncing taxonomies.',
    }
  }
}

export async function syncByType(_prevState: unknown, formData: FormData): Promise<ActionState> {
  const type = formData.get('type')
  const apiClient = getApiClient()

  try {
    await apiClient.post(`/taxonomies/sync/${type}`, {}, { credentials: 'include' })
    refresh()
    return {
      success: true,
      message: 'Successfully synced.',
    }
  } catch (_e) {
    return {
      success: false,
      error: 'Error syncing taxonomy.',
    }
  }
}

export const getTaxonomies = async (): Promise<EntityTaxonomies> => {
  const apiClient = getApiClient()

  const [countries, clusterTypes, fieldsOfActivity, thematicAreas, sectors, technologies, useCases] = await Promise.all(
    [
      apiClient.get<{ data: Taxonomy[] }>('/taxonomies/country', { credentials: 'include' }),
      apiClient.get<{ data: Taxonomy[] }>('/taxonomies/cluster_type', { credentials: 'include' }),
      apiClient.get<{ data: Taxonomy[] }>('/taxonomies/fields_of_activity', { credentials: 'include' }),
      apiClient.get<{ data: Taxonomy[] }>('/taxonomies/cluster_thematic_area', { credentials: 'include' }),
      apiClient.get<{ data: Taxonomy[] }>('/taxonomies/sectors', { credentials: 'include' }),
      apiClient.get<{ data: Taxonomy[] }>('/taxonomies/technologies', { credentials: 'include' }),
      apiClient.get<{ data: Taxonomy[] }>('/taxonomies/use_cases', { credentials: 'include' }),
    ],
  )

  return {
    countries: countries.data,
    clusterTypes: clusterTypes.data,
    fieldsOfActivity: fieldsOfActivity.data,
    thematicAreas: thematicAreas.data,
    sectors: sectors.data,
    technologies: technologies.data,
    useCases: useCases.data,
  }
}
