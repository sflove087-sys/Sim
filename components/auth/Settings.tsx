import React, { useState, useEffect, useCallback } from 'react';
import { Settings as AppSettings, PaymentMethod } from '../../types';
import { apiFetchSettings, apiUpdateSettings, apiAdminSendEmailToAllUsers } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Input from '../common/Input';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import { PlusIcon, TrashIcon, PencilIcon, EnvelopeIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import Modal from '../common/Modal';
import LoadingModal from '../common/LoadingModal';

const ToggleSwitch: React.FC<{ enabled: boolean; onChange: (enabled: boolean) => void; label: string }> = ({ enabled, onChange, label }) => (
    <div className="flex items-center justify-between">
        <span className="font-medium text-[15px] text-slate-700 dark:text-slate-300">{label}</span>
        <button
            type="button"
            onClick={() => onChange(!enabled)}
            className={`${enabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900`}
        >
            <span className={`${enabled ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
        </button>
    </div>
);


const Settings: React.FC = () => {
    const [price, setPrice] = useState(0);
    const [callListPrice3Months, setCallListPrice3Months] = useState(0);
    const [callListPrice6Months, setCallListPrice6Months] = useState(0);
    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [notificationEmail, setNotificationEmail] = useState('');
    const [headlineNotices, setHeadlineNotices] = useState<string[]>([]);
    
    // New Toggles & Messages
    const [isAddMoneyVisible, setIsAddMoneyVisible] = useState(true);
    const [isBiometricOrderVisible, setIsBiometricOrderVisible] = useState(true);
    const [isCallListOrderVisible, setIsCallListOrderVisible] = useState(true);
    const [biometricOrderOffMessage, setBiometricOrderOffMessage] = useState('');
    const [callListOrderOffMessage, setCallListOrderOffMessage] = useState('');
    const [emailDetailsCharge, setEmailDetailsCharge] = useState(3);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { addToast } = useToast();

    // Payment method form state
    const [editingPaymentIndex, setEditingPaymentIndex] = useState<number | null>(null);
    const initialNewMethodState = { name: '', type: 'Bkash' as 'Bkash' | 'Nagad' | 'Rocket', number: '', logoUrl: '' };
    const [newMethod, setNewMethod] = useState(initialNewMethodState);

    // Headline notice form state
    const [newNotice, setNewNotice] = useState('');
    const [editingNoticeIndex, setEditingNoticeIndex] = useState<number | null>(null);
    
    // Collapsible sections state
    const [isGeneralSettingsOpen, setIsGeneralSettingsOpen] = useState(true);
    const [isPaymentMethodsOpen, setIsPaymentMethodsOpen] = useState(true);

    // Broadcast email state
    const [isBroadcastEmailModalOpen, setIsBroadcastEmailModalOpen] = useState(false);
    const [broadcastSubject, setBroadcastSubject] = useState('');
    const [broadcastBody, setBroadcastBody] = useState('');
    const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);


    const loadSettings = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await apiFetchSettings();
            setPrice(data.biometricOrderPrice);
            setCallListPrice3Months(data.callListPrice3Months || 900);
            setCallListPrice6Months(data.callListPrice6Months || 1500);
            setMethods(data.paymentMethods || []);
            setNotificationEmail(data.notificationEmail || '');
            setHeadlineNotices(data.headlineNotices || []);
            setIsAddMoneyVisible(data.isAddMoneyVisible ?? true);
            setIsBiometricOrderVisible(data.isBiometricOrderVisible ?? true);
            setIsCallListOrderVisible(data.isCallListOrderVisible ?? true);
            setBiometricOrderOffMessage(data.biometricOrderOffMessage || '');
            setCallListOrderOffMessage(data.callListOrderOffMessage || '');
            setEmailDetailsCharge(data.emailDetailsCharge || 3);
        } catch (error) {
            addToast('সেটিংস লোড করা যায়নি।', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    // --- Payment Method Handlers ---
    const handleNewMethodChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewMethod(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveMethod = () => {
        if (!newMethod.name.trim() || !newMethod.number.trim()) {
            addToast('অনুগ্রহ করে পদ্ধতির নাম এবং নম্বর দিন।', 'error');
            return;
        }
        if (editingPaymentIndex !== null) {
            const updatedMethods = [...methods];
            updatedMethods[editingPaymentIndex] = newMethod;
            setMethods(updatedMethods);
        } else {
            setMethods(prev => [...prev, newMethod]);
        }
        setEditingPaymentIndex(null);
        setNewMethod(initialNewMethodState);
    };
    
    const handleEditMethod = (index: number) => {
        setEditingPaymentIndex(index);
        const methodToEdit = methods[index];
        setNewMethod({ ...methodToEdit, logoUrl: methodToEdit.logoUrl || '' });
    };
    const handleCancelEditMethod = () => {
        setEditingPaymentIndex(null);
        setNewMethod(initialNewMethodState);
    };

    const handleDeleteMethod = (index: number) => {
        if(window.confirm('আপনি কি নিশ্চিতভাবে এই পদ্ধতিটি মুছে ফেলতে চান?')) {
            setMethods(prev => prev.filter((_, i) => i !== index));
        }
    };
    
    // --- Headline Notice Handlers ---
    const handleAddOrUpdateNotice = () => {
        if (!newNotice.trim()) {
            addToast('নোটিশ খালি হতে পারে না।', 'error');
            return;
        }
        if (editingNoticeIndex !== null) {
            const updatedNotices = [...headlineNotices];
            updatedNotices[editingNoticeIndex] = newNotice;
            setHeadlineNotices(updatedNotices);
        } else {
            setHeadlineNotices(prev => [...prev, newNotice]);
        }
        setNewNotice('');
        setEditingNoticeIndex(null);
    };

    const handleEditNotice = (index: number) => {
        setEditingNoticeIndex(index);
        setNewNotice(headlineNotices[index]);
    };
    
    const handleDeleteNotice = (index: number) => {
        setHeadlineNotices(prev => prev.filter((_, i) => i !== index));
    };

    const handleCancelEditNotice = () => {
        setNewNotice('');
        setEditingNoticeIndex(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const settingsToSave: AppSettings = {
            biometricOrderPrice: price,
            callListPrice3Months: callListPrice3Months,
            callListPrice6Months: callListPrice6Months,
            paymentMethods: methods,
            notificationEmail: notificationEmail,
            headlineNotices: headlineNotices,
            isAddMoneyVisible: isAddMoneyVisible,
            isBiometricOrderVisible: isBiometricOrderVisible,
            isCallListOrderVisible: isCallListOrderVisible,
            biometricOrderOffMessage: biometricOrderOffMessage,
            callListOrderOffMessage: callListOrderOffMessage,
            emailDetailsCharge: emailDetailsCharge,
        };

        setIsSaving(true);
        try {
            await apiUpdateSettings(settingsToSave);
            addToast('সেটিংস সফলভাবে সংরক্ষণ করা হয়েছে।', 'success');
        } catch (error) {
            addToast((error as Error).message || 'সেটিংস সংরক্ষণ করা যায়নি।', 'error');
        } finally {
            setIsSaving(false);
        }
    };
    
    // --- Broadcast Email Handlers ---
    const handleCloseBroadcastEmailModal = () => {
        setIsBroadcastEmailModalOpen(false);
        setBroadcastSubject('');
        setBroadcastBody('');
    };
    
    const handleSendBroadcastEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!broadcastSubject.trim() || !broadcastBody.trim()) {
            addToast('অনুগ্রহ করে বিষয় এবং বার্তা লিখুন।', 'error');
            return;
        }
        setIsSendingBroadcast(true);
        try {
            const response = await apiAdminSendEmailToAllUsers(broadcastSubject, broadcastBody);
            addToast(response.message, 'success');
            handleCloseBroadcastEmailModal();
        } catch (error) {
            addToast((error as Error).message, 'error');
        } finally {
            setIsSendingBroadcast(false);
        }
    };


    if (isLoading) {
        return <div className="flex justify-center p-10"><Spinner size="lg" /></div>;
    }

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <LoadingModal isOpen={isSendingBroadcast} />
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-200">অ্যাপ সেটিংস</h1>
            <form onSubmit={handleSubmit} className="space-y-8">
                
                 <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                    <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 border-b pb-3 mb-6 dark:border-slate-600">অ্যাপ নিয়ন্ত্রণ</h2>
                    <div className="space-y-6">
                        <ToggleSwitch label="টাকা যোগ মেন্যু দেখান" enabled={isAddMoneyVisible} onChange={setIsAddMoneyVisible} />
                         <div className="space-y-2 p-3 border rounded-lg dark:border-slate-700">
                            <ToggleSwitch label="বায়োমেট্রিক অর্ডার মেন্যু দেখান" enabled={isBiometricOrderVisible} onChange={setIsBiometricOrderVisible} />
                            {!isBiometricOrderVisible && (
                                <Input id="biometricOrderOffMessage" label="বায়োমেট্রিক অর্ডার বন্ধের বার্তা" type="text" value={biometricOrderOffMessage} onChange={e => setBiometricOrderOffMessage(e.target.value)} />
                            )}
                        </div>
                        <div className="space-y-2 p-3 border rounded-lg dark:border-slate-700">
                            <ToggleSwitch label="কল লিস্ট অর্ডার মেন্যু দেখান" enabled={isCallListOrderVisible} onChange={setIsCallListOrderVisible} />
                             {!isCallListOrderVisible && (
                                <Input id="callListOrderOffMessage" label="কল লিস্ট অর্ডার বন্ধের বার্তা" type="text" value={callListOrderOffMessage} onChange={e => setCallListOrderOffMessage(e.target.value)} />
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                    <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 border-b pb-3 mb-6 dark:border-slate-600">যোগাযোগ</h2>
                     <Button type="button" onClick={() => setIsBroadcastEmailModalOpen(true)}>
                        <EnvelopeIcon className="h-5 w-5 mr-2" />
                        সকল ব্যবহারকারীকে ইমেইল পাঠান
                    </Button>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                    <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 border-b pb-3 mb-6 dark:border-slate-600">হেডলাইন নোটিশসমূহ</h2>
                     {headlineNotices.map((notice, index) => (
                        <div key={index} className="flex items-center justify-between p-3 mb-2 bg-slate-50 dark:bg-slate-700 rounded-lg">
                            <p className="text-[13px] text-slate-700 dark:text-slate-300 flex-1 pr-4">{notice}</p>
                            <div className="flex items-center space-x-1 flex-shrink-0">
                                <button type="button" onClick={() => handleEditNotice(index)} className="p-2 text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-full"><PencilIcon className="h-5 w-5" /></button>
                                <button type="button" onClick={() => handleDeleteNotice(index)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"><TrashIcon className="h-5 w-5" /></button>
                            </div>
                        </div>
                     ))}
                     {headlineNotices.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-2">কোনো নোটিশ যোগ করা হয়নি।</p>}
                     <div className="mt-4 pt-4 border-t dark:border-slate-600 space-y-2">
                         <label htmlFor="newNotice" className="block text-[13px] font-medium text-slate-700 dark:text-slate-300">{editingNoticeIndex !== null ? 'নোটিশ এডিট করুন' : 'নতুন নোটিশ যোগ করুন'}</label>
                        <textarea id="newNotice" rows={3} value={newNotice} onChange={(e) => setNewNotice(e.target.value)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="একটি নোটিশ লিখুন..." />
                        <div className="flex space-x-2">
                             <Button type="button" variant="secondary" onClick={handleAddOrUpdateNotice}>{editingNoticeIndex !== null ? 'আপডেট করুন' : 'যোগ করুন'}</Button>
                             {editingNoticeIndex !== null && <Button type="button" variant="secondary" onClick={handleCancelEditNotice}>বাতিল</Button>}
                        </div>
                     </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden">
                    <button type="button" onClick={() => setIsGeneralSettingsOpen(v => !v)} className="w-full flex justify-between items-center p-6 text-left">
                        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">সাধারণ সেটিংস</h2>
                        <ChevronDownIcon className={`h-6 w-6 text-slate-500 transition-transform ${isGeneralSettingsOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <div className={`transition-all duration-500 ease-in-out ${isGeneralSettingsOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="px-6 pb-6">
                            <div className="space-y-4 border-t pt-6 dark:border-slate-700">
                                <Input id="biometricOrderPrice" name="biometricOrderPrice" label="বায়োমেট্রিক অর্ডার মূল্য (৳)" type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} required />
                                <Input id="callListPrice3Months" name="callListPrice3Months" label="কল লিস্ট ৩ মাস মূল্য (৳)" type="number" value={callListPrice3Months} onChange={(e) => setCallListPrice3Months(Number(e.target.value))} required />
                                <Input id="callListPrice6Months" name="callListPrice6Months" label="কল লিস্ট ৬ মাস মূল্য (৳)" type="number" value={callListPrice6Months} onChange={(e) => setCallListPrice6Months(Number(e.target.value))} required />
                                <Input id="emailDetailsCharge" name="emailDetailsCharge" label="ইমেইল চার্জ (৳)" type="number" value={emailDetailsCharge} onChange={(e) => setEmailDetailsCharge(Number(e.target.value))} required />
                                <Input id="notificationEmail" name="notificationEmail" label="নোটিফিকেশন ইমেইল" type="email" value={notificationEmail} onChange={(e) => setNotificationEmail(e.target.value)} placeholder="admin@example.com" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden">
                     <button type="button" onClick={() => setIsPaymentMethodsOpen(v => !v)} className="w-full flex justify-between items-center p-6 text-left">
                        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">পেমেন্ট পদ্ধতি</h2>
                        <ChevronDownIcon className={`h-6 w-6 text-slate-500 transition-transform ${isPaymentMethodsOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <div className={`transition-all duration-500 ease-in-out ${isPaymentMethodsOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="px-6 pb-6">
                            <div className="space-y-6 border-t pt-6 dark:border-slate-700">
                                {methods.map((method, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                                        <div className="flex items-center space-x-4">
                                            {method.logoUrl && <img src={method.logoUrl} alt={method.name} className="h-10 w-10 rounded-md object-contain bg-white p-1 shadow" />}
                                            <div>
                                                <p className="font-semibold text-base text-slate-800 dark:text-slate-200">{method.name} ({method.type})</p>
                                                <p className="text-[13px] font-mono text-slate-600 dark:text-slate-400">{method.number}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <button type="button" onClick={() => handleEditMethod(index)} className="p-2 text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-full"><PencilIcon className="h-5 w-5" /></button>
                                            <button type="button" onClick={() => handleDeleteMethod(index)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"><TrashIcon className="h-5 w-5" /></button>
                                        </div>
                                    </div>
                                ))}
                                <div className={`border-t pt-6 dark:border-slate-600 space-y-4 p-4 rounded-lg ${editingPaymentIndex !== null ? 'ring-2 ring-indigo-500' : ''}`}>
                                    <h3 className="font-semibold text-base text-slate-700 dark:text-slate-300">{editingPaymentIndex !== null ? 'পদ্ধতি এডিট করুন' : 'নতুন পদ্ধতি যোগ করুন'}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input id="new-name" name="name" label="পদ্ধতির নাম" value={newMethod.name} onChange={handleNewMethodChange} />
                                        <Input id="new-number" name="number" label="একাউন্ট নম্বর" type="tel" value={newMethod.number} onChange={handleNewMethodChange} />
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label htmlFor="new-type" className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1">ধরন</label>
                                            <select id="new-type" name="type" value={newMethod.type} onChange={handleNewMethodChange} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"><option>Bkash</option><option>Nagad</option><option>Rocket</option></select>
                                        </div>
                                        <Input id="new-logoUrl" name="logoUrl" label="লোগো URL (ঐচ্ছিক)" value={newMethod.logoUrl} onChange={handleNewMethodChange} placeholder="https://.../logo.png" />
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button type="button" variant="secondary" onClick={handleSaveMethod}>{editingPaymentIndex !== null ? 'আপডেট করুন' : <><PlusIcon className="h-5 w-5 mr-2" /> যোগ করুন</>}</Button>
                                        {editingPaymentIndex !== null && (<Button type="button" variant="secondary" onClick={handleCancelEditMethod}>বাতিল</Button>)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <Button type="submit" isLoading={isSaving}>সকল পরিবর্তন সংরক্ষণ করুন</Button>
                </div>
            </form>
            
            <Modal isOpen={isBroadcastEmailModalOpen} onClose={handleCloseBroadcastEmailModal} title="সকল ব্যবহারকারীকে ইমেইল পাঠান">
                <form onSubmit={handleSendBroadcastEmail} className="space-y-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400">এই বার্তাটি আপনার সকল নিবন্ধিত ব্যবহারকারীর কাছে পাঠানো হবে।</p>
                    <Input id="broadcastSubject" label="বিষয়" type="text" value={broadcastSubject} onChange={e => setBroadcastSubject(e.target.value)} required />
                    <div>
                        <label htmlFor="broadcastBody" className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">বার্তা</label>
                        <textarea id="broadcastBody" rows={6} value={broadcastBody} onChange={e => setBroadcastBody(e.target.value)} className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition duration-200" required></textarea>
                    </div>
                    <div className="flex space-x-3 pt-2">
                        <Button type="button" variant="secondary" onClick={handleCloseBroadcastEmailModal} className="w-1/2">বাতিল</Button>
                        <Button type="submit" isLoading={isSendingBroadcast} className="w-1/2">ইমেইল পাঠান</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Settings;