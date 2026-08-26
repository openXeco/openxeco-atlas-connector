'use client'

import { Building2, Clock, ExternalLink, FileText, Globe, MapPin } from 'lucide-react'
import { CardHeader, CardTitle, CardContent, Card } from '../ui/card'
import { EntityDisplayField } from '@/components/entities/entity-display-field'
import { formatDate } from '@/lib/utils'
import type { Entity } from '@/types'

export const ViewEntity = ({ entity }: { entity: Entity }) => {
  return (
    <>
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
            {entity.clusterType && <EntityDisplayField title={'Organisation Type'} value={entity.clusterType.name} />}
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
                <p className='text-sm'>{[entity.contactFirstName, entity.contactLastName].filter(Boolean).join(' ')}</p>
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
    </>
  )
}
