import { z } from 'zod'
import citiesData from '@/utils/cities.json'
import statesData from '@/utils/states.json'

const validCities = new Set(citiesData as string[])
const validStates = new Set(statesData as string[])
const validCountries = new Set(['India'])


export const updateAccountSchema = z.object({
  // ================= Account Status Section =================
  assignmentDate: z.date().optional(),
  callBackDate: z.date({
    required_error: 'Call back date is required',
    invalid_type_error: 'Call back date is required',
  }),

  source: z.string().min(1, 'Source is required'),
  sourceType: z.string().min(1, 'Source type is required'),
  sourceOther: z.string().optional(),
  sourceDate: z.date({
    required_error: 'Source date is required',
    invalid_type_error: 'Source date is required',
  }),
  sourceDescription: z.string().optional(),
  distributorCode: z.string().optional(),

  wabaInterested: z.boolean().optional(),

  accountStatus: z.string().min(1, 'Account status is required'),
  accountStage: z.string().min(1, 'Account stage is required'),
  businessStatus: z.string().min(1, 'Business status is required'),
  accountOwnerId: z.string().min(1, 'Account owner is required'),
  priorityAccount: z.string().optional(),
  partnerName: z.string().optional(),
  // ================= Customer Basic Details =================
  profileType: z.string().min(1, 'Profile type is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  accountName: z.string().min(1, 'Account name is required'),

  phone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(/^\+?[0-9\s-]{10,15}$/, 'Invalid phone number'),

  email: z
    .string()
    .min(1, 'Email address is required')
    .email('Invalid email address'),

  mothersName: z.string().optional(),

  preferredLanguages: z.array(z.string()).optional(),

  createdBy: z.string().optional(),
  createdAt: z.string().optional(),
  modifiedBy: z.string().optional(),
  modifiedAt: z.string().optional(),

  // ================= Customer Salary Details =================
  employmentType: z.string().optional(),
  employerName: z.string().optional(),
  employmentVintage: z.preprocess(
    (val) =>
      val === '' || val === null || val === undefined ? undefined : Number(val),
    z.number().min(0, 'Must be positive').optional(),
  ),
  annualIncome: z.string().optional(),

  // ================= Customer Business Details =================
  businessVintage: z.preprocess(
    (val) =>
      val === '' || val === null || val === undefined ? undefined : Number(val),
    z
      .number({ invalid_type_error: 'Must be a number' })
      .min(0, 'Must be positive')
      .optional(),
  ),

  businessRegistrationType: z.string().optional(),
  suppliers: z.string().optional(),
  description: z.string().optional(),
  typeOfBusiness: z.string().optional(),
  industry: z.string().optional(),
  gstn: z.string().optional(),
  pan: z.string().optional(),
  parentAccount: z.string().optional(),

  // ================= Address - Business Premise =================
  businessStreet: z.string().optional(),
  businessCity: z.string().min(1, 'City is required').refine(val => validCities.has(val), 'Please select a valid predefined city'),
  businessState: z.string().min(1, 'State is required').refine(val => validStates.has(val), 'Please select a valid predefined state'),
  businessCountry: z.string().optional().refine(val => !val || validCountries.has(val), 'Please select a valid predefined country'),
  businessPincode: z.string().min(1, 'Pincode is required').regex(/^\d{6}$/, 'Pincode must be a 6-digit number'),
  businessYearsResiding: z.preprocess(
    (val) =>
      val === '' || val === null || val === undefined ? undefined : Number(val),
    z.number().min(0, 'Must be positive').optional(),
  ),
  businessGpsLocation: z.string().optional(),
  businessOwnership: z.string().optional(),

  // ================= Address - Applicant Residence =================
  applicantStreet: z.string().optional(),
  applicantCity: z.string().optional().refine(val => !val || validCities.has(val), 'Please select a valid predefined city'),
  applicantState: z.string().optional().refine(val => !val || validStates.has(val), 'Please select a valid predefined state'),
  applicantCountry: z.string().optional().refine(val => !val || validCountries.has(val), 'Please select a valid predefined country'),
  applicantPincode: z.string().regex(/^\d{6}$/, 'Pincode must be a 6-digit number').optional().or(z.literal('')),
  applicantYearsResiding: z.preprocess(
    (val) =>
      val === '' || val === null || val === undefined ? undefined : Number(val),
    z.number().min(0, 'Must be positive').optional(),
  ),
  applicantGpsLocation: z.string().optional(),
  applicantOwnership: z.string().optional(),

  // ================= Address - Co-Applicant Residence =================
  coApplicantName: z.string().optional(),
  coApplicantPhone: z
    .string()
    .regex(/^\+?[0-9\s-]{10,15}$/, 'Invalid phone number')
    .optional()
    .or(z.literal('')),
  coApplicantRelationship: z.string().optional(),
  coApplicantEmail: z
    .string()
    .email('Invalid email address')
    .optional()
    .or(z.literal('')),
  coApplicantStreet: z.string().optional(),
  coApplicantCity: z.string().optional().refine(val => !val || validCities.has(val), 'Please select a valid predefined city'),
  coApplicantState: z.string().optional().refine(val => !val || validStates.has(val), 'Please select a valid predefined state'),
  coApplicantCountry: z.string().optional().refine(val => !val || validCountries.has(val), 'Please select a valid predefined country'),
  coApplicantPincode: z.string().regex(/^\d{6}$/, 'Pincode must be a 6-digit number').optional().or(z.literal('')),
  coApplicantYearsResiding: z.preprocess(
    (val) =>
      val === '' || val === null || val === undefined ? undefined : Number(val),
    z.number().min(0, 'Must be positive').optional(),
  ),
  coApplicantGpsLocation: z.string().optional(),
  coApplicantOwnership: z.string().optional(),

  // ================= References =================
  ref1Name: z.string().optional(),
  ref1Phone: z
    .string()
    .regex(/^\+?[0-9\s-]{10,15}$/, 'Invalid phone number')
    .optional()
    .or(z.literal('')),
  ref1Email: z
    .string()
    .email('Invalid email address')
    .optional()
    .or(z.literal('')),
  ref1Relationship: z.string().optional(),
  ref1Address: z.string().optional(),

  ref2Name: z.string().optional(),
  ref2Phone: z
    .string()
    .regex(/^\+?[0-9\s-]{10,15}$/, 'Invalid phone number')
    .optional()
    .or(z.literal('')),
  ref2Email: z
    .string()
    .email('Invalid email address')
    .optional()
    .or(z.literal('')),
  ref2Relationship: z.string().optional(),
  ref2Address: z.string().optional(),
  applicantCode: z.string().optional(),
  noOfBusinessYears: z.string().optional(),
  gpsLocation: z.string().optional(),
  noOfYears: z.string().optional(),

  coApplicantCode: z.string().optional(),
  coApplicantYears: z.string().optional(),
})

export type UpdateAccountFormValues = z.infer<typeof updateAccountSchema>
