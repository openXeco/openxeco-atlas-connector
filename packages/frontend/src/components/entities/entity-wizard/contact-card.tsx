import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import type { CardProps } from '@/components/entities/entity-wizard/types'

export const ContactCard = ({
  useFormParams: {
    formState: { errors },
    register,
  },
}: CardProps) => {
  return (
    <>
      <div className='space-y-2'>
        <Label htmlFor='FORM-ECCC-001-Q201'>Name (First Name) *</Label>
        <Input id='FORM-ECCC-001-Q201' {...register('contactFirstName')} placeholder='First name' />
        {errors.contactFirstName && <p className='text-sm text-destructive'>{errors.contactFirstName.message}</p>}
      </div>

      <div className='space-y-2'>
        <Label htmlFor='FORM-ECCC-001-Q202'>Surname *</Label>
        <Input id='FORM-ECCC-001-Q202' {...register('contactLastName')} placeholder='Last name' />
        {errors.contactLastName && <p className='text-sm text-destructive'>{errors.contactLastName.message}</p>}
      </div>

      <div className='space-y-2'>
        <Label htmlFor='FORM-ECCC-001-Q203'>Position</Label>
        <Input id='FORM-ECCC-001-Q203' {...register('contactPosition')} placeholder='Position' />
      </div>

      <div className='space-y-2'>
        <Label htmlFor='FORM-ECCC-001-Q205'>Email *</Label>
        <Input id='FORM-ECCC-001-Q205' {...register('contactEmail')} placeholder='contact@example.org' type='email' />
        {errors.contactEmail && <p className='text-sm text-destructive'>{errors.contactEmail.message}</p>}
      </div>

      <div className='space-y-2'>
        <Label htmlFor='FORM-ECCC-001-Q206'>Phone number (direct)</Label>
        <Input id='FORM-ECCC-001-Q206' {...register('contactPhone')} placeholder='Phone number' />
      </div>
    </>
  )
}
