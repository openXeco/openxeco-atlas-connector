import type { Entity, EntityVersion } from '@/types'
import { ArrowLeft, Clock, FileText, Globe, ExternalLink, MapPin, Building2, Pencil } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { SyncEntityButton } from '@/components/entities/sync-entity-button'
import { DeleteEntityButton } from '@/components/entities/delete-entity-button'
import { Link } from '@/components/ui/link'
import { getApiClient } from '@/lib/api-client'
import { StatusBadge } from '@/components/entities/status-badge'

export default async function ViewEntityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const apiClient = await getApiClient()

  let entity: Entity
  let versions: EntityVersion[]

  try {
    const [entityRes, versionsRes] = await Promise.all([
      apiClient.get<{ data: Entity }>(`/entities/${id}`, { credentials: 'include' }),
      apiClient.get<{ data: EntityVersion[] }>(`/entities/${id}/versions`, { credentials: 'include' }),
    ])

    entity = entityRes.data
    versions = versionsRes.data
  } catch (_e) {
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
          <SyncEntityButton id={id} />
          <Link href={`/entities/${id}/edit`} variant={'outline'}>
            <Pencil className='h-4 w-4' />
            Edit
          </Link>
          <DeleteEntityButton id={id} />
        </div>
      </div>

      {/*{error && <div className="mb-6 rounded-md bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}*/}

      <Tabs defaultValue='details' className='space-y-6'>
        <TabsList>
          <TabsTrigger value='details'>Details</TabsTrigger>
          <TabsTrigger value='history'>Version History</TabsTrigger>
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
              <div>
                <h4 className='mb-2 text-sm font-medium text-muted-foreground'>Created</h4>
                <p className='text-sm'>{new Date(entity.createdAt).toLocaleString('en-UK')}</p>
              </div>
              <div>
                <h4 className='mb-2 text-sm font-medium text-muted-foreground'>Last Updated</h4>
                <p className='text-sm'>{new Date(entity.updatedAt).toLocaleString('en-UK')}</p>
              </div>
              {entity.lastSyncedAt && (
                <div>
                  <h4 className='mb-2 text-sm font-medium text-muted-foreground'>Last Synced</h4>
                  <p className='text-sm'>{new Date(entity.lastSyncedAt).toLocaleString()}</p>
                </div>
              )}
              {entity.atlasId && (
                <div>
                  <h4 className='mb-2 text-sm font-medium text-muted-foreground'>ATLAS ID</h4>
                  <p className='text-sm font-mono'>{entity.atlasId}</p>
                </div>
              )}
            </CardContent>
          </Card>
          <div className={'grid grid-cols-1 xl:grid-cols-2 gap-4'}>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <FileText className='h-5 w-5' />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                {entity.nameNational && (
                  <div>
                    <h4 className='mb-2 text-sm font-medium text-muted-foreground'>Name (National Language)</h4>
                    <p className='text-sm'>{entity.nameNational}</p>
                  </div>
                )}
                {entity.entityDepartment && (
                  <div>
                    <h4 className='mb-2 text-sm font-medium text-muted-foreground'>Department</h4>
                    <p className='text-sm'>{entity.entityDepartment}</p>
                  </div>
                )}
                {entity.description && (
                  <div>
                    <h4 className='mb-2 text-sm font-medium text-muted-foreground'>Description</h4>
                    <p className='text-sm'>{entity.description}</p>
                  </div>
                )}
                {entity.website && (
                  <div>
                    <h4 className='mb-2 text-sm font-medium text-muted-foreground'>Website</h4>
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
                  </div>
                )}
                {entity.email && (
                  <div>
                    <h4 className='mb-2 text-sm font-medium text-muted-foreground'>Organisation Email</h4>
                    <p className='text-sm'>{entity.email}</p>
                  </div>
                )}
                {entity.phone && (
                  <div>
                    <h4 className='mb-2 text-sm font-medium text-muted-foreground'>Organisation Phone</h4>
                    <p className='text-sm'>{entity.phone}</p>
                  </div>
                )}
                {entity.registrationNumber && (
                  <div>
                    <h4 className='mb-2 text-sm font-medium text-muted-foreground'>Registration Number</h4>
                    <p className='text-sm'>{entity.registrationNumber}</p>
                  </div>
                )}
                {entity.clusterType && (
                  <div>
                    <h4 className='mb-2 text-sm font-medium text-muted-foreground'>Organisation Type</h4>
                    <p className='text-sm'>{entity.clusterType.name}</p>
                  </div>
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
                  <div>
                    <h4 className='mb-2 text-sm font-medium text-muted-foreground'>Contact Person</h4>
                    <p className='text-sm'>
                      {[entity.contactFirstName, entity.contactLastName].filter(Boolean).join(' ')}
                    </p>
                    {entity.contactEmail && <p className='text-sm text-muted-foreground'>{entity.contactEmail}</p>}
                  </div>
                )}
                {(entity.article138Compliance !== null || entity.dataShareConsent !== null) && (
                  <div>
                    <h4 className='mb-2 text-sm font-medium text-muted-foreground'>Compliance</h4>
                    <p className='text-sm'>Article 138 Compliance: {entity.article138Compliance ? 'Yes' : 'No'}</p>
                    <p className='text-sm'>Data Sharing Consent: {entity.dataShareConsent ? 'Yes' : 'No'}</p>
                  </div>
                )}
                {entity.hasSubsidiaries !== null && (
                  <div>
                    <h4 className='mb-2 text-sm font-medium text-muted-foreground'>
                      Has subsidiaries in EU Member States?
                    </h4>
                    <p className='text-sm'>{entity.hasSubsidiaries ? 'Yes' : 'No'}</p>
                    {entity.hasSubsidiaries && <p className='text-sm'>{entity.subsidiariesDetails}</p>}
                  </div>
                )}
                {entity.hasMajorityShares !== null && (
                  <div>
                    <h4 className='mb-2 text-sm font-medium text-muted-foreground'>
                      Holds majority shares outside Member States?
                    </h4>
                    <p className='text-sm'>{entity.hasSubsidiaries ? 'Yes' : 'No'}</p>
                    {entity.majoritySharesDetails && <p className='text-sm'>{entity.majoritySharesDetails}</p>}
                  </div>
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
                {entity.country && (
                  <div>
                    <h4 className='mb-2 text-sm font-medium text-muted-foreground'>Country</h4>
                    <p className='text-sm'>{entity.country.name}</p>
                  </div>
                )}
                {(entity.streetAddress || entity.city || entity.postalCode || entity.countryCode) && (
                  <div>
                    <h4 className='mb-2 text-sm font-medium text-muted-foreground'>Address</h4>
                    <p className='text-sm'>
                      {[entity.streetAddress, entity.postalCode, entity.city].filter(Boolean).join(', ')}
                      {entity.countryCode ? ` (${entity.countryCode})` : ''}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Building2 className='h-5 w-5' />
                  Field of Activity / Expertise
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                {entity.fieldsOfActivity && entity.fieldsOfActivity.length > 0 && (
                  <div>
                    <h4 className='mb-2 text-sm font-medium text-muted-foreground'>
                      Organisation&#39;s expertise - Article 8 (3)
                    </h4>
                    <div className='flex flex-wrap gap-1'>
                      {entity.fieldsOfActivity.map((a) => (
                        <span
                          key={`field_${a.id}`}
                          className='inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium'
                        >
                          {a.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {entity.expertiseDescription && (
                  <div>
                    <h4 className='mb-2 text-sm font-medium text-muted-foreground'>Expertise Description</h4>
                    <p className='text-sm'>{entity.expertiseDescription}</p>
                  </div>
                )}

                {entity.thematicAreas && entity.thematicAreas.length > 0 && (
                  <div>
                    <h4 className='mb-2 text-sm font-medium text-muted-foreground'>Knowledge Domains</h4>
                    <div className='flex flex-wrap gap-1'>
                      {entity.thematicAreas.map((a) => (
                        <span
                          key={`thematicArea_${a.id}`}
                          className='inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium'
                        >
                          {a.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {entity.sectors && entity.sectors.length > 0 && (
                  <div>
                    <h4 className='mb-2 text-sm font-medium text-muted-foreground'>Sectors</h4>
                    <div className='flex flex-wrap gap-1'>
                      {entity.sectors.map((a) => (
                        <span
                          key={`sector_${a.id}`}
                          className='inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium'
                        >
                          {a.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {entity.technologies && entity.technologies.length > 0 && (
                  <div>
                    <h4 className='mb-2 text-sm font-medium text-muted-foreground'>Technologies</h4>
                    <div className='flex flex-wrap gap-1'>
                      {entity.technologies.map((a) => (
                        <span
                          key={`technology_${a.id}`}
                          className='inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium'
                        >
                          {a.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {entity.useCases && entity.useCases.length > 0 && (
                  <div>
                    <h4 className='mb-2 text-sm font-medium text-muted-foreground'>Use Cases</h4>
                    <div className='flex flex-wrap gap-1'>
                      {entity.useCases.map((a) => (
                        <span
                          key={`useCase_${a.id}`}
                          className='inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium'
                        >
                          {a.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value='history'>
          <Card>
            <CardHeader>
              <CardTitle>Version History</CardTitle>
              <CardDescription>{versions.length} versions recorded</CardDescription>
            </CardHeader>
            <CardContent>
              {versions.length === 0 ? (
                <div className='py-8 text-center text-muted-foreground'>No version history available</div>
              ) : (
                <div className='space-y-4'>
                  {versions.map((version) => (
                    <div key={version.id} className='flex items-start gap-4 rounded-lg border p-4'>
                      <div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary'>
                        v{version.version}
                      </div>
                      <div className='flex-1'>
                        <div className='flex items-center justify-between'>
                          <div className='font-medium'>Version {version.version}</div>
                          <div className='text-sm text-muted-foreground'>
                            {new Date(version.createdAt).toLocaleString('en-UK')}
                          </div>
                        </div>
                        <div className='mt-1 text-sm text-muted-foreground'>Changes recorded</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  )
}
