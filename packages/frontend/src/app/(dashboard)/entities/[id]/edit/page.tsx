'use client'

import { use } from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { ArrowLeft } from 'lucide-react'
import { EntityFormWizard } from '@/components/entities/entity-form-wizard'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/lib/api'
import { apiFetcher } from '@/lib/swr'
import type { Entity, EntityFormData } from '@/types'

export default function EditEntityPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const { data, isLoading } = useSWR<{ data: Entity }>(
    `/api/entities/${resolvedParams.id}`,
    apiFetcher
  )

  const entity = data?.data ?? null

  const handleSubmit = async (data: EntityFormData) => {
    setError(null)
    try {
      await apiClient.patch(`/api/entities/${resolvedParams.id}`, data)
      router.push(`/entities/${resolvedParams.id}`)
    } catch (err) {
      setError('Failed to update entity')
      throw err
    }
  }

  const handleCancel = () => {
    router.push(`/entities/${resolvedParams.id}`)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-muted-foreground">Loading entity...</div>
      </div>
    )
  }

  if (!entity) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Entity not found</h2>
          <Button onClick={() => router.push('/entities')} className="mt-4">
            Back to Entities
          </Button>
        </div>
      </div>
    )
  }

  const initialData: Partial<EntityFormData> = {
    name: entity.name,
    nameNational: entity.nameNational || undefined,
    entityDepartment: entity.entityDepartment || undefined,
    description: entity.description || undefined,
    countryCode: entity.countryCode || undefined,
    city: entity.city || undefined,
    streetAddress: entity.streetAddress || undefined,
    postalCode: entity.postalCode || undefined,
    email: entity.email || undefined,
    phone: entity.phone || undefined,
    registrationNumber: entity.registrationNumber || undefined,
    website: entity.website || undefined,
    logoUrl: entity.logoUrl || undefined,
    latitude: entity.latitude ? parseFloat(entity.latitude) : undefined,
    longitude: entity.longitude ? parseFloat(entity.longitude) : undefined,
    isHeadquarter: entity.isHeadquarter ?? undefined,
    headquarterInfo: entity.headquarterInfo || undefined,
    hasSubsidiaries: entity.hasSubsidiaries ?? undefined,
    subsidiariesDetails: entity.subsidiariesDetails || undefined,
    hasMajorityShares: entity.hasMajorityShares ?? undefined,
    majoritySharesDetails: entity.majoritySharesDetails || undefined,
    article138Compliance: entity.article138Compliance ?? undefined,
    dataShareConsent: entity.dataShareConsent ?? undefined,
    contactFirstName: entity.contactFirstName || undefined,
    contactLastName: entity.contactLastName || undefined,
    contactEmail: entity.contactEmail || undefined,
    contactPosition: entity.contactPosition || undefined,
    contactPhone: entity.contactPhone || undefined,
    expertiseDescription: entity.expertiseDescription || undefined,
    goalsToAchieve: entity.goalsToAchieve || undefined,
    goalsToContribute: entity.goalsToContribute || undefined,
    countryId: entity.countryId || undefined,
    clusterTypeId: entity.clusterTypeId || undefined,
    moderationState: entity.moderationState || undefined,
    thematicAreaIds: entity.thematicAreas?.map((t) => t.id) || [],
    sectorIds: entity.sectors?.map((t) => t.id) || [],
    technologyIds: entity.technologies?.map((t) => t.id) || [],
    useCaseIds: entity.useCases?.map((t) => t.id) || [],
    fieldsOfActivityIds: entity.fieldsOfActivity?.map((t) => t.id) || [],
    subDomainIds: entity.subDomains?.reduce<Record<string, string[]>>((acc, t) => {
      const parentKey = t.parentId || 'unknown'
      if (!acc[parentKey]) acc[parentKey] = []
      acc[parentKey].push(t.id)
      return acc
    }, {}) || {},
  }

  return (
    <>
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/entities/${resolvedParams.id}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Edit Entity</h2>
          <p className="text-muted-foreground">Update entity information</p>
        </div>
      </div>

      {error && <div className="mb-6 rounded-md bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}

      <EntityFormWizard initialData={initialData} onSubmit={handleSubmit} onCancel={handleCancel} />
    </>
  )
}
