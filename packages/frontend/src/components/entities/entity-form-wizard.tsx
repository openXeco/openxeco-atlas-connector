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
  description: z.string().optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  logoUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  countryId: z.string().uuid().optional(),
  clusterTypeId: z.string().uuid().optional(),
  legalStatusId: z.string().uuid().optional(),
  organizationTypeId: z.string().uuid().optional(),
});

interface EntityFormWizardProps {
  initialData?: Partial<EntityFormData>;
  onSubmit: (data: EntityFormData) => Promise<void>;
  onCancel: () => void;
}

type Step = 'basic' | 'location' | 'classification' | 'review';

const steps: { id: Step; title: string; description: string }[] = [
  { id: 'basic', title: 'Basic Information', description: 'Name, description, and website' },
  { id: 'location', title: 'Location', description: 'Country, address, and coordinates' },
  { id: 'classification', title: 'Classification', description: 'Type, legal status, and organization' },
  { id: 'review', title: 'Review', description: 'Review and submit' },
];

export function EntityFormWizard({ initialData, onSubmit, onCancel }: EntityFormWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>('basic');
  const [submitting, setSubmitting] = useState(false);
  const [countries, setCountries] = useState<Taxonomy[]>([]);
  const [clusterTypes, setClusterTypes] = useState<Taxonomy[]>([]);
  const [legalStatuses, setLegalStatuses] = useState<Taxonomy[]>([]);
  const [organizationTypes, setOrganizationTypes] = useState<Taxonomy[]>([]);

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
        const [countriesRes, typesRes, legalRes, orgRes] = await Promise.all([
          apiClient.get<{ data: Taxonomy[] }>('/api/taxonomies/country'),
          apiClient.get<{ data: Taxonomy[] }>('/api/taxonomies/cluster_type'),
          apiClient.get<{ data: Taxonomy[] }>('/api/taxonomies/legal_status'),
          apiClient.get<{ data: Taxonomy[] }>('/api/taxonomies/organization_type'),
        ]);
        setCountries(countriesRes.data);
        setClusterTypes(typesRes.data);
        setLegalStatuses(legalRes.data);
        setOrganizationTypes(orgRes.data);
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
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    placeholder="Enter entity description"
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
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
              </>
            )}

            {currentStep === 'location' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="countryId">Country</Label>
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
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    {...register('address')}
                    placeholder="Enter full address"
                    rows={3}
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
                  <Label htmlFor="clusterTypeId">Cluster Type</Label>
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
                  <Label htmlFor="legalStatusId">Legal Status</Label>
                  <Select
                    value={formData.legalStatusId}
                    onValueChange={(value: string) => setValue('legalStatusId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select legal status" />
                    </SelectTrigger>
                    <SelectContent>
                      {legalStatuses.map((status) => (
                        <SelectItem key={status.id} value={status.id}>
                          {status.name}
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
                    {formData.address && (
                      <div>
                        <span className="font-medium">Address:</span> {formData.address}
                      </div>
                    )}
                    {formData.clusterTypeId && (
                      <div>
                        <span className="font-medium">Cluster Type:</span>{' '}
                        {clusterTypes.find((t) => t.id === formData.clusterTypeId)?.name}
                      </div>
                    )}
                    {formData.legalStatusId && (
                      <div>
                        <span className="font-medium">Legal Status:</span>{' '}
                        {legalStatuses.find((s) => s.id === formData.legalStatusId)?.name}
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
