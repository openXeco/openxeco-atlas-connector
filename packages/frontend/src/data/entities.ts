import { WizardStep } from '@/components/ui/wizard'
import { Entity, EntityFormData } from '@/types'
import z from 'zod'

export const GDPR_DISCLAIMER = `<p>The NCC, to which the application will be submitted, will process personal data in accordance with the Regulation (EU) 2016/679 (GDPR) and the ECCC will process personal data in accordance with the Regulation (EU) 2018/1725 (EUDPR). The legal basis for the processing operation is art. 6(1)(e) GDPR and art. 5(1)(a) EUDPR on the basis of articles 7 and 8 of Regulation (EU) 2021/887.</p>
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

export const FIELD_LABELS: Record<string, string> = {
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

export const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'organisation',
    title: 'Organisation',
    description: 'Organisation details and address',
    content: undefined,
  },
  { id: 'contact', title: 'Contact Person', description: 'Representative information', content: undefined },
  {
    id: 'expertise',
    title: 'Expertise/Taxonomy',
    description: 'Fields of activity and expertise',
    content: undefined,
  },
  {
    id: 'confirmation',
    title: 'Disclaimer & Confirmation',
    description: 'Review and consent',
    content: undefined,
  },
]

export const entityToForm = (entity: Entity): Partial<EntityFormData> => {
  return {
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
    isHeadquarter: entity.isHeadquarter ?? undefined,
    headquarterInfo: entity.headquarterInfo || undefined,
    hasSubsidiaries: entity.hasSubsidiaries ?? undefined,
    subsidiariesDetails: entity.subsidiariesDetails || undefined,
    hasMajorityShares: entity.hasMajorityShares ?? undefined,
    majoritySharesDetails: entity.majoritySharesDetails || undefined,
    article138Compliance: entity.article138Compliance ?? undefined,
    dataShareConsent: entity.dataShareConsent ?? undefined,
    dataProtectionConsent: entity.dataProtectionConsent ?? undefined,
    formCompletionConfirmed: entity.formCompletionConfirmed ?? undefined,
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
  }
}

export const entitySchema = z.object({
  // Step 1: Organisation
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
