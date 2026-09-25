'use server'

import type { ManageEntityState } from '@/components/entities/entity-wizard'
import type { EntityFormData, ActionState, Entity, CheckConflictsState } from '@/types'
import { parseFormData } from '@/lib/utils'
import { getApiClient } from '@/lib/api-client'

import { entitySchema } from '@/schema'
import { logger } from '@/lib/logger'

export type CorrespondenceCandidate = {
  atlasId: string
  name: string
  nameNational?: string
  registrationNumber?: string
  streetAddress?: string
  city?: string
  email?: string
  phone?: string
  contactEmail?: string
  contactFirstName?: string
  contactLastName?: string
  contactPhone?: string
  contactPosition?: string
}

export type PushEntityState =
  | { success: true; message: string; candidates?: CorrespondenceCandidate[] }
  | { success: false; error: string }

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

export async function pushEntity(_prevState: unknown, formData: FormData): Promise<PushEntityState> {
  const id = formData.get('id')
  const apiClient = getApiClient()

  try {
    const response = await apiClient.post<{
      data: { code: 'synced' } | { code: 'selection_required'; candidates: CorrespondenceCandidate[]; entityId: string }
    }>(`/sync/entities/${id}/push`, {}, { credentials: 'include' })

    if (response.data.code === 'selection_required') {
      return {
        success: true,
        message: 'Select the matching ATLAS entity.',
        candidates: response.data.candidates,
      }
    }

    return {
      success: true,
      message: 'Successfully synced.',
    }
  } catch (e) {
    logger.error(e)
    return {
      success: false,
      error: 'Error syncing Entity. Please check the logs',
    }
  }
}

export async function selectCorrespondence(_prevState: unknown, formData: FormData): Promise<ActionState> {
  const id = formData.get('id')
  const atlasId = formData.get('atlasId')

  try {
    await getApiClient().post(`/sync/entities/${id}/correspondences`, { atlasId }, { credentials: 'include' })

    return {
      success: true,
      message: 'Correspondence linked. Push again to synchronize the entity.',
    }
  } catch (error) {
    logger.error(error)
    return { success: false, error: 'Unable to link the selected correspondence. Please try again.' }
  }
}

export async function checkConflicts(_prevState: unknown, formData: FormData): Promise<CheckConflictsState> {
  const id = formData.get('id')

  try {
    const response = await getApiClient().get<{ data: Record<string, unknown> }>(`/sync/entities/${id}/conflicts`, {
      credentials: 'include',
      cache: 'no-store',
    })

    return {
      success: true,
      message: 'Conflicts successfully checked.',
      data: response.data,
    }
  } catch (error) {
    logger.error(error)
    return { success: false, error: 'Unable to check conflicts. Please try again.' }
  }
}

export async function forcePushEntity(_prevState: unknown, formData: FormData): Promise<ActionState> {
  return forceSyncEntity(formData, 'force-push')
}

export async function forcePullEntity(_prevState: unknown, formData: FormData): Promise<ActionState> {
  return forceSyncEntity(formData, 'force-pull')
}

async function forceSyncEntity(formData: FormData, operation: 'force-push' | 'force-pull'): Promise<ActionState> {
  const id = formData.get('id')

  try {
    await getApiClient().post(`/sync/entities/${id}/${operation}`, {}, { credentials: 'include' })
    return { success: true, message: 'The differences were solved.' }
  } catch (error) {
    logger.error(error)
    return { success: false, error: 'Unable to resolve conflicts. Please check the logs and try again.' }
  }
}

export async function getEntity(id: string): Promise<{ entity: Entity }> {
  const apiClient = getApiClient()

  const entityRes = await apiClient.get<{ data: Entity }>(`/entities/${id}`, { credentials: 'include' })

  return { entity: entityRes.data }
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
