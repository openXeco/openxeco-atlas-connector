'use server'

import type { ManageEntityState } from '@/components/entities/entity-wizard'
import type { EntityFormData, ActionState } from '@/types'
import { parseFormData } from '@/lib/utils'
import { getApiClient } from '@/lib/api-client'

import { entitySchema } from '@/schema'

export async function createEntity(
  _prevState: ManageEntityState | null,
  formData: FormData,
): Promise<ManageEntityState> {
  const values = parseEntity(formData)

  const parsed = entitySchema.safeParse(values)

  if (!parsed.success) {
    return {
      success: false,
      message: 'Backend validation failed',
      entity: values as unknown as EntityFormData,
    }
  }

  try {
    const apiClient = await getApiClient()
    await apiClient.post('/entities', parsed.data, { credentials: 'include' })

    return {
      success: true,
      message: 'Entity successfully saved.',
      entity: parsed.data,
    }
  } catch (e) {
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
    return {
      success: false,
      message: 'Backend validation failed',
      entity: values as unknown as EntityFormData,
    }
  }

  try {
    const apiClient = await getApiClient()
    await apiClient.patch(`/entities/${id}`, parsed.data, { credentials: 'include' })

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
  const apiClient = await getApiClient()
  try {
    await apiClient.delete(`/entities/${id}`, { credentials: 'include' })
  } catch (_e) {
    // biome-ignore lint/suspicious/noConsole: Needed
    console.error(_e)
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

export async function syncEntity(_prevState: unknown, formData: FormData): Promise<ActionState> {
  const id = formData.get('id')
  const apiClient = await getApiClient()

  try {
    await apiClient.post(`/entities/${id}/sync`, {}, { credentials: 'include' })
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

const parseEntity = (formData: FormData): EntityFormData => {
  return parseFormData<EntityFormData>(formData, {
    booleans: [
      'isHeadquarter',
      'hasSubsidiaries',
      'hasSubsidiaries',
      'hasMajorityShares',
      'article138Compliance',
      'dataShareConsent',
      'dataProtectionConsent',
      'formCompletionConfirmed',
    ],
    arrays: ['fieldsOfActivityIds', 'thematicAreaIds', 'sectorIds', 'technologyIds', 'useCaseIds'],
  })
}
