
import React, { useState, useEffect } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import { addMoneyRequest, apiFetchSettings } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useWallet } from '../../context/WalletContext';
import { ClipboardDocumentIcon, WalletIcon } from '@heroicons/react/24/outline';
import { PaymentMethod } from '../../types';
import Spinner from '../common/Spinner';

const AddMoney: React.FC = () => {
    const [transactionId, setTransactionId] = useState('');
    const [amount, setAmount] = useState('');
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
        if (!transactionId || !amount) {
            addToast('অনুগ্রহ করে সকল তথ্য পূরণ করুন।', 'error');
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
            const response = await addMoneyRequest(transactionId, numericAmount, methodString);
            addToast(response.message, 'success');
            refreshWallet();
            setTransactionId('');
            setAmount('');
            setSelectedMethod(null);

        } catch (error) {
            const err = error as Error;
            addToast(err.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-200">টাকা যোগ করুন</h1>
            
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                <h3 className="font-semibold text-lg mb-2 text-slate-700 dark:text-slate-300">নির্দেশনা:</h3>
                <p className="text-slate-600 dark:text-slate-400">
                    নিচের ফর্ম থেকে আপনার পছন্দের পেমেন্ট পদ্ধতি বাছাই করুন, প্রদর্শিত নম্বরে টাকা পাঠিয়ে লেনদেনের বিবরণ জমা দিন।
                </p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                {isLoadingMethods ? (
                    <div className="flex justify-center p-4"><Spinner /></div>
                ) : paymentMethods.length > 0 ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                পেমেন্ট পদ্ধতি বাছাই করুন
                            </label>
                            <div className="space-y-3">
                                {paymentMethods.map((method, index) => (
                                    <div key={index}>
                                        <input 
                                            type="radio" 
                                            id={`method-${index}`} 
                                            name="paymentMethod" 
                                            value={method.name} 
                                            checked={selectedMethod === method}
                                            onChange={() => setSelectedMethod(method)}
                                            className="hidden peer"
                                        />
                                        <label 
                                            htmlFor={`method-${index}`} 
                                            className="flex items-center p-3 border rounded-lg cursor-pointer transition-all duration-200 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 peer-checked:bg-indigo-50 dark:peer-checked:bg-slate-700 peer-checked:border-indigo-500 peer-checked:ring-2 peer-checked:ring-indigo-500"
                                        >
                                            {method.logoUrl && <img src={method.logoUrl} alt={method.name} className="h-8 w-12 object-contain mr-4"/>}
                                            <div className="flex-grow">
                                                <p className="font-semibold text-slate-800 dark:text-slate-200">{method.name}</p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">{method.type}</p>
                                            </div>
                                            <div className={`w-5 h-5 rounded-full border-2 transition ${selectedMethod === method ? 'bg-indigo-600 border-indigo-600' : 'border-slate-400'}`}></div>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        {selectedMethod && (
                             <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg flex items-center justify-between transition-all duration-300 animate-fade-in">
                                <div>
                                    <span className="text-sm text-slate-600 dark:text-slate-400">টাকা পাঠান এই নম্বরে ({selectedMethod.name})</span>
                                    <span className="block font-mono text-xl text-indigo-600 dark:text-indigo-400">{selectedMethod.number}</span>
                                </div>
                                <button type="button" onClick={() => handleCopy(selectedMethod.number)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition" title="নম্বর কপি করুন">
                                    <ClipboardDocumentIcon className="h-6 w-6 text-slate-500 dark:text-slate-300" />
                                </button>
                            </div>
                        )}
                        
                        <div className="space-y-4 pt-2">
                             <Input
                                id="amount"
                                label="টাকার পরিমাণ"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="যেমন: ৫০০"
                                required
                                disabled={!selectedMethod}
                            />
                            <Input
                                id="transactionId"
                                label="ট্রানজেকশন আইডি"
                                type="text"
                                value={transactionId}
                                onChange={(e) => setTransactionId(e.target.value)}
                                placeholder="যেমন: 9C7B4F2A1D"
                                required
                                disabled={!selectedMethod}
                            />
                        </div>
                        <Button type="submit" isLoading={isLoading} disabled={!selectedMethod}>
                            অনুরোধ পাঠান
                        </Button>
                    </form>
                ) : (
                    <div className="text-center p-6 bg-slate-50 dark:bg-slate-700 rounded-lg">
                        <WalletIcon className="h-12 w-12 mx-auto text-slate-400" />
                        <p className="mt-2 text-slate-500 dark:text-slate-400">অ্যাডমিন কোনো পেমেন্ট পদ্ধতি যোগ করেননি।</p>
                    </div>
                )}
            </div>
             <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default AddMoney;