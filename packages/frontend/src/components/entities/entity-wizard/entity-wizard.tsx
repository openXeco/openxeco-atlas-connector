'use client'

import { startTransition } from 'react'
import { Wizard } from '@/components/ui/wizard'
import { WIZARD_STEPS } from '@/data/entities'
import { EntityTaxonomies } from '@/types'
import { getCard } from '@/components/entities/entity-wizard/entity-wizard-cards'
import { Step, CardProps } from '@/components/entities/entity-wizard/types'

type EntityWizardProps = {
  onCancelAction: () => void
  taxonomies: EntityTaxonomies
  useFormParams: CardProps['useFormParams']
  formAction: (formData: FormData) => void | Promise<void>
  isPending: boolean
  entityId?: string
}

export const EntityWizard = ({
  onCancelAction,
  taxonomies,
  useFormParams,
  formAction,
  isPending,
  entityId,
}: EntityWizardProps) => {

  const onSubmit = useFormParams.handleSubmit(async (data) => {
    // avoid double submit
    if (isPending) {
      return
    }

    const formData = new FormData()

    Object.entries(data).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => formData.append(key, v))
      } else {
        formData.append(key, String(value))
      }
    })

    if (entityId) {
      formData.append('id', String(entityId))
    }

    startTransition(() => {
      formAction(formData)
    })
  })

  return (
    <form>
      {entityId ? <input type={'hidden'} name={'id'} value={entityId} /> : undefined}
      <Wizard
        steps={WIZARD_STEPS.map((s) => ({
          ...s,
          content: getCard(s.id as Step, { ...taxonomies, useFormParams }),
        }))}
        handleCancelAction={onCancelAction}
        handleSubmitAction={onSubmit}
        isPending={isPending}
      />
    </form>
  )
}
