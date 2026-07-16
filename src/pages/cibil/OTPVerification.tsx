import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { resendCibilOtp, validateCibilOtp } from '@/pages/cibil/api';

interface OTPVerificationProps {
  otpFlowId: string;
  mobileNumber: string;
  onBack: () => void;
  onVerified: () => void;
}

const RESEND_SECONDS = 30;

export default function OTPVerification({
  otpFlowId,
  mobileNumber,
  onBack,
  onVerified,
}: OTPVerificationProps) {
  const [otp, setOtp] = useState('');
  const [secondsRemaining, setSecondsRemaining] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (secondsRemaining <= 0) return;

    const timer = window.setTimeout(() => {
      setSecondsRemaining((current) => current - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [secondsRemaining]);

  const verifyMutation = useMutation({
    mutationFn: (payload: Parameters<typeof validateCibilOtp>[0]) =>
      validateCibilOtp(payload),
    onSuccess: () => {
      toast.success('OTP verified successfully');
      onVerified();
    },
    onError: () => {
      toast.error('Unable to verify OTP. Please try again.');
    },
  });

  const resendMutation = useMutation({
    mutationFn: (nextOtpFlowId: string) =>
      resendCibilOtp({ otp_flow_id: nextOtpFlowId }),
    onSuccess: () => {
      setOtp('');
      setSecondsRemaining(RESEND_SECONDS);
      toast.success('OTP resent successfully');
    },
    onError: () => {
      toast.error('Unable to resend OTP. Please try again.');
    },
  });

  const handleVerify = (event: React.FormEvent) => {
    event.preventDefault();

    if (otp.trim().length < 4) {
      toast.error('Please enter a valid OTP');
      return;
    }

    verifyMutation.mutate({ otp_flow_id: otpFlowId, otp });
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="flex items-center mb-6">
        <button
          type="button"
          onClick={onBack}
          className="text-gray-500 hover:text-gray-800 mr-3"
          disabled={verifyMutation.isPending}
        >
          Back
        </button>
        <h2 className="text-2xl font-semibold text-gray-800">
          OTP Verification
        </h2>
      </div>

      <p className="text-gray-500 text-sm mb-6">
        Enter the OTP sent to the customer's mobile number{' '}
        <span className="font-semibold text-gray-700">{mobileNumber}</span>.
      </p>

      <form onSubmit={handleVerify} className="space-y-4">
        <div>
          <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
            One-Time Password
          </label>
          <input
            id="otp"
            type="text"
            inputMode="numeric"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#000000] focus:border-[#000000] text-center tracking-widest text-lg"
            value={otp}
            onChange={(event) => setOtp(event.target.value)}
            placeholder="Enter OTP"
            maxLength={6}
            required
          />
        </div>

        <button
          type="submit"
          disabled={verifyMutation.isPending}
          className="w-full bg-[#000000] hover:bg-[#000000]/50 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-70 flex justify-center items-center"
        >
          {verifyMutation.isPending ? (
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
          ) : null}
          {verifyMutation.isPending ? 'Verifying...' : 'Verify OTP'}
        </button>
      </form>

      <div className="text-center mt-5">
        <button
          type="button"
          onClick={() => resendMutation.mutate(otpFlowId)}
          disabled={secondsRemaining > 0 || resendMutation.isPending}
          className="text-sm font-medium text-[#000000] hover:underline disabled:text-gray-400 disabled:no-underline"
        >
          {resendMutation.isPending
            ? 'Resending...'
            : secondsRemaining > 0
              ? `Resend OTP in ${secondsRemaining}s`
              : 'Resend OTP'}
        </button>
      </div>
    </div>
  );
}