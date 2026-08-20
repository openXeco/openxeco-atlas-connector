import type {
  AtlasJsonApiResource,
  AtlasTaxonomyTerm,
  AtlasCluster,
  AtlasJsonApiAddress,
  AtlasJsonApiWebsite,
  AtlasClusterInput,
} from '@/actions/atlas/types.js'
import type { TaxonomyType, EntityStatus } from '@/types.js'
import type { Taxonomy } from '@/db/schema.js'
import type { EntityWithRelationships, EntityWithFullRelationships } from '@/actions/entities/types.js'
import { buildJsonApiRelationships, extractIdsFromJsonRelationship } from '@/actions/atlas/utils/atlas-relationships.js'

export const toClusterFromResource = (resource: AtlasJsonApiResource): AtlasCluster => {
  const attrs = resource.attributes
  const address = attrs.field_address as AtlasJsonApiAddress

  const websiteField = attrs.field_url as AtlasJsonApiWebsite
  const website =
    typeof websiteField === 'object' && websiteField !== null ? websiteField.uri : (websiteField as string | undefined)

  const cluster: AtlasCluster = {
    id: resource.id,
    atlasId: resource.id,

    // Basic information
    name: (attrs.title as string) || (attrs.name as string) || '',
    nameNational: attrs.field_institution_name_in_nation as string | undefined,
    entityDepartment: attrs.field_entity_department as string | undefined,

    // Address
    countryCode: address?.country_code,
    city: address?.locality,
    streetAddress: address?.address_line1,

    // Organisation details
    email: attrs.field_general_contact_e_mail as string | undefined,
    phone: attrs.field_phone_number as string | undefined,
    website,
    registrationNumber: attrs.field_registration_number as string | undefined,

    // Headquarters
    isHeadquarter: attrs.field_question_headquarter as boolean | undefined,
    headquarterInfo: attrs.field_headquarter as string | undefined,

    // Subsidiaries
    hasSubsidiaries: attrs.field_question_subsidiaries as boolean | undefined,
    subsidiariesDetails: attrs.field_subsidiaries_eu as string | undefined,
    hasMajorityShares: attrs.field_question_majority as boolean | undefined,
    majoritySharesDetails: attrs.field_majority_shares_noneu as string | undefined,

    // Compliance
    article138Compliance: attrs.field_article_136_compliance as boolean | undefined,
    dataShareConsent: attrs.field_data_sharing_consent as boolean | undefined,

    // Contact person
    contactFirstName: attrs.field_first_name as string | undefined,
    contactLastName: attrs.field_family_name as string | undefined,
    contactEmail: attrs.field_e_mail as string | undefined,
    contactPosition: attrs.field_position as string | undefined,
    contactPhone: attrs.field_representative_phone_numbe as string | undefined,

    // Expertise
    expertiseDescription: attrs.field_field_of_activity_descr as string | undefined,
    goalsToAchieve: attrs.field_goals_to_achieve as string | undefined,
    goalsToContribute: attrs.field_goals_to_contribute as string | undefined,

    // Workflow
    moderationState: attrs.moderation_state as string | undefined,

    // Timestamps
    updatedAt: attrs.changed as string | undefined,

    metadata: attrs,
  }

  // Extract relationships
  if (resource.relationships) {
    const rels = resource.relationships

    // Single-value relationships
    if (rels.field_country?.data && !Array.isArray(rels.field_country.data)) {
      cluster.countryId = rels.field_country.data.id
    }
    if (rels.field_cluster_type?.data && !Array.isArray(rels.field_cluster_type.data)) {
      cluster.clusterTypeId = rels.field_cluster_type.data.id
    }

    cluster.thematicAreaIds = extractIdsFromJsonRelationship(rels.field_cluster_thematic_area)
    cluster.sectorIds = extractIdsFromJsonRelationship(rels.field_sectors)
    cluster.technologyIds = extractIdsFromJsonRelationship(rels.field_technologies)
    cluster.useCaseIds = extractIdsFromJsonRelationship(rels.field_use_cases)
    cluster.fieldsOfActivityIds = extractIdsFromJsonRelationship(rels.field_field_of_activity)
  }

  return cluster
}

export const toClusterInputFromEntity = (entity: EntityWithFullRelationships): AtlasClusterInput => {
  return {
    name: entity.name,
    nameNational: entity.nameNational ?? undefined,
    entityDepartment: entity.entityDepartment ?? undefined,

    countryCode: entity.countryCode ?? undefined,
    city: entity.city ?? undefined,
    streetAddress: entity.streetAddress ?? undefined,

    email: entity.email ?? undefined,
    phone: entity.phone ?? undefined,
    website: entity.website ?? undefined,
    registrationNumber: entity.registrationNumber?.trim() || undefined,

    isHeadquarter: entity.isHeadquarter ?? undefined,
    headquarterInfo: entity.headquarterInfo ?? undefined,

    hasSubsidiaries: entity.hasSubsidiaries ?? undefined,
    subsidiariesDetails: entity.subsidiariesDetails ?? undefined,
    hasMajorityShares: entity.hasMajorityShares ?? undefined,
    majoritySharesDetails: entity.majoritySharesDetails ?? undefined,

    article138Compliance: entity.article138Compliance ?? undefined,
    dataShareConsent: entity.dataShareConsent ?? undefined,

    contactFirstName: entity.contactFirstName ?? undefined,
    contactLastName: entity.contactLastName ?? undefined,
    contactEmail: entity.contactEmail ?? undefined,
    contactPosition: entity.contactPosition ?? undefined,
    contactPhone: entity.contactPhone ?? undefined,

    expertiseDescription: entity.expertiseDescription ?? undefined,
    goalsToAchieve: entity.goalsToAchieve ?? undefined,
    goalsToContribute: entity.goalsToContribute ?? undefined,

    // ATLAS taxonomy IDs
    clusterTypeId: entity.clusterType?.atlasId,
    thematicAreaIds: entity?.thematicAreas?.map((taxonomy) => taxonomy.atlasId),
    sectorIds: entity?.sectors?.map((taxonomy) => taxonomy.atlasId),
    technologyIds: entity?.technologies?.map((taxonomy) => taxonomy.atlasId),
    useCaseIds: entity?.useCases?.map((taxonomy) => taxonomy.atlasId),
    fieldsOfActivityIds: entity.fieldsOfActivity.map((taxonomy) => taxonomy.atlasId),

    // Local status maps to ATLAS moderation_state
    moderationState: entity.status,
  }
}

export const toEntityFromCluster = (
  cluster: AtlasCluster,
): Omit<EntityWithRelationships, 'id' | 'updatedAt' | 'createdAt'> => {
  return {
    atlasId: cluster.atlasId,

    // Basic information
    name: cluster.name,
    nameNational: Array.isArray(cluster.nameNational)
      ? (cluster.nameNational[0] ?? '')
      : (cluster.nameNational ?? ''),
    entityDepartment: cluster.entityDepartment ?? null,

    // Address (structured)
    countryCode: cluster.countryCode ?? null,
    city: cluster.city ?? null,
    streetAddress: cluster.streetAddress ?? null,

    // Organisation details
    email: cluster.email ?? null,
    phone: cluster.phone ?? null,
    website: cluster.website ?? null,
    registrationNumber: cluster.registrationNumber ?? null,

    // Headquarters
    isHeadquarter: cluster.isHeadquarter ?? null,
    headquarterInfo: cluster.headquarterInfo ?? null,

    // Subsidiaries
    hasSubsidiaries: cluster.hasSubsidiaries ?? null,
    subsidiariesDetails: cluster.subsidiariesDetails ?? null,
    hasMajorityShares: cluster.hasMajorityShares ?? null,
    majoritySharesDetails: cluster.majoritySharesDetails ?? null,

    // Compliance
    article138Compliance: cluster.article138Compliance ?? null,
    dataShareConsent: cluster.dataShareConsent ?? null,

    // Contact person
    contactFirstName: cluster.contactFirstName ?? null,
    contactLastName: cluster.contactLastName ?? null,
    contactEmail: cluster.contactEmail ?? null,
    contactPosition: cluster.contactPosition ?? null,
    contactPhone: cluster.contactPhone ?? null,

    // Expertise
    expertiseDescription: cluster.expertiseDescription ?? null,
    goalsToAchieve: cluster.goalsToAchieve ?? null,
    goalsToContribute: cluster.goalsToContribute ?? null,

    // Taxonomy references
    countryId: cluster.countryId ?? null,
    clusterTypeId: cluster.clusterTypeId ?? null,

    // Workflow
    status: (cluster.moderationState || 'draft') as EntityStatus,
    syncStatus: 'synced',
    syncCode: null,

    dataProtectionConsent: true,
    formCompletionConfirmed: true,

    metadata: cluster.metadata,
    lastSyncedAt: new Date(),

    thematicAreaIds: cluster.thematicAreaIds,
    sectorIds: cluster.sectorIds,
    technologyIds: cluster.technologyIds,
    useCaseIds: cluster.useCaseIds,
    fieldsOfActivityIds: cluster.fieldsOfActivityIds,
  }
}

export const toResourceFromCluster = (
  cluster: AtlasClusterInput,
  id?: string,
): Omit<AtlasJsonApiResource, 'id'> & { id?: string } => {
  return {
    type: 'node--cluster',
    ...(id && { id }),
    attributes: {
      // Basic information
      title: cluster.name, // English name *
      field_institution_name_in_nation: cluster.nameNational, // National language name *
      field_entity_department: cluster.entityDepartment,
      // body: cluster.description,

      // Address (structured) *
      field_address:
        cluster.countryCode && cluster.city && cluster.streetAddress
          ? {
              country_code: cluster.countryCode,
              locality: cluster.city,
              address_line1: cluster.streetAddress,
            }
          : undefined,

      // Organisation details
      field_general_contact_e_mail: cluster.email, // *
      field_phone_number: cluster.phone,
      field_url: cluster.website ? { uri: cluster.website } : undefined, // *
      field_registration_number: cluster.registrationNumber,

      // Headquarters
      field_question_headquarter: cluster.isHeadquarter, // *
      field_headquarter: cluster.isHeadquarter ? undefined : cluster.headquarterInfo || undefined,

      // Subsidiaries
      field_question_subsidiaries: cluster.hasSubsidiaries, // *
      field_subsidiaries_eu: cluster.hasSubsidiaries ? cluster.subsidiariesDetails || undefined : undefined,
      field_question_majority: cluster.hasMajorityShares, // *
      field_majority_shares_noneu: cluster.hasMajorityShares ? cluster.majoritySharesDetails || undefined : undefined,

      // Compliance
      field_article_136_compliance: cluster.article138Compliance, // *
      field_data_sharing_consent: cluster.dataShareConsent, // *

      // Contact person / Representative
      field_first_name: cluster.contactFirstName, // *
      field_family_name: cluster.contactLastName, // *
      field_e_mail: cluster.contactEmail, // *
      field_position: cluster.contactPosition,
      field_representative_phone_numbe: cluster.contactPhone,

      // Expertise
      field_field_of_activity_descr: cluster.expertiseDescription, // * (max 800 chars)
      field_goals_to_achieve: cluster.goalsToAchieve,
      field_goals_to_contribute: cluster.goalsToContribute,

      // Workflow
      moderation_state: cluster.moderationState || 'draft',
    },

    relationships: buildJsonApiRelationships(cluster),
  }
}

export const toResourceFromEntity = (entity: EntityWithFullRelationships) =>
  toResourceFromCluster(toClusterInputFromEntity(entity))

export const toTaxonomyTermFromResource = (resource: AtlasJsonApiResource, type: TaxonomyType): AtlasTaxonomyTerm => {
  return {
    id: resource.id,
    atlasId: resource.id,
    type,
    name: (resource.attributes.name as string) || '',
    description: resource.attributes.description as string | undefined,
    parentId: resource.relationships?.parent?.data
      ? (resource.relationships.parent.data as { id: string }).id
      : undefined,
    metadata: resource.attributes,
  }
}

export const toTaxonomyFromTerm = (term: AtlasTaxonomyTerm): Omit<Taxonomy, 'id'> => {
  return {
    atlasId: term.atlasId,
    taxonomyType: term.type,
    name: term.name,
    description: term.description || '',
    parentId: term.parentId || null,
    metadata: term.metadata,
    lastSyncedAt: new Date(),
  }
}
