import z from 'zod'

// Auth
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Please insert your password'),
})

export type LoginFormData = z.infer<typeof loginSchema>

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

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')

export const baseUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: passwordSchema,
  confirmPassword: z.string({ message: 'Password confirmation is required' }),
})

export const newUserSchema = baseUserSchema.refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const editUserSchema = z.object({
  id: z.string({ message: 'Unexpected error. User ID' }).uuid(),
  email: z.string().email('Invalid email address'),
})

export const changePasswordSchema = z
  .object({
    id: z.string({ message: 'Unexpected error. User ID' }).uuid(),
  })
  .merge(baseUserSchema.pick({ password: true, confirmPassword: true }))
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const generalSettingSchema = z.object({
  country: z.string({ message: 'Invalid country, please select one from the list.' }).uuid().optional(),
})
