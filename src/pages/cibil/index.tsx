import { useState } from 'react';

import IdentityForm from './IdentityForm';
import OTPVerification from './OTPVerification';
import ReportStatus from './ReportStatus';
import ViewReport from './ViewReport';
import type { CibilIdentityPayload, CibilStep } from './types';

const stepLabels: Record<CibilStep, string> = {
  1: 'Identity',
  2: 'OTP',
  3: 'Status',
  4: 'Report',
};

export default function CibilWorkflow() {
  const [currentStep, setCurrentStep] = useState<CibilStep>(1);
  const [identityPayload, setIdentityPayload] =
    useState<CibilIdentityPayload | null>(null);
  const [otpFlowId, setOtpFlowId] = useState('');
  const [reference_id, setreference_id] = useState<string | undefined>();

  const handleIdentitySubmitted = (
    payload: CibilIdentityPayload,
    newOtpFlowId: string
  ) => {
    setIdentityPayload(payload);
    setOtpFlowId(newOtpFlowId);
    setCurrentStep(2);
  };

  const handleVerified = () => {
    setCurrentStep(3);
  };

  const handleViewReport = (newreference_id?: string) => {
    setreference_id(newreference_id);
    setCurrentStep(4);
  };

  const handleStartNew = () => {
    setIdentityPayload(null);
    setOtpFlowId('');
    setreference_id(undefined);
    setCurrentStep(1);
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {([1, 2, 3, 4] as CibilStep[]).map((step) => (
            <div key={step} className="flex flex-col items-center flex-1">
              <div className="flex items-center w-full">
                <div
                  className={`w-full h-1 ${step === 1
                      ? 'bg-transparent'
                      : currentStep >= step
                        ? 'bg-black'
                        : 'bg-gray-200'
                    }`}
                />
                <div
                  className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full border-2 ${currentStep === step
                      ? 'border-black bg-black text-white shadow-md'
                      : currentStep > step
                        ? 'border-black bg-black text-white'
                        : 'border-gray-300 bg-white text-gray-500'
                    } font-semibold text-sm transition-colors duration-300`}
                >
                  {currentStep > step ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    step
                  )}
                </div>
                <div
                  className={`w-full h-1 ${step === 4
                      ? 'bg-transparent'
                      : currentStep > step
                        ? 'bg-black'
                        : 'bg-gray-200'
                    }`}
                />
              </div>
              <span
                className={`text-xs mt-2 font-medium ${currentStep >= step ? 'text-black' : 'text-gray-400'
                  }`}
              >
                {stepLabels[step]}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8">
        {currentStep === 1 && (
          <IdentityForm onNext={handleIdentitySubmitted} />
        )}

        {currentStep === 2 && identityPayload && otpFlowId && (
          <OTPVerification
            otpFlowId={otpFlowId}
            mobileNumber={identityPayload.mobile_number}
            onBack={() => setCurrentStep(1)}
            onVerified={handleVerified}
          />
        )}

        {currentStep === 3 && otpFlowId && (
          <ReportStatus
            otpFlowId={otpFlowId}
            onBack={() => setCurrentStep(2)}
            onViewReport={handleViewReport}
          />
        )}

        {currentStep === 4 && (
          <ViewReport
            reference_id={reference_id}
            onBack={() => setCurrentStep(3)}
            onStartNew={handleStartNew}
          />
        )}
      </div>
    </div>
  );
}

