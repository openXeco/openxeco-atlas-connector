import type React from 'react'
import type { Step, CardProps } from '@/components/entities/entity-wizard/types'
import { OrganizationCard } from '@/components/entities/entity-wizard/organization-card'
import { ContactCard } from '@/components/entities/entity-wizard/contact-card'
import { ExpertiseCard } from '@/components/entities/entity-wizard/expertise-card'
import { ConfirmationCard } from '@/components/entities/entity-wizard/confirmation-card'

const cards: Record<Step, React.ComponentType<CardProps>> = {
  organisation: OrganizationCard,
  contact: ContactCard,
  expertise: ExpertiseCard,
  confirmation: ConfirmationCard,
}

export const getCard = (step: Step, cardProps: CardProps): React.ReactNode => {
  const Card = cards[step]
  return <Card {...cardProps} />
}
