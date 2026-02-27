'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Pencil,
  Trash2,
  RefreshCw,
  ExternalLink,
  MapPin,
  Globe,
  Building2,
  FileText,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { apiClient } from '@/lib/api'
import type { Entity, EntityVersion } from '@/types/entity'
import type { Taxonomy } from '@/types/taxonomy'

export default function EntityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [entity, setEntity] = useState<Entity | null>(null)
  const [versions, setVersions] = useState<EntityVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [taxonomies, setTaxonomies] = useState<Record<string, Taxonomy>>({})

  const loadEntity = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiClient.get<{ data: Entity }>(`/api/entities/${resolvedParams.id}`)
      setEntity(response.data)

      const taxIds = [response.data.countryId, response.data.clusterTypeId, response.data.organizationTypeId].filter(
        Boolean
      ) as string[]

      if (taxIds.length > 0) {
        const results = await Promise.all(
          taxIds.map(async (taxId) => {
            try {
              const taxResponse = await apiClient.get<{ data: Taxonomy }>(`/api/taxonomies/id/${taxId}`)
              return [taxId, taxResponse.data] as const
            } catch (_err) {
              return null
            }
          })
        )
        const taxMap: Record<string, Taxonomy> = {}
        for (const result of results) {
          if (result) taxMap[result[0]] = result[1]
        }
        setTaxonomies(taxMap)
      }
    } catch (_err) {
      setError('Failed to load entity')
    } finally {
      setLoading(false)
    }
  }

  const loadVersions = async () => {
    try {
      const response = await apiClient.get<{ data: EntityVersion[] }>(`/api/entities/${resolvedParams.id}/versions`)
      setVersions(response.data)
    } catch (err) {
      console.error('Failed to load versions:', err)
    }
  }

  useEffect(() => {
    loadEntity()
    loadVersions()
  }, [resolvedParams.id])

  const handleEdit = () => {
    router.push(`/entities/${resolvedParams.id}/edit`)
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this entity?')) return

    try {
      await apiClient.delete(`/api/entities/${resolvedParams.id}`)
      router.push('/entities')
    } catch (_err) {
      setError('Failed to delete entity')
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    setError(null)

    try {
      await apiClient.post(`/api/entities/${resolvedParams.id}/sync`, {})
      await loadEntity()
    } catch (_err) {
      setError('Failed to sync entity to ATLAS')
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex h-screen">
          <Sidebar />
          <div className="flex flex-1 flex-col">
            <Header />
            <main className="flex flex-1 items-center justify-center">
              <div className="text-muted-foreground">Loading entity...</div>
            </main>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!entity) {
    return (
      <ProtectedRoute>
        <div className="flex h-screen">
          <Sidebar />
          <div className="flex flex-1 flex-col">
            <Header />
            <main className="flex flex-1 items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-bold">Entity not found</h2>
                <Button onClick={() => router.push('/entities')} className="mt-4">
                  Back to Entities
                </Button>
              </div>
            </main>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-500/10 text-green-700'
      case 'ready_for_publication':
        return 'bg-yellow-500/10 text-yellow-700'
      case 'to_be_rejected':
        return 'bg-orange-500/10 text-orange-700'
      case 'draft':
        return 'bg-gray-500/10 text-gray-700'
      case 'rejected':
        return 'bg-red-500/10 text-red-700'
      default:
        return 'bg-gray-500/10 text-gray-700'
    }
  }

  const getSyncStatusColor = (syncStatus: string) => {
    switch (syncStatus) {
      case 'synced':
        return 'bg-green-500/10 text-green-700'
      case 'pending_push':
        return 'bg-blue-500/10 text-blue-700'
      case 'local':
        return 'bg-gray-500/10 text-gray-700'
      case 'failed':
        return 'bg-red-500/10 text-red-700'
      case 'conflict':
        return 'bg-orange-500/10 text-orange-700'
      default:
        return 'bg-gray-500/10 text-gray-700'
    }
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <Header />
          <main className="flex-1 overflow-auto bg-muted/30 p-6">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push('/entities')}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">{entity.name}</h2>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant="secondary" className={getStatusColor(entity.status)}>
                      {entity.status}
                    </Badge>
                    <Badge variant="secondary" className={getSyncStatusColor(entity.syncStatus)}>
                      {entity.syncStatus.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {entity.syncStatus === 'conflict' && (
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/entities/${resolvedParams.id}/resolve`)}
                    className="gap-2 border-orange-200 text-orange-700 hover:bg-orange-50"
                  >
                    <AlertCircle className="h-4 w-4" />
                    Resolve Conflict
                  </Button>
                )}
                <Button variant="outline" onClick={handleSync} disabled={syncing} className="gap-2">
                  <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Pushing...' : 'Push to ATLAS'}
                </Button>
                <Button variant="outline" onClick={handleEdit} className="gap-2">
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  className="gap-2 text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>

            {error && <div className="mb-6 rounded-md bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}

            <Tabs defaultValue="details" className="space-y-6">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="history">Version History</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {entity.nameNational && (
                      <div>
                        <h4 className="mb-2 text-sm font-medium text-muted-foreground">Name (National Language)</h4>
                        <p className="text-sm">{entity.nameNational}</p>
                      </div>
                    )}
                    {entity.entityDepartment && (
                      <div>
                        <h4 className="mb-2 text-sm font-medium text-muted-foreground">Department</h4>
                        <p className="text-sm">{entity.entityDepartment}</p>
                      </div>
                    )}
                    {entity.description && (
                      <div>
                        <h4 className="mb-2 text-sm font-medium text-muted-foreground">Description</h4>
                        <p className="text-sm">{entity.description}</p>
                      </div>
                    )}
                    {entity.website && (
                      <div>
                        <h4 className="mb-2 text-sm font-medium text-muted-foreground">Website</h4>
                        <a
                          href={entity.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                          <Globe className="h-4 w-4" />
                          {entity.website}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                    {entity.email && (
                      <div>
                        <h4 className="mb-2 text-sm font-medium text-muted-foreground">Organization Email</h4>
                        <p className="text-sm">{entity.email}</p>
                      </div>
                    )}
                    {entity.phone && (
                      <div>
                        <h4 className="mb-2 text-sm font-medium text-muted-foreground">Organization Phone</h4>
                        <p className="text-sm">{entity.phone}</p>
                      </div>
                    )}
                    {entity.registrationNumber && (
                      <div>
                        <h4 className="mb-2 text-sm font-medium text-muted-foreground">Registration Number</h4>
                        <p className="text-sm">{entity.registrationNumber}</p>
                      </div>
                    )}
                    {entity.logoUrl && (
                      <div>
                        <h4 className="mb-2 text-sm font-medium text-muted-foreground">Logo</h4>
                        <img
                          src={entity.logoUrl}
                          alt={entity.name}
                          className="h-16 w-16 rounded-md border object-contain"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Contact & Compliance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(entity.contactFirstName || entity.contactLastName) && (
                      <div>
                        <h4 className="mb-2 text-sm font-medium text-muted-foreground">Contact Person</h4>
                        <p className="text-sm">
                          {[entity.contactFirstName, entity.contactLastName].filter(Boolean).join(' ')}
                        </p>
                        {entity.contactEmail && <p className="text-sm text-muted-foreground">{entity.contactEmail}</p>}
                      </div>
                    )}
                    {(entity.article138Compliance !== null || entity.dataShareConsent !== null) && (
                      <div>
                        <h4 className="mb-2 text-sm font-medium text-muted-foreground">Compliance</h4>
                        <p className="text-sm">Article 138 Compliance: {entity.article138Compliance ? 'Yes' : 'No'}</p>
                        <p className="text-sm">Data Sharing Consent: {entity.dataShareConsent ? 'Yes' : 'No'}</p>
                      </div>
                    )}
                    {entity.expertiseDescription && (
                      <div>
                        <h4 className="mb-2 text-sm font-medium text-muted-foreground">Expertise Description</h4>
                        <p className="text-sm">{entity.expertiseDescription}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Location
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {entity.countryId && taxonomies[entity.countryId] && (
                      <div>
                        <h4 className="mb-2 text-sm font-medium text-muted-foreground">Country</h4>
                        <p className="text-sm">{taxonomies[entity.countryId].name}</p>
                      </div>
                    )}
                    {(entity.streetAddress || entity.city || entity.postalCode || entity.countryCode) && (
                      <div>
                        <h4 className="mb-2 text-sm font-medium text-muted-foreground">Address</h4>
                        <p className="text-sm">
                          {[entity.streetAddress, entity.postalCode, entity.city].filter(Boolean).join(', ')}
                          {entity.countryCode ? ` (${entity.countryCode})` : ''}
                        </p>
                      </div>
                    )}
                    {entity.latitude && entity.longitude && (
                      <div>
                        <h4 className="mb-2 text-sm font-medium text-muted-foreground">Coordinates</h4>
                        <p className="text-sm">
                          {entity.latitude}, {entity.longitude}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Classification
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {entity.clusterTypeId && taxonomies[entity.clusterTypeId] && (
                      <div>
                        <h4 className="mb-2 text-sm font-medium text-muted-foreground">Cluster Type</h4>
                        <p className="text-sm">{taxonomies[entity.clusterTypeId].name}</p>
                      </div>
                    )}
                    {entity.organizationTypeId && taxonomies[entity.organizationTypeId] && (
                      <div>
                        <h4 className="mb-2 text-sm font-medium text-muted-foreground">Organization Type</h4>
                        <p className="text-sm">{taxonomies[entity.organizationTypeId].name}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Metadata
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="mb-2 text-sm font-medium text-muted-foreground">Created</h4>
                      <p className="text-sm">{new Date(entity.createdAt).toLocaleString()}</p>
                    </div>
                    <div>
                      <h4 className="mb-2 text-sm font-medium text-muted-foreground">Last Updated</h4>
                      <p className="text-sm">{new Date(entity.updatedAt).toLocaleString()}</p>
                    </div>
                    {entity.lastSyncedAt && (
                      <div>
                        <h4 className="mb-2 text-sm font-medium text-muted-foreground">Last Synced</h4>
                        <p className="text-sm">{new Date(entity.lastSyncedAt).toLocaleString()}</p>
                      </div>
                    )}
                    {entity.atlasId && (
                      <div>
                        <h4 className="mb-2 text-sm font-medium text-muted-foreground">ATLAS ID</h4>
                        <p className="text-sm font-mono">{entity.atlasId}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history">
                <Card>
                  <CardHeader>
                    <CardTitle>Version History</CardTitle>
                    <CardDescription>{versions.length} versions recorded</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {versions.length === 0 ? (
                      <div className="py-8 text-center text-muted-foreground">No version history available</div>
                    ) : (
                      <div className="space-y-4">
                        {versions.map((version) => (
                          <div key={version.id} className="flex items-start gap-4 rounded-lg border p-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                              v{version.version}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div className="font-medium">Version {version.version}</div>
                                <div className="text-sm text-muted-foreground">
                                  {new Date(version.createdAt).toLocaleString()}
                                </div>
                              </div>
                              <div className="mt-1 text-sm text-muted-foreground">Changes recorded</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
