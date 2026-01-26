'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiClient } from '@/lib/api';
import type { EntityFormData } from '@/types/entity';
import type { Taxonomy } from '@/types/taxonomy';

const entitySchema = z.object({
  name: z.string().min(1, 'Name is required').max(500),
  nameNational: z.string().min(1, 'National name is required').max(400),
  entityDepartment: z.string().max(400).optional(),
  description: z.string().optional(),
  email: z.string().email('Invalid email'),
  website: z.string().url('Invalid URL'),
  logoUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  countryCode: z.string().length(2, 'Use ISO-3166 alpha-2 code'),
  city: z.string().min(1, 'City is required').max(400),
  streetAddress: z.string().min(1, 'Street address is required').max(400),
  postalCode: z.string().max(20).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  countryId: z.string().uuid().optional(),
  clusterTypeId: z.string().uuid('Select a cluster type'),
  organizationTypeId: z.string().uuid().optional(),
  contactFirstName: z.string().min(1, 'Contact first name is required').max(400),
  contactLastName: z.string().min(1, 'Contact last name is required').max(400),
  contactEmail: z.string().email('Invalid contact email'),
  contactPosition: z.string().max(400).optional(),
  contactPhone: z.string().max(50).optional(),
  article138Compliance: z.boolean(),
  dataShareConsent: z.boolean(),
  expertiseDescription: z.string().min(1, 'Expertise description is required').max(800),
  goalsToAchieve: z.string().max(800).optional(),
  goalsToContribute: z.string().max(800).optional(),
  fieldsOfActivityIds: z.array(z.string().uuid()).min(1, 'Select a field of activity'),
  thematicAreaIds: z.array(z.string().uuid()).optional(),
  sectorIds: z.array(z.string().uuid()).optional(),
  technologyIds: z.array(z.string().uuid()).optional(),
  useCaseIds: z.array(z.string().uuid()).optional(),
  isHeadquarter: z.boolean().optional(),
  headquarterInfo: z.string().optional(),
  hasSubsidiaries: z.boolean().optional(),
  subsidiariesDetails: z.string().optional(),
  hasMajorityShares: z.boolean().optional(),
  majoritySharesDetails: z.string().optional(),
  moderationState: z.enum(['draft', 'ready_for_publication', 'to_be_rejected']).optional(),
});

interface EntityFormWizardProps {
  initialData?: Partial<EntityFormData>;
  onSubmit: (data: EntityFormData) => Promise<void>;
  onCancel: () => void;
}

type Step = 'basic' | 'location' | 'classification' | 'compliance' | 'review';

const steps: { id: Step; title: string; description: string }[] = [
  { id: 'basic', title: 'Basic Information', description: 'Organization and contact details' },
  { id: 'location', title: 'Location', description: 'Structured address and coordinates' },
  { id: 'classification', title: 'Classification', description: 'Types and taxonomies' },
  { id: 'compliance', title: 'Compliance & Expertise', description: 'Compliance and expertise fields' },
  { id: 'review', title: 'Review', description: 'Review and submit' },
];

export function EntityFormWizard({ initialData, onSubmit, onCancel }: EntityFormWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>('basic');
  const [submitting, setSubmitting] = useState(false);
  const [countries, setCountries] = useState<Taxonomy[]>([]);
  const [clusterTypes, setClusterTypes] = useState<Taxonomy[]>([]);
  const [organizationTypes, setOrganizationTypes] = useState<Taxonomy[]>([]);
  const [fieldsOfActivity, setFieldsOfActivity] = useState<Taxonomy[]>([]);
  const [thematicAreas, setThematicAreas] = useState<Taxonomy[]>([]);
  const [sectors, setSectors] = useState<Taxonomy[]>([]);
  const [technologies, setTechnologies] = useState<Taxonomy[]>([]);
  const [useCases, setUseCases] = useState<Taxonomy[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EntityFormData>({
    resolver: zodResolver(entitySchema),
    defaultValues: initialData || {},
  });

  useEffect(() => {
    const loadTaxonomies = async () => {
      try {
        const [
          countriesRes,
          typesRes,
          orgRes,
          fieldsRes,
          thematicRes,
          sectorsRes,
          techRes,
          useCasesRes,
        ] = await Promise.all([
          apiClient.get<{ data: Taxonomy[] }>('/api/taxonomies/country'),
          apiClient.get<{ data: Taxonomy[] }>('/api/taxonomies/cluster_type'),
          apiClient.get<{ data: Taxonomy[] }>('/api/taxonomies/organization_type'),
          apiClient.get<{ data: Taxonomy[] }>('/api/taxonomies/fields_of_activity'),
          apiClient.get<{ data: Taxonomy[] }>('/api/taxonomies/cluster_thematic_area'),
          apiClient.get<{ data: Taxonomy[] }>('/api/taxonomies/sectors'),
          apiClient.get<{ data: Taxonomy[] }>('/api/taxonomies/technologies'),
          apiClient.get<{ data: Taxonomy[] }>('/api/taxonomies/use_cases'),
        ]);
        setCountries(countriesRes.data);
        setClusterTypes(typesRes.data);
        setOrganizationTypes(orgRes.data);
        setFieldsOfActivity(fieldsRes.data);
        setThematicAreas(thematicRes.data);
        setSectors(sectorsRes.data);
        setTechnologies(techRes.data);
        setUseCases(useCasesRes.data);
      } catch (error) {
        console.error('Failed to load taxonomies:', error);
      }
    };
    loadTaxonomies();
  }, []);

  const formData = watch();
  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1].id);
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1].id);
    }
  };

  const onFormSubmit = async (data: EntityFormData) => {
    setSubmitting(true);
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
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
                {index < currentStepIndex ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <div className="mt-2 text-center">
                <div className="text-sm font-medium">{step.title}</div>
                <div className="text-xs text-muted-foreground">{step.description}</div>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`mx-4 h-0.5 flex-1 ${
                  index < currentStepIndex ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStepIndex].title}</CardTitle>
            <CardDescription>{steps[currentStepIndex].description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentStep === 'basic' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="Enter entity name"
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nameNational">Name (National Language) *</Label>
                  <Input
                    id="nameNational"
                    {...register('nameNational')}
                    placeholder="Enter national language name"
                  />
                  {errors.nameNational && (
                    <p className="text-sm text-destructive">{errors.nameNational.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="entityDepartment">Department</Label>
                  <Input
                    id="entityDepartment"
                    {...register('entityDepartment')}
                    placeholder="Department or unit"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    placeholder="Enter entity description"
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Organization Email *</Label>
                  <Input
                    id="email"
                    {...register('email')}
                    placeholder="contact@example.org"
                    type="email"
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Organization Phone</Label>
                  <Input
                    id="phone"
                    {...register('phone')}
                    placeholder="+49 30 123456"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website *</Label>
                  <Input
                    id="website"
                    {...register('website')}
                    placeholder="https://example.com"
                    type="url"
                  />
                  {errors.website && (
                    <p className="text-sm text-destructive">{errors.website.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registrationNumber">Registration Number</Label>
                  <Input
                    id="registrationNumber"
                    {...register('registrationNumber')}
                    placeholder="Registration number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <Input
                    id="logoUrl"
                    {...register('logoUrl')}
                    placeholder="https://example.com/logo.png"
                    type="url"
                  />
                  {errors.logoUrl && (
                    <p className="text-sm text-destructive">{errors.logoUrl.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fieldsOfActivityIds">Fields of Activity *</Label>
                  <Select
                    value={formData.fieldsOfActivityIds?.[0]}
                    onValueChange={(value: string) => setValue('fieldsOfActivityIds', [value])}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select field of activity" />
                    </SelectTrigger>
                    <SelectContent>
                      {fieldsOfActivity.map((field) => (
                        <SelectItem key={field.id} value={field.id}>
                          {field.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.fieldsOfActivityIds && (
                    <p className="text-sm text-destructive">{errors.fieldsOfActivityIds.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="thematicAreaIds">Knowledge Domains</Label>
                  <Select
                    value={formData.thematicAreaIds?.[0]}
                    onValueChange={(value: string) => setValue('thematicAreaIds', [value])}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select knowledge domain" />
                    </SelectTrigger>
                    <SelectContent>
                      {thematicAreas.map((area) => (
                        <SelectItem key={area.id} value={area.id}>
                          {area.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sectorIds">Sectors</Label>
                  <Select
                    value={formData.sectorIds?.[0]}
                    onValueChange={(value: string) => setValue('sectorIds', [value])}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select sector" />
                    </SelectTrigger>
                    <SelectContent>
                      {sectors.map((sector) => (
                        <SelectItem key={sector.id} value={sector.id}>
                          {sector.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="technologyIds">Technologies</Label>
                  <Select
                    value={formData.technologyIds?.[0]}
                    onValueChange={(value: string) => setValue('technologyIds', [value])}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select technology" />
                    </SelectTrigger>
                    <SelectContent>
                      {technologies.map((tech) => (
                        <SelectItem key={tech.id} value={tech.id}>
                          {tech.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="useCaseIds">Use Cases</Label>
                  <Select
                    value={formData.useCaseIds?.[0]}
                    onValueChange={(value: string) => setValue('useCaseIds', [value])}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select use case" />
                    </SelectTrigger>
                    <SelectContent>
                      {useCases.map((useCase) => (
                        <SelectItem key={useCase.id} value={useCase.id}>
                          {useCase.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {currentStep === 'compliance' && (
              <>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contactFirstName">Contact First Name *</Label>
                    <Input
                      id="contactFirstName"
                      {...register('contactFirstName')}
                      placeholder="First name"
                    />
                    {errors.contactFirstName && (
                      <p className="text-sm text-destructive">
                        {errors.contactFirstName.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactLastName">Contact Last Name *</Label>
                    <Input
                      id="contactLastName"
                      {...register('contactLastName')}
                      placeholder="Last name"
                    />
                    {errors.contactLastName && (
                      <p className="text-sm text-destructive">
                        {errors.contactLastName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="isHeadquarter">Main Headquarter *</Label>
                    <Select
                      value={formData.isHeadquarter === true ? 'true' : formData.isHeadquarter === false ? 'false' : ''}
                      onValueChange={(value: string) => setValue('isHeadquarter', value === 'true')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="headquarterInfo">Headquarter Info</Label>
                    <Input
                      id="headquarterInfo"
                      {...register('headquarterInfo')}
                      placeholder="If not HQ, provide details"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="hasSubsidiaries">Has Subsidiaries *</Label>
                    <Select
                      value={formData.hasSubsidiaries === true ? 'true' : formData.hasSubsidiaries === false ? 'false' : ''}
                      onValueChange={(value: string) => setValue('hasSubsidiaries', value === 'true')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subsidiariesDetails">Subsidiaries Details</Label>
                    <Input
                      id="subsidiariesDetails"
                      {...register('subsidiariesDetails')}
                      placeholder="If yes, provide details"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="hasMajorityShares">Holds Majority Shares *</Label>
                    <Select
                      value={formData.hasMajorityShares === true ? 'true' : formData.hasMajorityShares === false ? 'false' : ''}
                      onValueChange={(value: string) => setValue('hasMajorityShares', value === 'true')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="majoritySharesDetails">Majority Shares Details</Label>
                    <Input
                      id="majoritySharesDetails"
                      {...register('majoritySharesDetails')}
                      placeholder="If yes, provide details"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email *</Label>
                  <Input
                    id="contactEmail"
                    {...register('contactEmail')}
                    placeholder="contact@example.org"
                    type="email"
                  />
                  {errors.contactEmail && (
                    <p className="text-sm text-destructive">{errors.contactEmail.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contactPosition">Contact Position</Label>
                    <Input
                      id="contactPosition"
                      {...register('contactPosition')}
                      placeholder="Position"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Contact Phone</Label>
                    <Input
                      id="contactPhone"
                      {...register('contactPhone')}
                      placeholder="Phone number"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="article138Compliance">Article 138 Compliance *</Label>
                    <Select
                      value={formData.article138Compliance === true ? 'true' : formData.article138Compliance === false ? 'false' : ''}
                      onValueChange={(value: string) => setValue('article138Compliance', value === 'true')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.article138Compliance && (
                      <p className="text-sm text-destructive">
                        {errors.article138Compliance.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dataShareConsent">Data Sharing Consent *</Label>
                    <Select
                      value={formData.dataShareConsent === true ? 'true' : formData.dataShareConsent === false ? 'false' : ''}
                      onValueChange={(value: string) => setValue('dataShareConsent', value === 'true')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.dataShareConsent && (
                      <p className="text-sm text-destructive">
                        {errors.dataShareConsent.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expertiseDescription">Expertise Description *</Label>
                  <Textarea
                    id="expertiseDescription"
                    {...register('expertiseDescription')}
                    placeholder="Describe expertise (max 800 chars)"
                    rows={4}
                  />
                  {errors.expertiseDescription && (
                    <p className="text-sm text-destructive">
                      {errors.expertiseDescription.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="goalsToAchieve">Goals to Achieve</Label>
                  <Textarea
                    id="goalsToAchieve"
                    {...register('goalsToAchieve')}
                    placeholder="Goals to achieve"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="goalsToContribute">Goals to Contribute</Label>
                  <Textarea
                    id="goalsToContribute"
                    {...register('goalsToContribute')}
                    placeholder="Goals to contribute"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="moderationState">Moderation State</Label>
                  <Select
                    value={formData.moderationState || ''}
                    onValueChange={(value: string) => setValue('moderationState', value as EntityFormData['moderationState'])}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select moderation state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="ready_for_publication">Ready for Publication</SelectItem>
                      <SelectItem value="to_be_rejected">To be Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {currentStep === 'location' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="countryCode">Country Code (ISO-3166) *</Label>
                  <Input
                    id="countryCode"
                    {...register('countryCode')}
                    placeholder="DE"
                    maxLength={2}
                  />
                  {errors.countryCode && (
                    <p className="text-sm text-destructive">{errors.countryCode.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="countryId">Country (Taxonomy)</Label>
                  <Select
                    value={formData.countryId}
                    onValueChange={(value: string) => setValue('countryId', value)}
                  >
                    <SelectTrigger>
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    {...register('city')}
                    placeholder="City"
                  />
                  {errors.city && (
                    <p className="text-sm text-destructive">{errors.city.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="streetAddress">Street Address *</Label>
                  <Input
                    id="streetAddress"
                    {...register('streetAddress')}
                    placeholder="Street address"
                  />
                  {errors.streetAddress && (
                    <p className="text-sm text-destructive">{errors.streetAddress.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    {...register('postalCode')}
                    placeholder="Postal code"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      {...register('latitude', { valueAsNumber: true })}
                      placeholder="0.000000"
                      type="number"
                      step="any"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      {...register('longitude', { valueAsNumber: true })}
                      placeholder="0.000000"
                      type="number"
                      step="any"
                    />
                  </div>
                </div>
              </>
            )}

            {currentStep === 'classification' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="clusterTypeId">Cluster Type *</Label>
                  <Select
                    value={formData.clusterTypeId}
                    onValueChange={(value: string) => setValue('clusterTypeId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select cluster type" />
                    </SelectTrigger>
                    <SelectContent>
                      {clusterTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organizationTypeId">Organization Type</Label>
                  <Select
                    value={formData.organizationTypeId}
                    onValueChange={(value: string) => setValue('organizationTypeId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select organization type" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizationTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {currentStep === 'review' && (
              <div className="space-y-4">
                <div>
                  <h3 className="mb-4 text-lg font-semibold">Review Your Entity</h3>
                  <div className="space-y-3 rounded-lg border p-4">
                    <div>
                      <span className="font-medium">Name:</span> {formData.name}
                    </div>
                    {formData.description && (
                      <div>
                        <span className="font-medium">Description:</span>{' '}
                        {formData.description}
                      </div>
                    )}
                    {formData.website && (
                      <div>
                        <span className="font-medium">Website:</span> {formData.website}
                      </div>
                    )}
                    {formData.countryId && (
                      <div>
                        <span className="font-medium">Country:</span>{' '}
                        {countries.find((c) => c.id === formData.countryId)?.name}
                      </div>
                    )}
                    {formData.clusterTypeId && (
                      <div>
                        <span className="font-medium">Cluster Type:</span>{' '}
                        {clusterTypes.find((t) => t.id === formData.clusterTypeId)?.name}
                      </div>
                    )}
                    {formData.organizationTypeId && (
                      <div>
                        <span className="font-medium">Organization Type:</span>{' '}
                        {organizationTypes.find((t) => t.id === formData.organizationTypeId)?.name}
                      </div>
                    )}
                  </div>
                </div>
              </div>
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
                {submitting ? 'Creating...' : 'Create Entity'}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
