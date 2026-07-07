'use server'

import type { ManageEntityState } from '@/components/entities/entity-wizard'
import type { EntityFormData, ActionState, Entity, EntityVersion } from '@/types'
import { parseFormData } from '@/lib/utils'
import { getApiClient } from '@/lib/api-client'

import { entitySchema } from '@/schema'
import { logger } from '@/lib/logger'

export async function createEntity(
  _prevState: ManageEntityState | null,
  formData: FormData,
): Promise<ManageEntityState> {
  const values = parseEntity(formData)

  const parsed = entitySchema.safeParse(values)

  if (!parsed.success) {
    logger.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2))
    return {
      success: false,
      message: 'Backend validation failed',
      entity: values as unknown as EntityFormData,
    }
  }

  try {
    const apiClient = getApiClient()
    await apiClient.post('/entities', parsed.data, { credentials: 'include' })

    return {
      success: true,
      message: 'Entity successfully saved.',
      entity: parsed.data,
    }
  } catch (e) {
    logger.error(e)
    return {
      success: false,
      message: `Failed to create Entity. ${(e as Error).message}`,
      entity: values as unknown as EntityFormData,
    }
  }
}

export async function updateEntity(
  _prevState: ManageEntityState | null,
  formData: FormData,
): Promise<ManageEntityState> {
  const id = formData.get('id') as string
  const values = parseEntity(formData)

  const parsed = entitySchema.safeParse(values)

  if (!parsed.success) {
    logger.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2))
    return {
      success: false,
      message: 'Backend validation failed',
      entity: values as unknown as EntityFormData,
    }
  }

  try {
    const apiClient = getApiClient()
    await apiClient.put(`/entities/${id}`, parsed.data, { credentials: 'include' })

    return {
      success: true,
      message: 'Entity successfully updated.',
      entity: parsed.data,
    }
  } catch (e) {
    return {
      success: false,
      message: `Failed to update Entity. ${(e as Error).message}`,
      entity: values as unknown as EntityFormData,
    }
  }
}

export async function deleteEntity(id: string) {
  const apiClient = getApiClient()
  try {
    await apiClient.delete(`/entities/${id}`, { credentials: 'include' })
  } catch (e) {
    logger.error(e)
  }
}

export async function deleteEntityFormAction(_prevState: unknown, formData: FormData): Promise<ActionState> {
  const id = formData.get('id')

  await deleteEntity(id as string)

  return {
    success: true,
    message: 'Deleted',
  }
}

export async function pushEntity(_prevState: unknown, formData: FormData): Promise<ActionState> {
  const id = formData.get('id')
  const apiClient = getApiClient()

  try {
    await apiClient.post(`/entities/${id}/push`, {}, { credentials: 'include' })
    return {
      success: true,
      message: 'Successfully synced.',
    }
  } catch (_e) {
    return {
      success: false,
      error: 'Error syncing Entity. Please check the logs',
    }
  }
}

export async function checkConflicts(_prevState: unknown, formData: FormData): Promise<ActionState> {
  const id = formData.get('id')
  const apiClient = getApiClient()

  return {
    success: true,
    message: 'Conflicts checked',
  }
}

export async function getEntity(id: string): Promise<{ entity: Entity; versions: EntityVersion[] }> {
  const apiClient = getApiClient()

  const [entityRes, versionsRes] = await Promise.all([
    apiClient.get<{ data: Entity }>(`/entities/${id}`, { credentials: 'include' }),
    apiClient.get<{ data: EntityVersion[] }>(`/entities/${id}/versions`, { credentials: 'include' }),
  ])

  return { entity: entityRes.data, versions: versionsRes.data }
}

const parseEntity = (formData: FormData): EntityFormData => {
  return parseFormData<EntityFormData>(formData, {
    booleans: [
      'isHeadquarter',
      'hasSubsidiaries',
      'dataShareConsent',
      'hasMajorityShares',
      'article138Compliance',
      'dataShareConsent',
      'dataProtectionConsent',
      'formCompletionConfirmed',
    ],
    arrays: ['fieldsOfActivityIds', 'thematicAreaIds', 'sectorIds', 'technologyIds', 'useCaseIds'],
  })
}
