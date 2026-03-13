'use server'

import { ManageEntityState, entitySchema } from '@/components/entities/entity-wizard'
import { EntityFormData, type ActionState } from '@/types'
import { parseFormData } from '@/lib/utils'
import { apiClientBackend } from '@/lib/api-backend'

export async function createEntity(
  _prevState: ManageEntityState | null,
  formData: FormData
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
    await apiClientBackend.post('/api/entities', parsed.data, { credentials: 'include' })

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
  formData: FormData
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
    await apiClientBackend.patch(`/api/entities/${id}`, parsed.data, { credentials: 'include' })

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
  try {
    await apiClientBackend.delete(`/api/entities/${id}`, { credentials: 'include' })
  } catch (_e) {
    console.error(_e)
  }
}

export async function deleteEntityFormAction(prevState: unknown, formData: FormData): Promise<ActionState> {
  const id = formData.get('id')

  await deleteEntity(id as string)

  return {
    success: true,
    message: `Deleted`,
  }
}

export async function syncEntity(prevState: unknown, formData: FormData): Promise<ActionState> {
  const id = formData.get('id')

  try {
    await apiClientBackend.post(`/api/entities/${id}/sync`, {}, { credentials: 'include' })
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
