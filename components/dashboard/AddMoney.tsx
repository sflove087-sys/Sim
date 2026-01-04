import React, { useState, useEffect } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import { addMoneyRequest, apiFetchSettings } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useWallet } from '../../context/WalletContext';
import { ClipboardDocumentIcon, WalletIcon, BanknotesIcon, ArrowLeftIcon, CheckIcon } from '@heroicons/react/24/solid';
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
                                    <div className="h-0.5 w-full bg-teal-600" />
                                </div>
                                <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-teal-600">
                                    <CheckIcon className="h-5 w-5 text-white" aria-hidden="true" />
                                    <span className="absolute -bottom-7 text-xs font-medium text-slate-600 dark:text-slate-300 w-20 text-center">{stepName}</span>
                                </div>
                            </>
                        ) : stepIdx === currentStep - 1 ? ( // Current step
                            <>
                                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                    <div className="h-0.5 w-full bg-slate-200 dark:bg-slate-700" />
                                </div>
                                <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-teal-600 bg-white dark:bg-slate-800" aria-current="step">
                                    <span className="h-2.5 w-2.5 rounded-full bg-teal-600" aria-hidden="true" />
                                    <span className="absolute -bottom-7 text-xs font-bold text-teal-600 dark:text-teal-400 w-20 text-center">{stepName}</span>
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
        setView('details');
    };

    const handleGoBack = () => {
        if (view === 'details') {
            setView('selection');
            setSelectedMethod(null);
        } else if (view === 'selection') {
            setView('amount');
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
    
    const radius = 58;
    const circumference = 2 * Math.PI * radius;
    const progressOffset = circumference - (countdown / 480) * circumference;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <LoadingModal isOpen={isLoading} />
            <div className="flex items-center space-x-3">
                <BanknotesIcon className="h-8 w-8 text-teal-500"/>
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
                            <h3 className="font-bold text-lg text-center mb-1 text-slate-800 dark:text-slate-200">আপনি কত টাকা যোগ করতে চান?</h3>
                            <Input
                                id="amount"
                                label="টাকার পরিমাণ"
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
                        <button onClick={handleGoBack} className="flex items-center text-[13px] font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 transition-colors mb-4">
                            <ArrowLeftIcon className="h-4 w-4 mr-2" />
                            ফিরে যান
                        </button>

                        {isLoadingMethods ? (
                            <div className="flex justify-center p-8"><Spinner size="lg" colorClass="border-teal-500" /></div>
                        ) : paymentMethods.length > 0 ? (
                            <div>
                                <div className="text-center bg-teal-50 dark:bg-slate-700/50 p-3 rounded-lg mb-6">
                                    <p className="text-[13px] text-slate-500 dark:text-slate-400">আপনি যোগ করছেন</p>
                                    <p className="font-bold text-2xl text-teal-600 dark:text-teal-300">৳{toBengaliNumber(amount)}</p>
                                </div>
                                <h3 className="font-bold text-lg text-center mb-4 text-slate-800 dark:text-slate-200">কোন মাধ্যমে টাকা পাঠাতে চান?</h3>
                                <div className="space-y-4">
                                    {paymentMethods.map((method, index) => (
                                        <button 
                                            key={index} 
                                            onClick={() => handleMethodSelect(method)} 
                                            className="w-full flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl cursor-pointer transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-xl border-2 border-slate-100 dark:border-slate-700 hover:border-teal-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                                        >
                                            {method.logoUrl && (
                                                <img 
                                                    src={method.logoUrl} 
                                                    alt={method.name} 
                                                    className="h-10 w-16 object-contain mr-4"
                                                />
                                            )}
                                            <span className="font-bold text-lg text-slate-800 dark:text-slate-200">
                                                {method.name}
                                            </span>
                                        </button>
                                    ))}
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
                    <div className="space-y-8">
                        <button onClick={handleGoBack} className="flex items-center text-[13px] font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 transition-colors">
                            <ArrowLeftIcon className="h-4 w-4 mr-2" />
                            অন্য পদ্ধতি বাছাই করুন
                        </button>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                            {/* Left Column: Instructions & Timer */}
                            <div className="space-y-6">
                                <div className="text-center p-6 rounded-2xl bg-slate-50 dark:bg-slate-700/50">
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">এই সময়ের মধ্যে লেনদেন সম্পন্ন করুন</p>
                                    <div className="relative w-32 h-32 mx-auto">
                                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
                                            <circle className="text-slate-200 dark:text-slate-700" strokeWidth="10" stroke="currentColor" fill="transparent" r={radius} cx="64" cy="64" />
                                            <circle className="text-teal-500" strokeWidth="10" strokeDasharray={circumference} strokeDashoffset={progressOffset} strokeLinecap="round" stroke="currentColor" fill="transparent" r={radius} cx="64" cy="64" style={{ transition: 'stroke-dashoffset 1s linear' }} />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="font-mono text-3xl font-bold text-slate-800 dark:text-slate-200 tracking-widest">{formatTime(countdown)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                     <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">নির্দেশনা</h3>
                                    <p className="text-[13px] text-slate-500 dark:text-slate-400">আপনার {selectedMethod.name} অ্যাপ থেকে নিচের নম্বরে Send Money করুন:</p>
                                </div>
                                <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-lg space-y-3 text-center">
                                    <div className="flex items-center justify-center space-x-3">
                                        {selectedMethod.logoUrl && (
                                            <img src={selectedMethod.logoUrl} alt={selectedMethod.name} className="h-8 w-12 object-contain bg-white rounded-md p-1 shadow-sm" />
                                        )}
                                        <span className="block font-mono text-xl font-bold text-teal-600 dark:text-teal-400">{selectedMethod.number}</span>
                                        <button type="button" onClick={() => handleCopy(selectedMethod.number)} className="flex items-center text-[13px] font-semibold bg-slate-200 dark:bg-slate-600 px-3 py-2 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition" title="নম্বর কপি করুন">
                                            <ClipboardDocumentIcon className="h-5 w-5 mr-2" /> কপি
                                        </button>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">পাঠানোর পরিমাণ</p>
                                        <p className="font-bold text-2xl text-teal-600 dark:text-teal-300">৳{toBengaliNumber(amount)}</p>
                                    </div>
                                </div>
                                 <p className="text-xs text-slate-500 dark:text-slate-400">শুধুমাত্র 'Send Money' অপশন ব্যবহার করুন।</p>
                            </div>
                            {/* Right Column: Form */}
                            <div className="text-center">
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <Input id="amount" label="টাকার পরিমাণ" type="number" value={amount} readOnly className="bg-slate-200 dark:bg-slate-600 cursor-not-allowed text-center" />
                                    <Input id="senderNumber" label="প্রেরক নম্বর (শেষ ৪ ডিজিট)" type="tel" value={senderNumber} onChange={(e) => setSenderNumber(e.target.value)} placeholder="আপনার ব্যবহৃত নম্বরের শেষ ৪টি সংখ্যা" maxLength={4} required className="text-center" />
                                    <Input id="transactionId" label="ট্রানজেকশন আইডি (TxnID)" type="text" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="টাকা পাঠানোর পর মেসেজে পাওয়া TxnID" required className="text-center" />
                                    <div className="pt-2">
                                        <Button type="submit" disabled={isLoading}>অনুরোধ জমা দিন</Button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AddMoney;