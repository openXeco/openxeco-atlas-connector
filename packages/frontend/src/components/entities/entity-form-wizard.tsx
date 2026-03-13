'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronRight, ChevronLeft, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MultiSelect } from '@/components/ui/multi-select'
import { ConsentCheckbox } from '@/components/entities/consent-checkbox'
import { apiClient } from '@/lib/api'
import type { Taxonomy, EntityFormData } from '@/types'

const entitySchema = z.object({
  // Step 1: Organisation
  atlasId: z.string().uuid().optional(),
  nameNational: z.string().min(1, 'National name is required').max(400),
  name: z.string().min(1, 'Name is required').max(400),
  entityDepartment: z.string().max(400).optional(),
  countryId: z.string().uuid('Select a country'),
  countryCode: z.string().length(2, 'Use ISO-3166 alpha-2 code').optional(),
  streetAddress: z.string().min(1, 'Street address is required').max(400),
  city: z.string().min(1, 'City is required').max(400),
  postalCode: z.string().max(20).optional(),
  registrationNumber: z.string().max(100).optional(),
  isHeadquarter: z.boolean().optional(),
  headquarterInfo: z.string().optional(),
  website: z.string().url('Invalid URL'),
  phone: z.string().max(50).optional(),
  email: z.string().email('Invalid email'),
  clusterTypeId: z.string().uuid('Select a type of organisation'),
  hasSubsidiaries: z.boolean().optional(),
  subsidiariesDetails: z.string().optional(),
  hasMajorityShares: z.boolean().optional(),
  majoritySharesDetails: z.string().optional(),
  article138Compliance: z.boolean(),

  // Step 2: Contact Person
  contactFirstName: z.string().min(1, 'First name is required').max(400),
  contactLastName: z.string().min(1, 'Last name is required').max(400),
  contactPosition: z.string().max(400).optional(),
  contactEmail: z.string().email('Invalid contact email'),
  contactPhone: z.string().max(50).optional(),

  // Step 3: Expertise/Taxonomy
  fieldsOfActivityIds: z.array(z.string().uuid()).min(1, 'Select at least one field of activity'),
  expertiseDescription: z.string().min(1, 'Expertise description is required').max(800),
  thematicAreaIds: z.array(z.string().uuid()).optional(),
  sectorIds: z.array(z.string().uuid()).optional(),
  technologyIds: z.array(z.string().uuid()).optional(),
  useCaseIds: z.array(z.string().uuid()).optional(),
  goalsToAchieve: z.string().max(800).optional(),
  goalsToContribute: z.string().max(800).optional(),

  // Step 4: Disclaimer & Confirmation
  dataProtectionConsent: z.boolean(),
  formCompletionConfirmed: z.boolean(),

  // Additional fields (not in form steps but needed)
  description: z.string().optional(),
  dataShareConsent: z.boolean().optional(),
  moderationState: z.enum(['draft', 'ready_for_publication', 'to_be_rejected']).optional(),
})

interface EntityFormWizardProps {
  initialData?: Partial<EntityFormData>
  onSubmit: (data: EntityFormData) => Promise<void>
  onCancel: () => void
}

type Step = 'organisation' | 'contact' | 'expertise' | 'confirmation'

const steps: { id: Step; title: string; description: string }[] = [
  { id: 'organisation', title: 'Organisation', description: 'Organisation details and address' },
  { id: 'contact', title: 'Contact Person', description: 'Representative information' },
  { id: 'expertise', title: 'Expertise/Taxonomy', description: 'Fields of activity and expertise' },
  { id: 'confirmation', title: 'Disclaimer & Confirmation', description: 'Review and consent' },
]

const GDPR_DISCLAIMER = `<p>The NCC, to which the application will be submitted, will process personal data in accordance with the Regulation (EU) 2016/679 (GDPR) and the ECCC will process personal data in accordance with the Regulation (EU) 2018/1725 (EUDPR). The legal basis for the processing operation is art. 6(1)(e) GDPR and art. 5(1)(a) EUDPR on the basis of articles 7 and 8 of Regulation (EU) 2021/887.</p>
<p>Additional information on the personal data processed, possible processors and retention periods will be specified in the relevant Data Protection Notices.</p>
<p>The entity hereby confirms that all information provided in the registration form is truthful and accurate.</p>
<p>The entity acknowledges and hereby agrees that the information provided in the registration process will be shared only with the ECCC and other NCCs established by each Member State and will not be shared further.</p>
<p>The entity acknowledges and hereby agrees that the following information will be publicly available on the websites of the ECCC and NCCs established by each Member State in line with the Regulation:</p>
<ul>
<li>name</li>
<li>country of establishment</li>
<li>website</li>
<li>type of organization as foreseen in art. 8 para 2 of the Regulation</li>
<li>fields of activity/expertise</li>
</ul>`

const FIELD_LABELS: Record<string, string> = {
  name: 'Name in English',
  nameNational: 'Name (national language)',
  countryId: 'Country',
  streetAddress: 'Street Address',
  city: 'City',
  website: 'Website',
  email: 'Email',
  clusterTypeId: 'Type of organisation',
  article138Compliance: 'Article 138 Compliance',
  contactFirstName: 'Contact First Name',
  contactLastName: 'Contact Surname',
  contactEmail: 'Contact Email',
  fieldsOfActivityIds: 'Fields of Activity',
  expertiseDescription: 'Expertise Description',
  dataProtectionConsent: 'Data Protection Consent',
  formCompletionConfirmed: 'Form Completion Confirmation',
}

export function EntityFormWizard({ initialData, onSubmit, onCancel }: EntityFormWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>('organisation')
  const [submitting, setSubmitting] = useState(false)
  const [countries, setCountries] = useState<Taxonomy[]>([])
  const [clusterTypes, setClusterTypes] = useState<Taxonomy[]>([])
  const [fieldsOfActivity, setFieldsOfActivity] = useState<Taxonomy[]>([])
  const [thematicAreas, setThematicAreas] = useState<Taxonomy[]>([])
  const [sectors, setSectors] = useState<Taxonomy[]>([])
  const [technologies, setTechnologies] = useState<Taxonomy[]>([])
  const [useCases, setUseCases] = useState<Taxonomy[]>([])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<EntityFormData>({
    resolver: zodResolver(entitySchema),
    defaultValues: {
      fieldsOfActivityIds: [],
      thematicAreaIds: [],
      sectorIds: [],
      technologyIds: [],
      useCaseIds: [],
      dataProtectionConsent: false,
      formCompletionConfirmed: false,
      ...initialData,
    },
  })

  useEffect(() => {
    const loadTaxonomies = async () => {
      try {
        const [countriesRes, clusterTypeRes, fieldsRes, thematicRes, sectorsRes, techRes, useCasesRes] =
          await Promise.all([
            apiClient.get<{ data: Taxonomy[] }>('/api/taxonomies/country'),
            apiClient.get<{ data: Taxonomy[] }>('/api/taxonomies/cluster_type'),
            apiClient.get<{ data: Taxonomy[] }>('/api/taxonomies/fields_of_activity'),
            apiClient.get<{ data: Taxonomy[] }>('/api/taxonomies/cluster_thematic_area'),
            apiClient.get<{ data: Taxonomy[] }>('/api/taxonomies/sectors'),
            apiClient.get<{ data: Taxonomy[] }>('/api/taxonomies/technologies'),
            apiClient.get<{ data: Taxonomy[] }>('/api/taxonomies/use_cases'),
          ])
        setCountries(countriesRes.data)
        setClusterTypes(clusterTypeRes.data)
        setFieldsOfActivity(fieldsRes.data)
        setThematicAreas(thematicRes.data)
        setSectors(sectorsRes.data)
        setTechnologies(techRes.data)
        setUseCases(useCasesRes.data)
      } catch (error) {
        console.error('Failed to load taxonomies:', error)
      }
    }
    loadTaxonomies()
  }, [])

  const formData = watch()
  const currentStepIndex = steps.findIndex((s) => s.id === currentStep)

  const handleNext = async () => {
    if (currentStepIndex < steps.length - 1) {
      const nextStep = steps[currentStepIndex + 1]
      // Trigger validation when navigating to confirmation step
      if (nextStep.id === 'confirmation') {
        await trigger()
      }
      setCurrentStep(nextStep.id)
    }
  }

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1].id)
    }
  }

  const onFormSubmit = async (data: EntityFormData) => {
    setSubmitting(true)
    try {
      await onSubmit(data)
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const _handleImportData = (importedData: Partial<EntityFormData>) => {
    // Apply imported data to form fields
    Object.entries(importedData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        setValue(key as keyof EntityFormData, value as EntityFormData[keyof EntityFormData])
      }
    })
    // Reset to first step after import
    setCurrentStep('organisation')
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* @TODO hidden for now. */}
      {/* Import button - only show when creating new entity */}
      {/*{!initialData?.name && (*/}
      {/*  <div className="mb-6 flex justify-end">*/}
      {/*    <ImportOpenXecoDialog onImport={handleImportData} />*/}
      {/*  </div>*/}
      {/*)}*/}
      <div className="mb-8 flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                  index <= currentStepIndex
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-muted bg-background text-muted-foreground'
                }`}
              >
                {index < currentStepIndex ? <Check className="h-5 w-5" /> : <span>{index + 1}</span>}
              </div>
              <div className="mt-2 text-center">
                <div className="text-sm font-medium">{step.title}</div>
                <div className="text-xs text-muted-foreground">{step.description}</div>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className={`mx-4 h-0.5 flex-1 ${index < currentStepIndex ? 'bg-primary' : 'bg-muted'}`} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} onKeyDown={(e) => {
        const target = e.target as HTMLElement
        if (e.key === 'Enter' && currentStep !== 'confirmation' && target.tagName !== 'TEXTAREA') {
          e.preventDefault()
        }
      }}>
        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStepIndex].title}</CardTitle>
            <CardDescription>{steps[currentStepIndex].description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Organisation */}
            {currentStep === 'organisation' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="FORM-ECCC-001-Q101">Name (in national language) *</Label>
                  <Input
                    id="FORM-ECCC-001-Q101"
                    {...register('nameNational')}
                    placeholder="Enter name in national language"
                  />
                  {errors.nameNational && <p className="text-sm text-destructive">{errors.nameNational.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="FORM-ECCC-001-Q101b">Name in English *</Label>
                  <Input id="FORM-ECCC-001-Q101b" {...register('name')} placeholder="Enter name in English" />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="FORM-ECCC-001-Q101c">Entity / Department (if applicable)</Label>
                  <Input id="FORM-ECCC-001-Q101c" {...register('entityDepartment')} placeholder="Department or unit" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="FORM-ECCC-001-Q102">Country *</Label>
                  <Select
                    value={formData.countryId}
                    onValueChange={(value: string) => {
                      setValue('countryId', value)
                      const selectedCountry = countries.find((c) => c.id === value)
                      if (selectedCountry) {
                        const meta = selectedCountry.metadata as { field_iso_code?: string } | null
                        if (meta?.field_iso_code) {
                          setValue('countryCode', meta.field_iso_code)
                        }
                      }
                    }}
                  >
                    <SelectTrigger id="FORM-ECCC-001-Q102">
                      <SelectValue placeholder="Select a country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.id} value={country.id}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.countryId && <p className="text-sm text-destructive">{errors.countryId.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="FORM-ECCC-001-Q103">Street Address *</Label>
                  <Input id="FORM-ECCC-001-Q103" {...register('streetAddress')} placeholder="Street address" />
                  {errors.streetAddress && <p className="text-sm text-destructive">{errors.streetAddress.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="FORM-ECCC-001-Q104">City *</Label>
                  <Input id="FORM-ECCC-001-Q104" {...register('city')} placeholder="City" />
                  {errors.city && <p className="text-sm text-destructive">{errors.city.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="FORM-ECCC-001-Q105">Company/organization registration number</Label>
                  <Input
                    id="FORM-ECCC-001-Q105"
                    {...register('registrationNumber')}
                    placeholder="Registration number"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="FORM-ECCC-001-Q106">Is this your main seat / headquarter? *</Label>
                    <Select
                      value={formData.isHeadquarter === true ? 'true' : formData.isHeadquarter === false ? 'false' : ''}
                      onValueChange={(value: string) => setValue('isHeadquarter', value === 'true')}
                    >
                      <SelectTrigger id="FORM-ECCC-001-Q106">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.isHeadquarter === false && (
                    <div className="space-y-2">
                      <Label htmlFor="FORM-ECCC-001-Q106b">Main seat / headquarter details *</Label>
                      <Input
                        id="FORM-ECCC-001-Q106b"
                        {...register('headquarterInfo')}
                        placeholder="Name and address of main seat"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="FORM-ECCC-001-Q107">Website *</Label>
                  <Input
                    id="FORM-ECCC-001-Q107"
                    {...register('website')}
                    placeholder="https://example.com"
                    type="url"
                  />
                  {errors.website && <p className="text-sm text-destructive">{errors.website.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="FORM-ECCC-001-Q108">Phone number</Label>
                  <Input id="FORM-ECCC-001-Q108" {...register('phone')} placeholder="+49 30 123456" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="FORM-ECCC-001-Q109">Email *</Label>
                  <Input
                    id="FORM-ECCC-001-Q109"
                    {...register('email')}
                    placeholder="contact@example.org"
                    type="email"
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="FORM-ECCC-001-Q110">Type of organisation (Article 8(3)) *</Label>
                  <Select
                    value={formData.clusterTypeId}
                    onValueChange={(value: string) => setValue('clusterTypeId', value)}
                  >
                    <SelectTrigger id="FORM-ECCC-001-Q110">
                      <SelectValue placeholder="Select type of organisation" />
                    </SelectTrigger>
                    <SelectContent>
                      {clusterTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.clusterTypeId && <p className="text-sm text-destructive">{errors.clusterTypeId.message}</p>}
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="FORM-ECCC-001-Q111">Has subsidiaries in EU Member States? *</Label>
                    <Select
                      value={
                        formData.hasSubsidiaries === true ? 'true' : formData.hasSubsidiaries === false ? 'false' : ''
                      }
                      onValueChange={(value: string) => setValue('hasSubsidiaries', value === 'true')}
                    >
                      <SelectTrigger id="FORM-ECCC-001-Q111">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.hasSubsidiaries === true && (
                    <div className="space-y-2">
                      <Label htmlFor="FORM-ECCC-001-Q111b">If yes, please specify *</Label>
                      <Input
                        id="FORM-ECCC-001-Q111b"
                        {...register('subsidiariesDetails')}
                        placeholder="Subsidiaries details"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="FORM-ECCC-001-Q112">Holds majority shares outside Member States? *</Label>
                    <Select
                      value={
                        formData.hasMajorityShares === true
                          ? 'true'
                          : formData.hasMajorityShares === false
                            ? 'false'
                            : ''
                      }
                      onValueChange={(value: string) => setValue('hasMajorityShares', value === 'true')}
                    >
                      <SelectTrigger id="FORM-ECCC-001-Q112">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.hasMajorityShares === true && (
                    <div className="space-y-2">
                      <Label htmlFor="FORM-ECCC-001-Q112b">If yes, please specify *</Label>
                      <Input
                        id="FORM-ECCC-001-Q112b"
                        {...register('majoritySharesDetails')}
                        placeholder="Majority shares details"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="FORM-ECCC-001-Q113">Article 138 Compliance *</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Does your organization comply with the requirements described in Article 136 of the EU Financial
                    Regulation?
                  </p>
                  <Select
                    value={
                      formData.article138Compliance === true
                        ? 'true'
                        : formData.article138Compliance === false
                          ? 'false'
                          : ''
                    }
                    onValueChange={(value: string) => setValue('article138Compliance', value === 'true')}
                  >
                    <SelectTrigger id="FORM-ECCC-001-Q113">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.article138Compliance && (
                    <p className="text-sm text-destructive">{errors.article138Compliance.message}</p>
                  )}
                </div>
              </>
            )}

            {/* Step 2: Contact Person */}
            {currentStep === 'contact' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="FORM-ECCC-001-Q201">Name (First Name) *</Label>
                  <Input id="FORM-ECCC-001-Q201" {...register('contactFirstName')} placeholder="First name" />
                  {errors.contactFirstName && (
                    <p className="text-sm text-destructive">{errors.contactFirstName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="FORM-ECCC-001-Q202">Surname *</Label>
                  <Input id="FORM-ECCC-001-Q202" {...register('contactLastName')} placeholder="Last name" />
                  {errors.contactLastName && (
                    <p className="text-sm text-destructive">{errors.contactLastName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="FORM-ECCC-001-Q203">Position</Label>
                  <Input id="FORM-ECCC-001-Q203" {...register('contactPosition')} placeholder="Position" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="FORM-ECCC-001-Q205">Email *</Label>
                  <Input
                    id="FORM-ECCC-001-Q205"
                    {...register('contactEmail')}
                    placeholder="contact@example.org"
                    type="email"
                  />
                  {errors.contactEmail && <p className="text-sm text-destructive">{errors.contactEmail.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="FORM-ECCC-001-Q206">Phone number (direct)</Label>
                  <Input id="FORM-ECCC-001-Q206" {...register('contactPhone')} placeholder="Phone number" />
                </div>
              </>
            )}

            {/* Step 3: Expertise/Taxonomy */}
            {currentStep === 'expertise' && (
              <>
                <div className="space-y-2" id="FORM-ECCC-001-Q301-container">
                  <Label htmlFor="FORM-ECCC-001-Q301">Fields of Activity (Article 8(3)) *</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Your organization&apos;s expertise in the field of cybersecurity according to Article 8(3) of
                    Regulation (EU) 2021/887.
                  </p>
                  <MultiSelect
                    options={fieldsOfActivity.map((f) => ({ id: f.id, name: f.name }))}
                    value={formData.fieldsOfActivityIds || []}
                    onChange={(values) => setValue('fieldsOfActivityIds', values)}
                    placeholder="Select fields of activity"
                  />
                  {errors.fieldsOfActivityIds && (
                    <p className="text-sm text-destructive">{errors.fieldsOfActivityIds.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="FORM-ECCC-001-Q302">Expertise - detailed description *</Label>
                  <Textarea
                    id="FORM-ECCC-001-Q302"
                    {...register('expertiseDescription')}
                    placeholder="Describe your expertise (max 800 characters)"
                    rows={4}
                    maxLength={800}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.expertiseDescription?.length || 0}/800 characters
                  </p>
                  {errors.expertiseDescription && (
                    <p className="text-sm text-destructive">{errors.expertiseDescription.message}</p>
                  )}
                </div>

                <div className="space-y-2" id="FORM-ECCC-001-Q303-1-container">
                  <Label htmlFor="FORM-ECCC-001-Q303-1">
                    Expertise according to the Cybersecurity Taxonomy (Knowledge Domains)
                  </Label>
                  <MultiSelect
                    options={thematicAreas.map((t) => ({
                      id: t.id,
                      name: t.name,
                      parentId: t.parentId,
                      atlasId: t.atlasId,
                    }))}
                    value={formData.thematicAreaIds || []}
                    onChange={(values) => setValue('thematicAreaIds', values)}
                    placeholder="Select knowledge domains"
                    hierarchical
                  />
                </div>

                <div className="space-y-2" id="FORM-ECCC-001-Q303-3-container">
                  <Label htmlFor="FORM-ECCC-001-Q303-3">Sectors according to the Cybersecurity Taxonomy</Label>
                  <MultiSelect
                    options={sectors.map((s) => ({ id: s.id, name: s.name }))}
                    value={formData.sectorIds || []}
                    onChange={(values) => setValue('sectorIds', values)}
                    placeholder="Select sectors"
                  />
                </div>

                <div className="space-y-2" id="FORM-ECCC-001-Q303-5-container">
                  <Label htmlFor="FORM-ECCC-001-Q303-5">Technologies according to the Cybersecurity Taxonomy</Label>
                  <MultiSelect
                    options={technologies.map((t) => ({ id: t.id, name: t.name }))}
                    value={formData.technologyIds || []}
                    onChange={(values) => setValue('technologyIds', values)}
                    placeholder="Select technologies"
                  />
                </div>

                <div className="space-y-2" id="FORM-ECCC-001-Q303-7-container">
                  <Label htmlFor="FORM-ECCC-001-Q303-7">Use cases according to the Cybersecurity Taxonomy</Label>
                  <MultiSelect
                    options={useCases.map((u) => ({ id: u.id, name: u.name }))}
                    value={formData.useCaseIds || []}
                    onChange={(values) => setValue('useCaseIds', values)}
                    placeholder="Select use cases"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="FORM-ECCC-001-Q303-2">What do you seek to achieve by joining the community?</Label>
                  <Textarea
                    id="FORM-ECCC-001-Q303-2"
                    {...register('goalsToAchieve')}
                    placeholder="Goals to achieve"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="FORM-ECCC-001-Q305">
                    How and in which goals and tasks of the community can you contribute?
                  </Label>
                  <Textarea
                    id="FORM-ECCC-001-Q305"
                    {...register('goalsToContribute')}
                    placeholder="Goals to contribute"
                    rows={3}
                  />
                </div>
              </>
            )}

            {/* Step 4: Disclaimer & Confirmation */}
            {currentStep === 'confirmation' && (
              <>
                <div className="space-y-6">
                  {Object.keys(errors).length > 0 && (
                    <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 space-y-2">
                      <h4 className="text-sm font-semibold text-destructive">
                        Please fix the following errors before submitting:
                      </h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {Object.entries(errors).map(([field, error]) => {
                          const label = FIELD_LABELS[field] || field
                          return (
                            <li key={field} className="text-sm text-destructive">
                              <span className="font-medium">{label}</span>:{' '}
                              {(error as { message?: string })?.message || 'Invalid value'}
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )}

                  <div className="rounded-lg border p-4 space-y-4">
                    <h3 className="text-lg font-semibold">Review Your Submission</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Organisation Name:</span> {formData.name}
                      </div>
                      <div>
                        <span className="font-medium">National Name:</span> {formData.nameNational}
                      </div>
                      <div>
                        <span className="font-medium">Country:</span>{' '}
                        {countries.find((c) => c.id === formData.countryId)?.name || formData.countryCode}
                      </div>
                      <div>
                        <span className="font-medium">City:</span> {formData.city}
                      </div>
                      <div>
                        <span className="font-medium">Email:</span> {formData.email}
                      </div>
                      <div>
                        <span className="font-medium">Website:</span> {formData.website}
                      </div>
                      <div>
                        <span className="font-medium">Contact:</span> {formData.contactFirstName}{' '}
                        {formData.contactLastName}
                      </div>
                      <div>
                        <span className="font-medium">Contact Email:</span> {formData.contactEmail}
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium">Fields of Activity:</span>{' '}
                        {(formData.fieldsOfActivityIds || [])
                          .map((id) => fieldsOfActivity.find((f) => f.id === id)?.name)
                          .filter(Boolean)
                          .join(', ') || 'None selected'}
                      </div>
                    </div>
                  </div>

                  <ConsentCheckbox
                    id="FORM-ECCC-001-Q114"
                    label="I accept the Confidentiality and Data Protection Notes"
                    description={GDPR_DISCLAIMER}
                    checked={formData.dataProtectionConsent || false}
                    onCheckedChange={(checked) => setValue('dataProtectionConsent', checked)}
                    required
                    error={errors.dataProtectionConsent?.message}
                  />

                  <ConsentCheckbox
                    id="FORM-ECCC-001-Q114b"
                    label="I agree that the data provided may be shared with the ECCC and other NCCs"
                    checked={formData.dataShareConsent || false}
                    onCheckedChange={(checked) => setValue('dataShareConsent', checked)}
                    error={errors.dataShareConsent?.message}
                  />

                  <ConsentCheckbox
                    id="FORM-ECCC-001-Q501"
                    label="I have finished filling the form and accept the answers to be reviewed by the NCC"
                    checked={formData.formCompletionConfirmed || false}
                    onCheckedChange={(checked) => setValue('formCompletionConfirmed', checked)}
                    required
                    error={errors.formCompletionConfirmed?.message}
                  />

                  <div className="space-y-2">
                    <Label htmlFor="moderationState">Submission Status</Label>
                    <Select
                      value={formData.moderationState || 'draft'}
                      onValueChange={(value: string) =>
                        setValue('moderationState', value as EntityFormData['moderationState'])
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft (Save for later)</SelectItem>
                        <SelectItem value="ready_for_publication">Ready for Publication (Submit for review)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-between">
          <div>
            {currentStepIndex > 0 && (
              <Button type="button" variant="outline" onClick={handlePrevious}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            {currentStepIndex < steps.length - 1 ? (
              <Button type="button" onClick={handleNext}>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit'}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
