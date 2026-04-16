'use client'

import type { EntityTaxonomies, EntityFormData } from '@/types'
import { EntityWizard, type ManageEntityState } from '@/components/entities/entity-wizard'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useActionState, useEffect } from 'react'
import { createEntity } from '@/app/actions/entities'
import { Message } from '@/components/ui/message'

import { entitySchema } from '@/schema'
import { SettingsCheck } from '@/components/dashboard/settings-check'

export const CreateEntity = ({
  taxonomies,
  defaultCountry,
}: {
  taxonomies: EntityTaxonomies
  defaultCountry?: string
}) => {
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
      countryId: defaultCountry,
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
      <div className={'pt-2 pb-6 w-3/5 m-auto'}>
        <SettingsCheck />
      </div>

      {state?.success === false && (
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
