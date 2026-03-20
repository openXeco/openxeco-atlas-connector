import { ConsentCheckbox } from '@/components/entities/consent-checkbox'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import type { EntityFormData } from '@/types'
import type { CardProps } from '@/components/entities/entity-wizard/types'
import { FIELD_LABELS, GDPR_DISCLAIMER } from '@/data/entities'

export const ConfirmationCard = ({
  useFormParams: {
    formState: { errors },
    setValue,
    watch,
  },
  countries,
  fieldsOfActivity,
}: CardProps) => {
  const formData = watch()
  return (
    <div className='space-y-6'>
      {Object.keys(errors).length > 0 && (
        <div className='rounded-lg border border-destructive/50 bg-destructive/5 p-4 space-y-2'>
          <h4 className='text-sm font-semibold text-destructive'>Please fix the following errors before submitting:</h4>
          <ul className='list-disc pl-5 space-y-1'>
            {Object.entries(errors).map(([field, error]) => {
              const label = FIELD_LABELS[field] || field
              return (
                <li key={field} className='text-sm text-destructive'>
                  <span className='font-medium'>{label}</span>:{' '}
                  {(error as { message?: string })?.message || 'Invalid value'}
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <div className='rounded-lg border p-4 space-y-4'>
        <h3 className='text-lg font-semibold'>Review Your Submission</h3>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
          <div>
            <span className='font-medium'>Organisation Name:</span> {formData.name}
          </div>
          <div>
            <span className='font-medium'>National Name:</span> {formData.nameNational}
          </div>
          <div>
            <span className='font-medium'>Country:</span>{' '}
            {countries.find((c) => c.id === formData.countryId)?.name || formData.countryCode}
          </div>
          <div>
            <span className='font-medium'>City:</span> {formData.city}
          </div>
          <div>
            <span className='font-medium'>Email:</span> {formData.email}
          </div>
          <div>
            <span className='font-medium'>Website:</span> {formData.website}
          </div>
          <div>
            <span className='font-medium'>Contact:</span> {formData.contactFirstName} {formData.contactLastName}
          </div>
          <div>
            <span className='font-medium'>Contact Email:</span> {formData.contactEmail}
          </div>
          <div className='col-span-2'>
            <span className='font-medium'>Fields of Activity:</span>{' '}
            {(formData.fieldsOfActivityIds || [])
              .map((id) => fieldsOfActivity.find((f) => f.id === id)?.name)
              .filter(Boolean)
              .join(', ') || 'None selected'}
          </div>
        </div>
      </div>

      <ConsentCheckbox
        id='FORM-ECCC-001-Q114'
        label='I accept the Confidentiality and Data Protection Notes'
        description={GDPR_DISCLAIMER}
        checked={formData.dataProtectionConsent || false}
        onCheckedChange={(checked) => setValue('dataProtectionConsent', checked)}
        required
        error={errors.dataProtectionConsent?.message}
      />

      <ConsentCheckbox
        id='FORM-ECCC-001-Q114b'
        label='I agree that the data provided may be shared with the ECCC and other NCCs'
        checked={formData.dataShareConsent || false}
        onCheckedChange={(checked) => setValue('dataShareConsent', checked)}
        error={errors.dataShareConsent?.message}
      />

      <ConsentCheckbox
        id='FORM-ECCC-001-Q501'
        label='I have finished filling the form and accept the answers to be reviewed by the NCC'
        checked={formData.formCompletionConfirmed || false}
        onCheckedChange={(checked) => setValue('formCompletionConfirmed', checked)}
        required
        error={errors.formCompletionConfirmed?.message}
      />

      <div className='space-y-2'>
        <Label htmlFor='moderationState'>Submission Status</Label>
        <Select
          value={formData.moderationState || 'draft'}
          onValueChange={(value: string) => setValue('moderationState', value as EntityFormData['moderationState'])}
        >
          <SelectTrigger>
            <SelectValue placeholder='Select status' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='draft'>Draft (Save for later)</SelectItem>
            <SelectItem value='ready_for_publication'>Ready for Publication (Submit for review)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
