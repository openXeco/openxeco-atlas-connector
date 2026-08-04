'use client'

import type { Entity } from '@/types'
import { ArrowLeft, Clock, FileText, Globe, ExternalLink, MapPin, Building2, Pencil } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { PushEntityButton } from '@/components/entities/push-entity-button'
import { DeleteEntityButton } from '@/components/entities/delete-entity-button'
import { Link } from '@/components/ui/link'
import { StatusBadge } from '@/components/entities/status-badge'
import { EntityDisplayField } from '@/components/entities/entity-display-field'
import { formatDate } from '@/lib/utils'
import useSWR from 'swr'
import { apiFetcher, swrDefaultOptions } from '@/lib/swr'
import React from 'react'
import { CheckEntityConflictsButton } from '@/components/entities/check-entity-conflicts-button'

export default function ViewEntityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)

  const { data, isLoading } = useSWR<{ data: { entity: Entity } }>(`/api/entities/${id}`, apiFetcher, swrDefaultOptions)

  const { entity } = data?.data || {}
  if (isLoading) {
    return <>Loading...</>
  }

  if (!entity) {
    return (
      <div className='flex min-h-[50vh] items-center justify-center'>
        <div className='text-center'>
          <h2 className='text-2xl font-bold'>Entity not found</h2>
          <Link href={'/entities'} variant='ghost'>
            Back to Entities
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className='mb-6 flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Link href={'/entities'} variant={'ghost'}>
            <ArrowLeft className={'h-5 w-5'} />
          </Link>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>{entity.name}</h2>
            <div className='mt-1 flex items-center gap-2'>
              <StatusBadge type={'entity'} status={entity.status} />
              <StatusBadge type={'sync'} status={entity.syncStatus} />
            </div>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <PushEntityButton id={id} />
          <Link href={`/entities/${id}/edit`} variant={'outline'}>
            <Pencil className='h-4 w-4' />
            Edit
          </Link>
          <DeleteEntityButton id={id} />
        </div>
      </div>

      <Tabs defaultValue='details' className='space-y-6'>
        <TabsList>
          <TabsTrigger value='details'>Details</TabsTrigger>
          <TabsTrigger value={'sync'} disabled={false}>
            Sync status (coming soon)
          </TabsTrigger>
        </TabsList>

        <TabsContent value='details' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Clock className='h-5 w-5' />
                Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <EntityDisplayField title={'Created'} value={formatDate(entity.createdAt.toString(), true)} />
              <EntityDisplayField title={'Last Updated'} value={formatDate(entity.updatedAt.toString(), true)} />

              {entity.lastSyncedAt && (
                <EntityDisplayField title={'Last Synced'} value={formatDate(entity.lastSyncedAt.toString(), true)} />
              )}
              {entity.atlasId && <EntityDisplayField title={'Atlas ID'} value={entity.atlasId} />}
            </CardContent>
          </Card>
          <div className={'grid grid-cols-1 xl:grid-cols-3 gap-4'}>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <FileText className='h-5 w-5' />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                {entity.nameNational && (
                  <EntityDisplayField title={'Name (National Language)'} value={entity.nameNational} />
                )}

                {entity.entityDepartment && <EntityDisplayField title={'Department'} value={entity.entityDepartment} />}
                {entity.website && (
                  <EntityDisplayField title={'Website'}>
                    <a
                      href={entity.website}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='flex items-center gap-2 text-sm text-primary hover:underline'
                    >
                      <Globe className='h-4 w-4' />
                      {entity.website}
                      <ExternalLink className='h-3 w-3' />
                    </a>
                  </EntityDisplayField>
                )}
                {entity.email && <EntityDisplayField title={'Organisation Email'} value={entity.email} />}
                {entity.phone && <EntityDisplayField title={'Organisation Phone'} value={entity.phone} />}
                {entity.registrationNumber && (
                  <EntityDisplayField title={'Registration Number'} value={entity.registrationNumber} />
                )}
                {entity.clusterType && (
                  <EntityDisplayField title={'Organisation Type'} value={entity.clusterType.name} />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <FileText className='h-5 w-5' />
                  Contact & Compliance
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                {(entity.contactFirstName || entity.contactLastName) && (
                  <EntityDisplayField title={'Contact Person'}>
                    <p className='text-sm'>
                      {[entity.contactFirstName, entity.contactLastName].filter(Boolean).join(' ')}
                    </p>
                    {entity.contactEmail && <p className='text-sm text-muted-foreground'>{entity.contactEmail}</p>}
                  </EntityDisplayField>
                )}
                {(entity.article138Compliance !== null || entity.dataShareConsent !== null) && (
                  <div>
                    <EntityDisplayField title={'Compliance'}>
                      <p className='text-sm'>Article 138 Compliance: {entity.article138Compliance ? 'Yes' : 'No'}</p>
                      <p className='text-sm'>Data Sharing Consent: {entity.dataShareConsent ? 'Yes' : 'No'}</p>
                    </EntityDisplayField>
                  </div>
                )}
                {entity.hasSubsidiaries !== null && (
                  <EntityDisplayField title={'Has subsidiaries in EU Member States?'}>
                    <p className='text-sm'>{entity.hasSubsidiaries ? 'Yes' : 'No'}</p>
                    {entity.hasSubsidiaries && <p className='text-sm'>{entity.subsidiariesDetails}</p>}
                  </EntityDisplayField>
                )}
                {entity.hasMajorityShares !== null && (
                  <EntityDisplayField title={'Holds majority shares outside Member States?'}>
                    <p className='text-sm'>{entity.hasMajorityShares ? 'Yes' : 'No'}</p>
                    {entity.hasMajorityShares && <p className='text-sm'>{entity.majoritySharesDetails}</p>}
                  </EntityDisplayField>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <MapPin className='h-5 w-5' />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                {entity.country && <EntityDisplayField title={'Country'} value={entity.country.name} />}
                {(entity.streetAddress || entity.city || entity.countryCode) && (
                  <EntityDisplayField
                    title={'Address'}
                    value={`${[entity.streetAddress, entity.city].filter(Boolean).join(', ')}
                      ${entity.countryCode ? `(${entity.countryCode})` : ''}`}
                  />
                )}
              </CardContent>
            </Card>

            <Card className={' col-span-3'}>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Building2 className='h-5 w-5' />
                  Field of Activity / Expertise
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                {entity.fieldsOfActivity && entity.fieldsOfActivity.length > 0 && (
                  <EntityDisplayField
                    title={"Organisation's expertise - Article 8 (3)"}
                    value={entity.fieldsOfActivity.map((a) => a.name)}
                    fieldName={'fieldOfActivity'}
                  />
                )}

                {entity.expertiseDescription && (
                  <EntityDisplayField title={'Expertise Description'} value={entity.expertiseDescription} />
                )}

                {entity.thematicAreas && entity.thematicAreas.length > 0 && (
                  <EntityDisplayField
                    title={'Knowledge Domains'}
                    value={entity.thematicAreas.map((a) => a.name)}
                    fieldName={'fieldOfActivity'}
                  />
                )}

                {entity.sectors && entity.sectors.length > 0 && (
                  <EntityDisplayField
                    title={'Sectors'}
                    value={entity.sectors.map((a) => a.name)}
                    fieldName={'fieldOfActivity'}
                  />
                )}

                {entity.technologies && entity.technologies.length > 0 && (
                  <EntityDisplayField
                    title={'Technologies'}
                    value={entity.technologies.map((a) => a.name)}
                    fieldName={'fieldOfActivity'}
                  />
                )}

                {entity.useCases && entity.useCases.length > 0 && (
                  <EntityDisplayField
                    title={'Use Cases'}
                    value={entity.useCases.map((a) => a.name)}
                    fieldName={'fieldOfActivity'}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value={'sync'}>
          <Card>
            <CardHeader>
              <CardTitle className={'flex items-center gap-2'}>
                Sync status <StatusBadge type={'sync'} status={entity.syncStatus} />
                <CheckEntityConflictsButton id={entity.id} />
              </CardTitle>
              <CardDescription>
                This view displays any potential conflicts between the selected entity and the ATLAS version.
              </CardDescription>
            </CardHeader>
            <CardContent>Found 4 conflicts!</CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  )
}
