
import React from 'react';
import { CheckIcon } from '@heroicons/react/24/solid';

type RequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Verifying';
interface VerificationProgressBarProps {
  status: RequestStatus;
  verificationStatus: string | null;
}

const VerificationProgressBar: React.FC<VerificationProgressBarProps> = ({ status, verificationStatus }) => {
  const steps = [
    { id: 1, name: 'অনুরোধ প্রাপ্ত' },
    { id: 2, name: 'যাচাই চলছে' },
    { id: 3, name: 'যাচাই সম্পন্ন' },
  ];

  const getCurrentStep = () => {
    if (status === 'Approved' || status === 'Rejected' || verificationStatus) {
      return 3;
    }
    if (status === 'Verifying') {
      return 2;
    }
    return 1;
  };

  const currentStep = getCurrentStep();

  return (
    <div>
        <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">যাচাইকরণের অবস্থা</h4>
        <nav aria-label="Progress">
            <ol role="list" className="flex items-center">
                {steps.map((step, stepIdx) => (
                <li key={step.name} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
                    {step.id < currentStep ? (
                    // Completed step
                    <>
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="h-0.5 w-full bg-indigo-600" />
                        </div>
                        <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 hover:bg-indigo-900">
                            <CheckIcon className="h-5 w-5 text-white" aria-hidden="true" />
                            <span className="absolute -bottom-6 text-xs text-center font-medium text-slate-600 dark:text-slate-300">{step.name}</span>
                        </div>
                    </>
                    ) : step.id === currentStep ? (
                    // Current step
                    <>
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="h-0.5 w-full bg-slate-200 dark:bg-slate-600" />
                        </div>
                        <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-indigo-600 bg-white dark:bg-slate-800" aria-current="step">
                             <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" aria-hidden="true" />
                             <span className="absolute -bottom-6 text-xs text-center font-bold text-indigo-600 dark:text-indigo-400">{step.name}</span>
                        </div>
                    </>
                    ) : (
                    // Upcoming step
                    <>
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="h-0.5 w-full bg-slate-200 dark:bg-slate-600" />
                        </div>
                        <div className="group relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-800 hover:border-slate-400">
                            <span className="h-2.5 w-2.5 rounded-full bg-transparent" aria-hidden="true" />
                            <span className="absolute -bottom-6 text-xs text-center font-medium text-slate-500 dark:text-slate-400">{step.name}</span>
                        </div>
                    </>
                    )}
                </li>
                ))}
            </ol>
        </nav>
    </div>
  );
};

export default VerificationProgressBar;
