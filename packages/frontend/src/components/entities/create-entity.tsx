'use client'

import { EntityTaxonomies, EntityFormData } from '@/types'
import { EntityWizard, entitySchema, ManageEntityState } from '@/components/entities/entity-wizard'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useActionState, useEffect } from 'react'
import { createEntity } from '@/app/actions/entities'
import { Message } from '@/components/ui/message'

export const CreateEntity = ({ taxonomies }: { taxonomies: EntityTaxonomies }) => {
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
    },
  })

  const [state, formAction, pending] = useActionState<ManageEntityState | null, FormData>(createEntity, null)

  useEffect(() => {
    if (state?.success) {
      router.push('/entities')
    }
  }, [state, router])

  return (
    <>
      { state?.success === false && (
        <div className={'pt-2 pb-6 w-3/5 m-auto'}>
          <Message message={'Error while creating entity. Please check the logs'} success={false} duration={99} />
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
      />
    </>
  )
}
