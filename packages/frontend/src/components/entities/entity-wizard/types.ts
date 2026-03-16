import { UseFormReturn } from 'react-hook-form'
import { EntityFormData, EntityTaxonomies } from '@/types'

export type Step = 'organisation' | 'contact' | 'expertise' | 'confirmation'

export type CardProps = {
  useFormParams: UseFormReturn<EntityFormData>
} & EntityTaxonomies

export type ManageEntityState = {
  entity: EntityFormData
  success: boolean
  message: string
}
