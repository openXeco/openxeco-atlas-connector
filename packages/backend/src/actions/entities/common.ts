import z from 'zod'
import type { PgTable, PgAsyncTransaction } from 'drizzle-orm/pg-core'
import { SYNC_STATUSES, ENTITY_STATUSES } from '@/config/constants.js'

export const validateEntity = (data: unknown) => createOrUpdateEntitySchema.parse(data)

export const prepareEntity = (data: CreateOrUpdateEntity) => {
  return {
    // Basic information
    name: data.name,
    nameNational: data.nameNational,
    entityDepartment: data.entityDepartment,

    // Address
    countryCode: data.countryCode,
    city: data.city,
    streetAddress: data.streetAddress,

    // Organisation details
    email: data.email,
    phone: data.phone,
    website: data.website,
    registrationNumber: data.registrationNumber,

    // Headquarters
    isHeadquarter: data.isHeadquarter,
    headquarterInfo: data.headquarterInfo,

    // Subsidiaries
    hasSubsidiaries: data.hasSubsidiaries,
    subsidiariesDetails: data.subsidiariesDetails,
    hasMajorityShares: data.hasMajorityShares,
    majoritySharesDetails: data.majoritySharesDetails,

    // Compliance
    article138Compliance: data.article138Compliance,
    dataShareConsent: data.dataShareConsent,

    // Contact person
    contactFirstName: data.contactFirstName,
    contactLastName: data.contactLastName,
    contactEmail: data.contactEmail,
    contactPosition: data.contactPosition,
    contactPhone: data.contactPhone,

    // Expertise
    expertiseDescription: data.expertiseDescription,
    goalsToAchieve: data.goalsToAchieve,
    goalsToContribute: data.goalsToContribute,

    // Consent fields
    dataProtectionConsent: data.dataProtectionConsent,
    formCompletionConfirmed: data.formCompletionConfirmed,

    // Taxonomy references
    countryId: data.countryId,
    clusterTypeId: data.clusterTypeId,

    status: data.status || 'draft',
  }
}

export const saveTaxonomy = async (
  id: string,
  data: string[] | undefined | null,
  // biome-ignore lint/suspicious/noExplicitAny: We need it here
  tx: PgAsyncTransaction<any>,
  table: PgTable,
) => {
  if (data && data.length > 0) {
    await tx.insert(table).values(
      data.map((taxonomyId) => ({
        entityId: id,
        taxonomyId,
      })),
    )
  }
}

export const baseEntitySchema = z.object({
  // Basic information (mandatory)
  name: z.string().min(1).max(500), // title (English) *
  nameNational: z.string().min(1).max(400).optional(), // field_institution_name_in_nation *
  entityDepartment: z.string().max(400).optional(),
  description: z.string().optional(),

  // Address (structured) - mandatory fields
  countryCode: z.string().length(2).optional(), // field_address.country_code *
  city: z.string().max(400).optional(), // field_address.locality *
  streetAddress: z.string().max(400).optional(), // field_address.address_line *

  // Organisation details (mandatory)
  email: z.string().email().optional(), // field_general_contact_e_mail *
  phone: z.string().max(50).optional(),
  website: z.string().url().optional(), // field_url.uri *
  registrationNumber: z.string().max(100).optional(),

  // Headquarters information
  isHeadquarter: z.boolean().optional(), // field_question_headquarter *
  headquarterInfo: z.string().optional(), // required if isHeadquarter is false

  // Subsidiaries and ownership
  hasSubsidiaries: z.boolean().optional(), // field_question_subsidiaries *
  subsidiariesDetails: z.string().optional(), // required if hasSubsidiaries is true
  hasMajorityShares: z.boolean().optional(), // field_question_majority *
  majoritySharesDetails: z.string().optional(), // required if hasMajorityShares is true

  // Compliance (mandatory)
  article138Compliance: z.boolean().optional(), // field_article_136_compliance *
  dataShareConsent: z.boolean().optional(), // field_data_sharing_consent *

  // Contact person / Representative (mandatory)
  contactFirstName: z.string().max(400).optional(), // field_first_name *
  contactLastName: z.string().max(400).optional(), // field_family_name *
  contactEmail: z.string().email().optional(), // field_e_mail *
  contactPosition: z.string().max(400).optional(),
  contactPhone: z.string().max(50).optional(),

  // Expertise (mandatory)
  expertiseDescription: z.string().max(800).optional(), // field_field_of_activity_descr * (max 800 chars)
  goalsToAchieve: z.string().max(800).optional(),
  goalsToContribute: z.string().max(800).optional(),

  // Consent fields (ECCC form Step 4)
  dataProtectionConsent: z.boolean().optional(), // GDPR disclaimer acceptance
  formCompletionConfirmed: z.boolean().optional(), // Final submission confirmation

  // Taxonomy references
  countryId: z.string().uuid().optional(),
  clusterTypeId: z.string().uuid().optional(), // field_cluster_type *
  organizationTypeId: z.string().uuid().optional(),

  // JRC Taxonomy relationships (at least one dimension required)
  thematicAreaIds: z.array(z.string().uuid()).optional(), // Knowledge domains
  sectorIds: z.array(z.string().uuid()).optional(),
  technologyIds: z.array(z.string().uuid()).optional(),
  useCaseIds: z.array(z.string().uuid()).optional(),
  fieldsOfActivityIds: z.array(z.string().uuid()).optional(), // Article 8(3) expertise *

  // Workflow
  status: z.enum(['draft', 'ready_for_publication', 'to_be_rejected']).optional(),
})

export const createOrUpdateEntitySchema = baseEntitySchema
  .refine(
    (data) => {
      return !(data.isHeadquarter === false && !data.headquarterInfo)
    },
    {
      message: 'Headquarter information is required when organization is not the main headquarter',
      path: ['headquarterInfo'],
    },
  )
  .refine(
    (data) => {
      return !(data.hasSubsidiaries === true && !data.subsidiariesDetails)
    },
    {
      message: 'Subsidiaries details are required when organization has subsidiaries',
      path: ['subsidiariesDetails'],
    },
  )
  .refine(
    (data) => {
      return !(data.hasMajorityShares === true && !data.majoritySharesDetails)
    },
    {
      message: 'Majority shares details are required when organization holds majority shares',
      path: ['majoritySharesDetails'],
    },
  )
  .refine(
    (data) => {
      return !(data.status === 'ready_for_publication' && !data.dataProtectionConsent)
    },
    {
      message: 'Data protection consent is required for publication',
      path: ['dataProtectionConsent'],
    },
  )

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(ENTITY_STATUSES).optional(),
  syncStatus: z.enum(SYNC_STATUSES).optional(),
})

export type CreateOrUpdateEntity = z.infer<typeof createOrUpdateEntitySchema>
export type ListQuery = z.infer<typeof listQuerySchema>
