import React, { useState, useEffect } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import { addMoneyRequest, apiFetchSettings } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useWallet } from '../../context/WalletContext';
import { ClipboardDocumentIcon, WalletIcon, BanknotesIcon, CheckCircleIcon, ArrowLeftIcon } from '@heroicons/react/24/solid';
import { PaymentMethod } from '../../types';
import Spinner from '../common/Spinner';
import LoadingModal from '../common/LoadingModal';

const AddMoney: React.FC = () => {
    const [transactionId, setTransactionId] = useState('');
    const [amount, setAmount] = useState('');
    const [senderNumber, setSenderNumber] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
    const [isLoadingMethods, setIsLoadingMethods] = useState(true);
    const { addToast } = useToast();
    const { refreshWallet } = useWallet();

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

    const handleCopy = (number: string) => {
        navigator.clipboard.writeText(number);
        addToast('নম্বর কপি করা হয়েছে!', 'success');
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMethod) {
            addToast('অনুগ্রহ করে একটি পেমেন্ট পদ্ধতি বাছাই করুন।', 'error');
            return;
        }
        if (!transactionId || !amount || !senderNumber) {
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

        } catch (error) {
            const err = error as Error;
            addToast(err.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const step = selectedMethod ? 2 : 1;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <LoadingModal isOpen={isLoading} />
             <style>{`
                @keyframes fade-in-slide-down {
                    0% { opacity: 0; transform: translateY(-10px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-slide-down {
                    animation: fade-in-slide-down 0.5s ease-out forwards;
                }
            `}</style>

            <div className="flex items-center space-x-3">
                <BanknotesIcon className="h-8 w-8 text-indigo-500"/>
                <h1 className="text-lg font-bold text-slate-800 dark:text-slate-200">টাকা যোগ করুন</h1>
            </div>
            
            {/* Step Indicator */}
            <div className="flex items-center space-x-2">
                <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
                    <CheckCircleIcon className="h-6 w-6"/>
                    <span className="font-semibold text-[13px]">পদ্ধতি বাছাই</span>
                </div>
                <div className={`flex-1 h-0.5 ${step > 1 ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
                     <CheckCircleIcon className={`h-6 w-6 transition-transform ${step >= 2 ? 'scale-100' : 'scale-0'}`}/>
                    <span className="font-semibold text-[13px]">বিবরণ জমা</span>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                {isLoadingMethods ? (
                    <div className="flex justify-center p-8"><Spinner size="lg" colorClass="border-indigo-500" /></div>
                ) : paymentMethods.length > 0 ? (
                    <>
                        {!selectedMethod ? (
                            <div className="animate-fade-in-slide-down">
                                <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-200">ধাপ ১: পেমেন্ট পদ্ধতি বাছাই করুন</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {paymentMethods.map((method, index) => (
                                        <button 
                                            key={index}
                                            onClick={() => setSelectedMethod(method)}
                                            className="flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer transition-all duration-200 border-slate-300 dark:border-slate-600 hover:border-indigo-500 hover:shadow-md hover:-translate-y-1"
                                        >
                                            {method.logoUrl ? 
                                                <img src={method.logoUrl} alt={method.name} className="h-12 object-contain mb-2"/>
                                                : <div className="h-12 flex items-center justify-center font-bold text-xl">{method.name}</div>
                                            }
                                            <p className="text-[13px] font-medium text-slate-600 dark:text-slate-400">{method.type}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="animate-fade-in-slide-down">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">ধাপ ২: টাকা পাঠিয়ে তথ্য জমা দিন</h3>
                                        <div className="flex items-center mt-2 p-2 pr-3 bg-indigo-50 dark:bg-slate-700 rounded-lg w-fit">
                                            {selectedMethod.logoUrl && <img src={selectedMethod.logoUrl} alt={selectedMethod.name} className="h-6 object-contain mr-2"/>}
                                            <span className="font-semibold text-indigo-700 dark:text-indigo-300">{selectedMethod.name}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedMethod(null)} className="flex items-center text-[13px] font-medium text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400">
                                        <ArrowLeftIcon className="h-4 w-4 mr-1"/> পরিবর্তন করুন
                                    </button>
                                </div>

                                <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-lg mb-6">
                                    <p className="text-[13px] font-medium text-slate-600 dark:text-slate-400">আপনার {selectedMethod.name} অ্যাপ থেকে নিচের নম্বরে Send Money করুন:</p>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="block font-mono text-2xl font-bold text-indigo-600 dark:text-indigo-400">{selectedMethod.number}</span>
                                        <button type="button" onClick={() => handleCopy(selectedMethod.number)} className="flex items-center text-[13px] font-semibold bg-slate-200 dark:bg-slate-600 px-3 py-2 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition" title="নম্বর কপি করুন">
                                            <ClipboardDocumentIcon className="h-5 w-5 mr-2" />
                                            কপি
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">শুধুমাত্র 'Send Money' অপশন ব্যবহার করুন। রেফারেন্সে কিছু লেখার প্রয়োজন নেই।</p>
                                </div>
                                
                                <form onSubmit={handleSubmit} className="space-y-4">
                                     <Input
                                        id="amount"
                                        label="টাকার পরিমাণ"
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="আপনি কত টাকা পাঠিয়েছেন?"
                                        required
                                    />
                                     <Input
                                        id="senderNumber"
                                        label="প্রেরক নম্বর (শেষ ৪ ডিজিট)"
                                        type="tel"
                                        value={senderNumber}
                                        onChange={(e) => setSenderNumber(e.target.value)}
                                        placeholder="যে নম্বর থেকে টাকা পাঠিয়েছেন তার শেষ ৪টি সংখ্যা"
                                        maxLength={4}
                                        required
                                    />
                                    <Input
                                        id="transactionId"
                                        label="ট্রানজেকশন আইডি (TxnID)"
                                        type="text"
                                        value={transactionId}
                                        onChange={(e) => setTransactionId(e.target.value)}
                                        placeholder="টাকা পাঠানোর পর মেসেজে পাওয়া TxnID দিন"
                                        required
                                    />
                                    <div className="pt-2">
                                        <Button type="submit" disabled={isLoading}>
                                            অনুরোধ জমা দিন
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center p-8 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <WalletIcon className="h-16 w-16 mx-auto text-slate-400" />
                        <p className="mt-4 text-slate-600 dark:text-slate-400 font-semibold">দুঃখিত, এই মুহূর্তে কোনো পেমেন্ট পদ্ধতি উপলব্ধ নেই।</p>
                        <p className="mt-1 text-[13px] text-slate-500">অনুগ্রহ করে পরে আবার চেষ্টা করুন অথবা সাপোর্টে যোগাযোগ করুন।</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AddMoney;
