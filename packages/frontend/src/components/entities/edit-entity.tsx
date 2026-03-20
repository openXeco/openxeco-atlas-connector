'use client'

import type { Entity, EntityTaxonomies, EntityFormData } from '@/types'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { type ManageEntityState, EntityWizard } from '@/components/entities/entity-wizard'
import { useForm } from 'react-hook-form'
import { entityToForm } from '@/data/entities'
import { useActionState, useEffect } from 'react'
import { updateEntity } from '@/app/actions/entities'
import { Message } from '@/components/ui/message'
import { entitySchema } from '@/schema'

type EditEntityProps = {
  id: string
  entity: Entity
  taxonomies: EntityTaxonomies
}

export const EditEntity = ({ id, entity, taxonomies }: EditEntityProps) => {
  const router = useRouter()

  const useFormParams = useForm<EntityFormData>({
    resolver: zodResolver(entitySchema),
    defaultValues: {
      fieldsOfActivityIds: [],
      thematicAreaIds: [],
      sectorIds: [],
      technologyIds: [],
      useCaseIds: [],
      dataProtectionConsent: false,
      formCompletionConfirmed: false,
      ...entityToForm(entity),
    },
  })

  const [state, formAction, pending] = useActionState<ManageEntityState | null, FormData>(updateEntity, null)

  useEffect(() => {
    if (state?.success) {
      router.push('/entities')
    }
  }, [state, router])

  return (
    <>
      {state?.success === false && (
        <div className={'pt-2 pb-6 w-3/5 m-auto'}>
          <Message message={'Error while updating the entity. Please check the logs'} success={false} duration={99} />
        </div>
      )}
      <EntityWizard
        onCancelAction={() => {
          router.push('/entities')
        }}
        taxonomies={taxonomies}
        useFormParams={useFormParams}
        formAction={formAction}
        isPending={pending}
        entityId={id}
      />
    </>
  )
}
