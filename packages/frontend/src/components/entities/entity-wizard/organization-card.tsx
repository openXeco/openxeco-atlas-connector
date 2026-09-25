import type { CardProps } from '@/components/entities/entity-wizard/types'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectValue, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import type { Taxonomy } from '@/types'

const getCountryById = (id: string, countries: Taxonomy[]): Taxonomy | undefined => {
  return countries.find((c) => c.id === id)
}

export const OrganizationCard = ({
  useFormParams: {
    register,
    formState: { errors },
    setValue,
    watch,
  },
  countries,
  clusterTypes,
}: CardProps) => {
  const formData = watch()

  if (formData.countryId && !formData.countryCode) {
    const country = getCountryById(formData.countryId, countries)
    setValue('countryCode', country?.metadata?.field_iso_code as string)
  }

  return (
    <>
      <div className='space-y-2'>
        <Label htmlFor='FORM-ECCC-001-Q101'>Name (in national language) *</Label>
        <Input id='FORM-ECCC-001-Q101' {...register('nameNational')} placeholder='Enter name in national language' />
        {errors.nameNational && <p className='text-sm text-destructive'>{errors.nameNational.message}</p>}
      </div>

      <div className='space-y-2'>
        <Label htmlFor='FORM-ECCC-001-Q101b'>Name in English *</Label>
        <Input id='FORM-ECCC-001-Q101b' {...register('name')} placeholder='Enter name in English' />
        {errors.name && <p className='text-sm text-destructive'>{errors.name.message}</p>}
      </div>

      <div className='space-y-2'>
        <Label htmlFor='FORM-ECCC-001-Q101c'>Entity / Department (if applicable)</Label>
        <Input id='FORM-ECCC-001-Q101c' {...register('entityDepartment')} placeholder='Department or unit' />
      </div>

      <div className='space-y-2'>
        <Label htmlFor='FORM-ECCC-001-Q102'>Country *</Label>
        <input type={'hidden'} id={'FORM-ECCC-001-Q102'} defaultValue={formData.countryId} />
        <input type={'hidden'} id={'countryCode'} defaultValue={formData.countryCode} />
        <div className={'text-sm text-primary'}>{getCountryById(formData.countryId || '', countries)?.name}</div>
        {errors.countryId && <p className='text-sm text-destructive'>{errors.countryId.message}</p>}
      </div>

      <div className='space-y-2'>
        <Label htmlFor='FORM-ECCC-001-Q103'>
          Street Address (street followed by number, no special characters, no postal code) *
        </Label>
        <Input id='FORM-ECCC-001-Q103' {...register('streetAddress')} placeholder='Street address' />
        {errors.streetAddress && <p className='text-sm text-destructive'>{errors.streetAddress.message}</p>}
      </div>

      <div className='space-y-2'>
        <Label htmlFor='FORM-ECCC-001-Q104'>City *</Label>
        <Input id='FORM-ECCC-001-Q104' {...register('city')} placeholder='City' />
        {errors.city && <p className='text-sm text-destructive'>{errors.city.message}</p>}
      </div>

      <div className='space-y-2'>
        <Label htmlFor='FORM-ECCC-001-Q105'>Company/organization registration number</Label>
        <Input id='FORM-ECCC-001-Q105' {...register('registrationNumber')} placeholder='Registration number' />
      </div>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <div className='space-y-2'>
          <Label htmlFor='FORM-ECCC-001-Q106'>Is this your main seat / headquarter? *</Label>
          <Select
            value={formData.isHeadquarter === true ? 'true' : formData.isHeadquarter === false ? 'false' : ''}
            onValueChange={(value: string) => setValue('isHeadquarter', value === 'true')}
          >
            <SelectTrigger id='FORM-ECCC-001-Q106'>
              <SelectValue placeholder='Select' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='true'>Yes</SelectItem>
              <SelectItem value='false'>No</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {formData.isHeadquarter === false && (
          <div className='space-y-2'>
            <Label htmlFor='FORM-ECCC-001-Q106b'>Main seat / headquarter details *</Label>
            <Input
              id='FORM-ECCC-001-Q106b'
              {...register('headquarterInfo')}
              placeholder='Name and address of main seat'
            />
          </div>
        )}
      </div>

      <div className='space-y-2'>
        <Label htmlFor='FORM-ECCC-001-Q107'>Website *</Label>
        <Input id='FORM-ECCC-001-Q107' {...register('website')} placeholder='https://example.com' type='url' />
        {errors.website && <p className='text-sm text-destructive'>{errors.website.message}</p>}
      </div>

      <div className='space-y-2'>
        <Label htmlFor='FORM-ECCC-001-Q108'>Phone number</Label>
        <Input id='FORM-ECCC-001-Q108' {...register('phone')} placeholder='+49 30 123456' />
      </div>

      <div className='space-y-2'>
        <Label htmlFor='FORM-ECCC-001-Q109'>Email *</Label>
        <Input id='FORM-ECCC-001-Q109' {...register('email')} placeholder='contact@example.org' type='email' />
        {errors.email && <p className='text-sm text-destructive'>{errors.email.message}</p>}
      </div>

      <div className='space-y-2'>
        <Label htmlFor='FORM-ECCC-001-Q110'>Type of organisation (Article 8(3)) *</Label>
        <Select value={formData.clusterTypeId} onValueChange={(value: string) => setValue('clusterTypeId', value)}>
          <SelectTrigger id='FORM-ECCC-001-Q110'>
            <SelectValue placeholder='Select type of organisation' />
          </SelectTrigger>
          <SelectContent>
            {clusterTypes.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.clusterTypeId && <p className='text-sm text-destructive'>{errors.clusterTypeId.message}</p>}
      </div>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <div className='space-y-2'>
          <Label htmlFor='FORM-ECCC-001-Q111'>Has subsidiaries in EU Member States? *</Label>
          <Select
            value={formData.hasSubsidiaries === true ? 'true' : formData.hasSubsidiaries === false ? 'false' : ''}
            onValueChange={(value: string) => setValue('hasSubsidiaries', value === 'true')}
          >
            <SelectTrigger id='FORM-ECCC-001-Q111'>
              <SelectValue placeholder='Select' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='true'>Yes</SelectItem>
              <SelectItem value='false'>No</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {formData.hasSubsidiaries === true && (
          <div className='space-y-2'>
            <Label htmlFor='FORM-ECCC-001-Q111b'>If yes, please specify *</Label>
            <Input id='FORM-ECCC-001-Q111b' {...register('subsidiariesDetails')} placeholder='Subsidiaries details' />
          </div>
        )}
      </div>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <div className='space-y-2'>
          <Label htmlFor='FORM-ECCC-001-Q112'>Holds majority shares outside Member States? *</Label>
          <Select
            value={formData.hasMajorityShares === true ? 'true' : formData.hasMajorityShares === false ? 'false' : ''}
            onValueChange={(value: string) => setValue('hasMajorityShares', value === 'true')}
          >
            <SelectTrigger id='FORM-ECCC-001-Q112'>
              <SelectValue placeholder='Select' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='true'>Yes</SelectItem>
              <SelectItem value='false'>No</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {formData.hasMajorityShares === true && (
          <div className='space-y-2'>
            <Label htmlFor='FORM-ECCC-001-Q112b'>If yes, please specify *</Label>
            <Input
              id='FORM-ECCC-001-Q112b'
              {...register('majoritySharesDetails')}
              placeholder='Majority shares details'
            />
          </div>
        )}
      </div>

      <div className='space-y-2'>
        <Label htmlFor='FORM-ECCC-001-Q113'>Article 138 Compliance *</Label>
        <p className='text-sm text-muted-foreground mb-2'>
          Does your organization comply with the requirements described in Article 136 of the EU Financial Regulation?
        </p>
        <Select
          value={
            formData.article138Compliance === true ? 'true' : formData.article138Compliance === false ? 'false' : ''
          }
          onValueChange={(value: string) => setValue('article138Compliance', value === 'true')}
        >
          <SelectTrigger id='FORM-ECCC-001-Q113'>
            <SelectValue placeholder='Select' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='true'>Yes</SelectItem>
            <SelectItem value='false'>No</SelectItem>
          </SelectContent>
        </Select>
        {errors.article138Compliance && (
          <p className='text-sm text-destructive'>{errors.article138Compliance.message}</p>
        )}
      </div>
    </>
  )
}
