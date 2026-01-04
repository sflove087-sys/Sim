import React, { useState, useEffect } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import { addMoneyRequest, apiFetchSettings } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useWallet } from '../../context/WalletContext';
import { ClipboardDocumentIcon, WalletIcon, BanknotesIcon, ArrowLeftIcon, CheckIcon, CheckBadgeIcon, CreditCardIcon, BuildingLibraryIcon } from '@heroicons/react/24/solid';
import { DevicePhoneMobileIcon } from '@heroicons/react/24/outline';
import { PaymentMethod } from '../../types';
import Spinner from '../common/Spinner';
import LoadingModal from '../common/LoadingModal';
import { toBengaliNumber } from '../../utils/formatters';

const Stepper: React.FC<{ currentStep: number }> = ({ currentStep }) => {
    const steps = ['পরিমাণ', 'পদ্ধতি', 'তথ্য জমা'];

    return (
        <nav aria-label="Progress">
            <ol role="list" className="flex items-center">
                {steps.map((stepName, stepIdx) => (
                    <li key={stepName} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
                        {stepIdx < currentStep - 1 ? ( // Completed step
                            <>
                                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                    <div className="h-0.5 w-full bg-indigo-600" />
                                </div>
                                <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600">
                                    <CheckIcon className="h-5 w-5 text-white" aria-hidden="true" />
                                    <span className="absolute -bottom-7 text-xs font-medium text-slate-600 dark:text-slate-300 w-20 text-center">{stepName}</span>
                                </div>
                            </>
                        ) : stepIdx === currentStep - 1 ? ( // Current step
                            <>
                                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                    <div className="h-0.5 w-full bg-slate-200 dark:bg-slate-700" />
                                </div>
                                <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-indigo-600 bg-white dark:bg-slate-800" aria-current="step">
                                    <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" aria-hidden="true" />
                                    <span className="absolute -bottom-7 text-xs font-bold text-indigo-600 dark:text-indigo-400 w-20 text-center">{stepName}</span>
                                </div>
                            </>
                        ) : ( // Upcoming step
                            <>
                                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                    <div className="h-0.5 w-full bg-slate-200 dark:bg-slate-700" />
                                </div>
                                <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800">
                                    <span className="absolute -bottom-7 text-xs font-medium text-slate-500 dark:text-slate-400 w-20 text-center">{stepName}</span>
                                </div>
                            </>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
};


const AddMoney: React.FC = () => {
    const [view, setView] = useState<'amount' | 'selection' | 'details'>('amount');
    const [transactionId, setTransactionId] = useState('');
    const [amount, setAmount] = useState('');
    const [senderNumber, setSenderNumber] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
    const [isLoadingMethods, setIsLoadingMethods] = useState(true);
    const [countdown, setCountdown] = useState(480); // 8 minutes in seconds
    const { addToast } = useToast();
    const { refreshWallet } = useWallet();

    const currentStep = view === 'amount' ? 1 : view === 'selection' ? 2 : 3;
    const suggestedAmounts = [500, 1000, 2000, 5000];

    useEffect(() => {
        const loadMethods = async () => {
            setIsLoadingMethods(true);
            try {
                const settings = await apiFetchSettings();
                setPaymentMethods(settings.paymentMethods || []);
            } catch (error) {
                addToast('পেমেন্ট পদ্ধতি লোড করা যায়নি।', 'error');
            } finally {
                setIsLoadingMethods(false);
            }
        };
        loadMethods();
    }, [addToast]);
    
    useEffect(() => {
        if (view !== 'details') return;

        setCountdown(480); // Reset timer
        const timerId = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timerId);
                    addToast('সময় শেষ! অনুগ্রহ করে আবার চেষ্টা করুন।', 'error');
                    setView('amount');
                    setSelectedMethod(null);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timerId);
    }, [view, addToast]);

    const handleAmountSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            addToast('অনুগ্রহ করে সঠিক টাকার পরিমাণ দিন।', 'error');
            return;
        }
        setView('selection');
    };

    const handleMethodSelect = (method: PaymentMethod) => {
        setSelectedMethod(method);
    };
    
    const handleProceedToDetails = () => {
        if (selectedMethod) {
            setView('details');
        } else {
            addToast('অনুগ্রহ করে একটি পেমেন্ট পদ্ধতি নির্বাচন করুন।', 'error');
        }
    };


    const handleGoBack = () => {
        if (view === 'details') {
            setView('selection');
            // Keep selectedMethod so user doesn't have to re-select
        } else if (view === 'selection') {
            setView('amount');
            setSelectedMethod(null);
        }
    };

    const handleCopy = (number: string) => {
        navigator.clipboard.writeText(number);
        addToast('নম্বর কপি করা হয়েছে!', 'success');
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMethod || !transactionId || !amount || !senderNumber) {
            addToast('অনুগ্রহ করে সকল তথ্য পূরণ করুন।', 'error');
            return;
        }
        if (senderNumber.length !== 4) {
             addToast('প্রেরকের নম্বরের শেষ ৪টি সংখ্যা দিন।', 'error');
            return;
        }
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            addToast('অনুগ্রহ করে সঠিক টাকার পরিমাণ দিন।', 'error');
            return;
        }

        setIsLoading(true);
        try {
            const methodString = `${selectedMethod.name} (${selectedMethod.number})`;
            const response = await addMoneyRequest(transactionId, numericAmount, methodString, senderNumber);
            addToast(response.message, 'success');
            refreshWallet();
            setTransactionId('');
            setAmount('');
            setSenderNumber('');
            setSelectedMethod(null);
            setView('amount');
        } catch (error) {
            const err = error as Error;
            addToast(err.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${toBengaliNumber(String(minutes).padStart(2, '0'))}:${toBengaliNumber(String(remainingSeconds).padStart(2, '0'))}`;
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <LoadingModal isOpen={isLoading} />
            <div className="flex items-center space-x-3">
                <BanknotesIcon className="h-8 w-8 text-indigo-500"/>
                <h1 className="text-lg font-bold text-slate-800 dark:text-slate-200">টাকা যোগ করুন</h1>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl shadow-lg">
                <div className="flex justify-center pb-8 pt-2 px-4 sm:px-0">
                    <Stepper currentStep={currentStep} />
                </div>
                <hr className="mb-8 border-slate-200 dark:border-slate-700" />

                {view === 'amount' && (
                    <div className="max-w-md mx-auto text-center">
                        <form onSubmit={handleAmountSubmit} className="space-y-4">
                            <h3 className="font-bold text-lg text-center mb-4 text-slate-800 dark:text-slate-200">আপনি কত টাকা যোগ করতে চান?</h3>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {suggestedAmounts.map(sa => (
                                    <button
                                        type="button"
                                        key={sa}
                                        onClick={() => setAmount(String(sa))}
                                        className={`p-3 rounded-lg font-bold transition-all text-sm ${
                                            amount === String(sa)
                                            ? 'bg-indigo-600 text-white shadow-md'
                                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
                                        }`}
                                    >
                                        ৳{toBengaliNumber(sa)}
                                    </button>
                                ))}
                            </div>
                            
                            <div className="relative flex items-center pt-2">
                                <hr className="w-full border-t border-slate-200 dark:border-slate-700" />
                                <span className="absolute left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 px-2 text-xs text-slate-500">অথবা</span>
                            </div>

                            <Input
                                id="amount"
                                label="টাকার পরিমাণ লিখুন"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="text-center"
                                placeholder="e.g., 500"
                                required
                                autoFocus
                            />
                            <div className="pt-2">
                                <Button type="submit">পরবর্তী ধাপ</Button>
                            </div>
                        </form>
                    </div>
                )}
            
                {view === 'selection' && (
                     <div className="max-w-md mx-auto">
                        <button onClick={handleGoBack} className="flex items-center text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 transition-colors mb-6">
                            <ArrowLeftIcon className="h-4 w-4 mr-1" />
                            টাকার পরিমাণ পরিবর্তন করুন
                        </button>
                        
                        {/* Top Tabs */}
                        <div className="flex items-center justify-center space-x-2 mb-6 p-1 bg-slate-100 dark:bg-slate-700 rounded-xl">
                            <button className="flex-1 flex items-center justify-center space-x-2 text-center py-2 px-2 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300">
                                <CreditCardIcon className="h-5 w-5"/> <span>কার্ড</span>
                            </button>
                            <button className="flex-1 flex items-center justify-center space-x-2 text-center py-2 px-2 rounded-lg text-sm font-bold bg-indigo-600 text-white shadow">
                                <DevicePhoneMobileIcon className="h-5 w-5"/> <span>মোবাইল ব্যাংকিং</span>
                            </button>
                            <button className="flex-1 flex items-center justify-center space-x-2 text-center py-2 px-2 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300">
                                <BuildingLibraryIcon className="h-5 w-5"/> <span>নেট ব্যাংকিং</span>
                            </button>
                        </div>

                        <h3 className="font-semibold text-lg text-left mb-4 text-slate-800 dark:text-slate-200">
                            মোবাইল ব্যাংকিং দিয়ে পেমেন্ট করুন
                        </h3>

                        {isLoadingMethods ? (
                            <div className="flex justify-center p-8"><Spinner size="lg" colorClass="border-indigo-500" /></div>
                        ) : paymentMethods.length > 0 ? (
                            <div>
                                <div role="radiogroup" className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                    {paymentMethods.map((method, index) => (
                                        <button 
                                            key={index} 
                                            role="radio"
                                            aria-checked={selectedMethod?.name === method.name}
                                            onClick={() => handleMethodSelect(method)} 
                                            className={`flex items-center justify-center p-2 aspect-square bg-white dark:bg-slate-800/50 rounded-lg cursor-pointer transition-all duration-200 border-2  
                                                ${selectedMethod?.name === method.name 
                                                    ? 'border-indigo-500 ring-2 ring-indigo-500/20' 
                                                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                                }`}
                                        >
                                            {method.logoUrl ? (
                                                <img src={method.logoUrl} alt={`${method.name} logo`} className="h-full w-full object-contain p-1 sm:p-2" />
                                            ) : (
                                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{method.name}</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                                <div className="mt-8 space-y-4">
                                    <Button
                                        onClick={handleProceedToDetails}
                                        disabled={!selectedMethod}
                                        className="disabled:bg-slate-300 disabled:dark:bg-slate-600 disabled:text-slate-500 disabled:shadow-none"
                                    >
                                        Pay ৳{toBengaliNumber(amount)}
                                    </Button>
                                    <p className="text-xs text-center text-slate-500 dark:text-slate-400 px-4">
                                        "Pay" বাটনে ক্লিক করার মাধ্যমে আপনি আমাদের পরিষেবার শর্তাবলীতে সম্মত হচ্ছেন যা আপনার পেমেন্ট সহজ করার মধ্যে সীমাবদ্ধ।
                                    </p>
                                </div>
                            </div>
                        ) : (
                             <div className="text-center p-8">
                                <WalletIcon className="h-16 w-16 mx-auto text-slate-400" />
                                <p className="mt-4 text-slate-600 dark:text-slate-400 font-semibold">দুঃখিত, এই মুহূর্তে কোনো পেমেন্ট পদ্ধতি উপলব্ধ নেই।</p>
                            </div>
                        )}
                    </div>
                )}
            
                {view === 'details' && selectedMethod && (
                    <div className="max-w-md mx-auto space-y-6">
                        <button onClick={handleGoBack} className="flex items-center text-[13px] font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 transition-colors">
                            <ArrowLeftIcon className="h-4 w-4 mr-2" />
                            অন্য পদ্ধতি বাছাই করুন
                        </button>
                        
                        <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl shadow-lg border dark:border-slate-700 space-y-6">
                            {/* Timer */}
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">সময় বাকি আছে</p>
                                    <span className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200 tracking-widest">{formatTime(countdown)}</span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-1.5 overflow-hidden">
                                    <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${(countdown / 480) * 100}%`, transition: 'width 1s linear' }}></div>
                                </div>
                            </div>
                
                            {/* Instructions */}
                            <div className="text-center space-y-4 bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl">
                                <p className="text-[13px] text-slate-600 dark:text-slate-400">
                                    আপনার {selectedMethod.name} অ্যাপ থেকে নিচের নম্বরে <strong>Send Money</strong> করুন।
                                </p>
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">এই নম্বরে Send Money করুন</p>
                                    <div className="flex items-center justify-center space-x-3">
                                        {selectedMethod.logoUrl && <img src={selectedMethod.logoUrl} alt={selectedMethod.name} className="h-8 w-12 object-contain bg-white rounded-md p-1 shadow-sm" />}
                                        <span className="block font-mono text-2xl font-bold text-indigo-600 dark:text-indigo-400">{selectedMethod.number}</span>
                                        <button type="button" onClick={() => handleCopy(selectedMethod.number)} className="flex items-center text-[13px] font-semibold bg-slate-200 dark:bg-slate-600 px-3 py-2 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition" title="নম্বর কপি করুন">
                                            <ClipboardDocumentIcon className="h-5 w-5 mr-2" /> কপি
                                        </button>
                                    </div>
                                </div>
                                <hr className="border-slate-200 dark:border-slate-600"/>
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">পাঠানোর পরিমাণ</p>
                                    <p className="font-bold text-3xl text-indigo-600 dark:text-indigo-300">৳{toBengaliNumber(amount)}</p>
                                </div>
                            </div>
                
                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 mb-2 text-center">লেনদেনের তথ্য জমা দিন</h3>
                                <Input id="senderNumber" label="প্রেরক নম্বর (শেষ ৪ ডিজিট)" type="tel" value={senderNumber} onChange={(e) => setSenderNumber(e.target.value)} placeholder="আপনার ব্যবহৃত নম্বরের শেষ ৪টি সংখ্যা" maxLength={4} required className="text-center" />
                                <Input id="transactionId" label="ট্রানজেকশন আইডি (TxnID)" type="text" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="টাকা পাঠানোর পর মেসেজে পাওয়া TxnID" required className="text-center" />
                                <div className="pt-2">
                                    <Button type="submit" disabled={isLoading}>
                                        Pay ৳{toBengaliNumber(amount)} Confirm
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AddMoney;