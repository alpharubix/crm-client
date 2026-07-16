import { useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { generateCibilOtp } from '@/pages/cibil/api';
import { mapCibilGenerateOtpError } from '@/pages/cibil/errorMapping';
import type {
  CibilFieldErrors,
  CibilGender,
  CibilGenerateOtpField,
  CibilIdentityPayload,
} from './types';

interface IdentityFormProps {
  onNext: (payload: CibilIdentityPayload, otpFlowId: string) => void;
}

const defaultValues: CibilIdentityPayload = {
  first_name: '',
  middle_name: '',
  last_name: '',
  date_of_birth: '',
  gender: 'M',
  mobile_number: '',
  address: '',
  state: '',
  pincode: '',
  identity: '',
};

const identityTypeOptions = [
  { value: 'PAN', label: 'PAN Card', placeholder: 'ABCDE1234F' },
  { value: 'AADHAR', label: 'Aadhaar Card', placeholder: '1234 5678 9012' },
  { value: 'PASSPORT', label: 'Passport', placeholder: 'A1234567' },
  {
    value: 'DRIVING_LICENSE',
    label: 'Driving Licence',
    placeholder: 'MH0120190012345',
  },
  { value: 'VOTER_ID', label: 'Voter ID', placeholder: 'ABC1234567' },
  { value: 'NREGA', label: 'NREGA Job Card', placeholder: 'RJ1234567890' },
  { value: 'RATION_CARD', label: 'Ration Card', placeholder: 'RC123456789' },
  { value: 'CIN', label: 'Company Identification Number (CIN)', placeholder: 'L12345MH2024PLC123456' },
  { value: 'GSTIN', label: 'GSTIN', placeholder: '27ABCDE1234F1Z5' },
];

const stateOptions = [
 
  // States
  { value: "AP", label: "Andhra Pradesh" },
  { value: "AR", label: "Arunachal Pradesh" },
  { value: "AS", label: "Assam" },
  { value: "BR", label: "Bihar" },
  { value: "CG", label: "Chhattisgarh" },
  { value: "GA", label: "Goa" },
  { value: "GJ", label: "Gujarat" },
  { value: "HR", label: "Haryana" },
  { value: "HP", label: "Himachal Pradesh" },
  { value: "JH", label: "Jharkhand" },
  { value: "KA", label: "Karnataka" },
  { value: "KL", label: "Kerala" },
  { value: "MP", label: "Madhya Pradesh" },
  { value: "MH", label: "Maharashtra" },
  { value: "MN", label: "Manipur" },
  { value: "ML", label: "Meghalaya" },
  { value: "MZ", label: "Mizoram" },
  { value: "NL", label: "Nagaland" },
  { value: "OD", label: "Odisha" },
  { value: "PB", label: "Punjab" },
  { value: "RJ", label: "Rajasthan" },
  { value: "SK", label: "Sikkim" },
  { value: "TN", label: "Tamil Nadu" },
  { value: "TS", label: "Telangana" },
  { value: "TR", label: "Tripura" },
  { value: "UP", label: "Uttar Pradesh" },
  { value: "UK", label: "Uttarakhand" },
  { value: "WB", label: "West Bengal" },

  // Union Territories
  { value: "AN", label: "Andaman and Nicobar Islands" },
  { value: "CH", label: "Chandigarh" },
  {
    value: "DN",
    label: "Dadra and Nagar Haveli and Daman and Diu",
  },
  { value: "DL", label: "Delhi (NCT)" },
  { value: "JK", label: "Jammu and Kashmir" },
  { value: "LA", label: "Ladakh" },
  { value: "LD", label: "Lakshadweep" },
  { value: "PY", label: "Puducherry" },

];


async function submitIdentityDetails(payload: CibilIdentityPayload) {
  const response = await generateCibilOtp(payload);

  return {
    otp_flow_id: response.data.otp_flow_id,
    payload,
  };
}
export default function IdentityForm({ onNext }: IdentityFormProps) {
  const [formValues, setFormValues] =
    useState<CibilIdentityPayload>(defaultValues);
  const [fieldErrors, setFieldErrors] = useState<CibilFieldErrors>({});
  const [identityType, setIdentityType] = useState('PAN');
  const identityMutation = useMutation({
    mutationFn: submitIdentityDetails,
    onSuccess: (response) => {
      setFieldErrors({});
      toast.success('Identity details submitted. OTP has been initiated.');
      onNext(response.payload, response.otp_flow_id);
    },
    onError: (error) => {
      const mappedError = mapCibilGenerateOtpError(error);
      setFieldErrors(mappedError.fieldErrors);

      if (mappedError.globalError) {
        toast.error(mappedError.globalError);
      }
    },
  });

  const clearFieldError = (field: CibilGenerateOtpField) => {
    setFieldErrors((current) => {
      if (!current[field]) return current;

      const nextErrors = { ...current };
      delete nextErrors[field];
      return nextErrors;
    });
  };

  const updateField = (
    field: keyof Omit<CibilIdentityPayload, 'identity'>,
    value: string
  ) => {
    clearFieldError(field);
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));  
  };

  const updateIdentityField = (value: string) => {
    clearFieldError('identity');

    setFormValues((current) => ({
      ...current,
      identity: value.toUpperCase(),
    }));
  };

  const updateIdentityType = (value: string) => {
    clearFieldError('identityType');
    clearFieldError('identity');
    setIdentityType(value);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextFieldErrors: CibilFieldErrors = {};

    if (!/^\d{10}$/.test(formValues.mobile_number)) {
      nextFieldErrors.mobile_number = 'Mobile number must contain 10 digits';
    }

    if (!/^\d{6}$/.test(formValues.pincode)) {
      nextFieldErrors.pincode = 'Pincode must contain 6 digits';
    }

    if (!formValues.state) {
      nextFieldErrors.state = 'Please select state';
    }

    if (!formValues.identity.trim()) {
      nextFieldErrors.identity = 'Identity is required';
    }


    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    setFieldErrors({});
    identityMutation.mutate(formValues);
  };

  const getIdentityPlaceholder = () => {
    return (
      identityTypeOptions.find(
        (identity) => identity.value === identityType
      )?.placeholder || 'ABCDE1234F'
    );
  };

  const getInputClassName = (field: CibilGenerateOtpField) => {
    return `w-full px-4 py-2 border rounded-md focus:ring-[#000000] focus:border-[#000000] ${
      fieldErrors[field] ? 'border-red-400' : 'border-gray-300'
    }`;
  };

  const renderFieldError = (field: CibilGenerateOtpField) => {
    if (!fieldErrors[field]) return null;

    return (
      <p className="mt-1 text-xs font-medium text-red-600">
        {fieldErrors[field]}
      </p>
    );
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-sm border border-gray-100">
      <h2 className="text-2xl font-semibold mb-2 text-gray-800">
        Identity Details
      </h2>
      <p className="text-gray-500 mb-6 text-sm">
        Enter the customer details required to initiate the CIBIL consent OTP.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <input
              id="firstName"
              type="text"
              className={getInputClassName('first_name')}
              value={formValues.first_name}
              onChange={(event) => updateField('first_name', event.target.value)}
              placeholder="Rahul"
              required
            />
            {renderFieldError('first_name')}
          </div>
          <div>
            <label htmlFor="middleName" className="block text-sm font-medium text-gray-700 mb-1">
              Middle Name
            </label>
            <input
              id="middleName"
              type="text"
              className={getInputClassName('middle_name')}
              value={formValues.middle_name}
              onChange={(event) => updateField('middle_name', event.target.value)}
              placeholder="Optional"
            />
            {renderFieldError('middle_name')}
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input
              id="lastName"
              type="text"
              className={getInputClassName('last_name')}
              value={formValues.last_name}
              onChange={(event) => updateField('last_name', event.target.value)}
              placeholder="Sharma"
              required
            />
            {renderFieldError('last_name')}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="dob" className="block text-sm font-medium text-gray-700 mb-1">
              Date of Birth
            </label>
            <input
              id="dob"
              type="date"
              className={getInputClassName('date_of_birth')}
              value={formValues.date_of_birth}
              onChange={(event) =>
                updateField('date_of_birth', event.target.value)
              }
              required
            />
            {renderFieldError('date_of_birth')}
          </div>
          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
              Gender
            </label>
            <select
              id="gender"
              className={`${getInputClassName('gender')} bg-white`}
              value={formValues.gender}
              onChange={(event) =>
                updateField('gender', event.target.value as CibilGender)
              }
              required
            >
              <option value="M">Male</option>
              <option value="F">Female</option>
              <option value="T">Transgender</option>
            </select>
            {renderFieldError('gender')}
          </div>
          <div>
            <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-1">
              Mobile Number
            </label>
            <input
              id="mobile"
              type="text"
              inputMode="numeric"
              maxLength={10}
              className={getInputClassName('mobile_number')}
              value={formValues.mobile_number}
              onChange={(event) =>
                updateField('mobile_number', event.target.value)
              }
              placeholder="9876543210"
              required
            />
            {renderFieldError('mobile_number')}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              id="address"
              type="text"
              className={getInputClassName('address')}
              value={formValues.address}
              onChange={(event) => updateField('address', event.target.value)}
              placeholder="123 Example Street"
              required
            />
            {renderFieldError('address')}
          </div>
          <div>
            <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
              State
            </label>
            <select
              id="state"
              className={`${getInputClassName('state')} bg-white`}
              value={formValues.state}
              onChange={(event) => updateField('state', event.target.value)}
              required
            >
              <option value="" >
                -- Select State --
              </option>
              {stateOptions.map((stateCode) => (
                <option key={stateCode.value} value={stateCode.value}>
                  {stateCode.value} - {stateCode.label}
                </option>
              ))}
            </select>
            {renderFieldError('state')}
          </div>
          <div>
            <label htmlFor="pincode" className="block text-sm font-medium text-gray-700 mb-1">
              Pincode
            </label>
            <input
              id="pincode"
              type="text"
              inputMode="numeric"
              maxLength={6}
              className={getInputClassName('pincode')}
              value={formValues.pincode}
              onChange={(event) => updateField('pincode', event.target.value)}
              placeholder="400001"
              required
            />
            {renderFieldError('pincode')}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-4 border-t border-gray-100 pt-6">
          <div>
            <label htmlFor="idType" className="block text-sm font-medium text-gray-700 mb-1">
              ID Type
            </label>
          <select
            id="idType"
            className={`${getInputClassName('identityType')} bg-white`}
            value={identityType}
            onChange={(event) => updateIdentityType(event.target.value)}
            required
          >
          {identityTypeOptions.map((identity) => (
            <option key={identity.value} value={identity.value}>
              {identity.label}
            </option>
          ))}
         </select>
          {renderFieldError('identityType')}
          </div>
          <div>
            <label htmlFor="idNumber" className="block text-sm font-medium text-gray-700 mb-1">
              ID Number
            </label>
            <input
              id="idNumber"
              type="text"
              className={`${getInputClassName('identity')} uppercase`}
              value={formValues.identity}
              onChange={(event) =>
                updateIdentityField(event.target.value)
              }
              placeholder={getIdentityPlaceholder()}
              required
            />
            {renderFieldError('identity')}
          </div>
        </div>

        <button
          type="submit"
          disabled={identityMutation.isPending}
          className="w-full bg-[#000000] hover:bg-[#000000]/50 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-70 flex justify-center items-center"
        >
          {identityMutation.isPending ? (
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
          ) : null}
          {identityMutation.isPending ? 'Submitting...' : 'Continue to OTP'}
        </button>
      </form>
    </div>
  );
}
