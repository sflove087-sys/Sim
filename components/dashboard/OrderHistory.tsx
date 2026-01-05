import React, { useState, useEffect, useCallback } from 'react';
import { OrderStatus, OrderHistoryItem } from '../../types';
import { fetchOrderHistory, apiSendDetailsByEmail } from '../../services/api';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { EyeIcon, ArrowDownTrayIcon, PrinterIcon, EnvelopeIcon, CheckBadgeIcon, InformationCircleIcon, IdentificationIcon, UserIcon, CalendarIcon, DevicePhoneMobileIcon, ClockIcon, SquaresPlusIcon, CheckIcon } from '@heroicons/react/24/solid';
import { useToast } from '../../context/ToastContext';
import { useWallet } from '../../context/WalletContext';
import { toBengaliNumber, printPdf } from '../../utils/formatters';

const StatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => {
    const statusStyles = {
        [OrderStatus.PENDING]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
        [OrderStatus.COMPLETED]: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        [OrderStatus.REJECTED]: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    };
    const statusText = {
        [OrderStatus.PENDING]: 'পেন্ডিং',
        [OrderStatus.COMPLETED]: 'কমপ্লিট',
        [OrderStatus.REJECTED]: 'রিজেক্টেড',
    }
    return (
        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusStyles[status]}`}>
            {statusText[status]}
        </span>
    );
};

const OrderProgressModal: React.FC<{ details: OrderHistoryItem; onClose: () => void }> = ({ details, onClose }) => {
    const steps = ['অর্ডার গৃহীত', 'কাজ চলমান', 'সম্পন্ন'];
    const currentStep = 2; // Always "Work in Progress" for pending orders

    return (
        <Modal isOpen={true} onClose={onClose} title="অর্ডারের অগ্রগতি">
            <div className="space-y-6 pt-4 pb-4">
                 <div className="text-center mb-8">
                    <p className="text-sm text-slate-500 dark:text-slate-400">অর্ডার আইডি: <span className="font-mono">{details.id}</span></p>
                    <p className="font-semibold text-lg text-slate-700 dark:text-slate-300">{details.mobile} ({details.operator})</p>
                </div>
                
                <div className="flex justify-center pb-8 pt-2 px-4 sm:px-0">
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
                                                <span className="h-2.5 w-2.5 rounded-full bg-teal-600 animate-pulse" aria-hidden="true" />
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
                </div>
                
                 <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-center">
                    <p className="text-sm text-blue-700 dark:text-blue-300">আপনার অর্ডারটি প্রক্রিয়াধীন আছে। সম্পন্ন হলে আপনাকে বিস্তারিত তথ্যসহ একটি PDF ফাইল প্রদান করা হবে।</p>
                </div>

                <div className="mt-6">
                    <Button variant="secondary" onClick={onClose}>বন্ধ করুন</Button>
                </div>
            </div>
        </Modal>
    );
};


const OrderDetailsModal: React.FC<{
    details: OrderHistoryItem;
    onClose: () => void;
    onEmailSent: (orderId: string) => void;
}> = ({ details, onClose, onEmailSent }) => {
    const { addToast } = useToast();
    const { refreshWallet } = useWallet();
    const [isSendingEmail, setIsSendingEmail] = useState(false);

    const handleSendEmail = async () => {
        setIsSendingEmail(true);
        try {
            const response = await apiSendDetailsByEmail(details.id, 'order');
            addToast(response.message, 'success');
            onEmailSent(details.id); // Notify parent to update state
            refreshWallet();
        } catch (error) {
            addToast((error as Error).message, 'error');
        } finally {
            setIsSendingEmail(false);
        }
    };
    
    const DetailRow: React.FC<{ icon: React.FC<any>, label: string, value: string | React.ReactNode }> = ({ icon: Icon, label, value }) => (
        <div className="flex items-start space-x-3 text-slate-600 dark:text-slate-300">
            <Icon className="h-5 w-5 mt-0.5 text-slate-400" />
            <div className="flex-1">
                <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                <p className="font-semibold text-[15px]">{value}</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-slate-700/50 dark:to-slate-700 rounded-xl">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">সর্বমোট মূল্য</p>
                        <p className="text-3xl font-bold text-teal-600 dark:text-teal-300">৳{toBengaliNumber(details.price)}</p>
                    </div>
                    <StatusBadge status={details.status} />
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <DetailRow icon={InformationCircleIcon} label="অর্ডার আইডি" value={<span className="font-mono text-sm">{details.id}</span>} />
                <DetailRow icon={SquaresPlusIcon} label="অর্ডারের ধরন" value={details.type === 'Biometric' ? 'বায়োমেট্রিক' : 'কল লিস্ট'} />
                <DetailRow icon={DevicePhoneMobileIcon} label="মোবাইল" value={`${details.mobile} (${details.operator})`} />
                
                {details.type === 'Call List' && (
                    <DetailRow icon={ClockIcon} label="মেয়াদ" value={details.duration === '3 Months' ? '৩ মাস' : '৬ মাস'} />
                )}

                {details.type === 'Biometric' && (
                    <>
                        <DetailRow icon={UserIcon} label="নাম" value={details.customerName || 'N/A'} />
                        <DetailRow icon={IdentificationIcon} label="NID নাম্বার" value={details.nidNumber || 'N/A'} />
                        <DetailRow icon={CalendarIcon} label="জন্ম তারিখ" value={details.dateOfBirth ? new Date(details.dateOfBirth).toLocaleDateString('bn-BD') : 'N/A'} />
                    </>
                )}
            </div>

            {details.status === OrderStatus.REJECTED && details.rejectionReason && (
                 <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/30 rounded-lg">
                    <p className="font-semibold text-red-700 dark:text-red-300">বাতিলের কারণ:</p>
                    <p className="text-red-600 dark:text-red-400">{details.rejectionReason}</p>
                </div>
            )}
            
            <div className="pt-4 space-y-2">
                {details.status === OrderStatus.COMPLETED && details.pdfUrl && (
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                        <a href={details.pdfUrl} target="_blank" rel="noopener noreferrer" className="w-full">
                            <Button><ArrowDownTrayIcon className="h-5 w-5 mr-2"/>PDF ডাউনলোড</Button>
                        </a>
                        <Button variant="secondary" onClick={() => details.pdfUrl && printPdf(details.pdfUrl)} className="w-full">
                            <PrinterIcon className="h-5 w-5 mr-2"/>প্রিন্ট
                        </Button>
                    </div>
                )}
                {details.type === 'Biometric' && details.status === OrderStatus.PENDING && (
                     <Button disabled={true} variant="secondary">PDF এখনো পাওয়া যায়নি</Button>
                )}
                 <Button 
                    variant="secondary" 
                    onClick={handleSendEmail}
                    isLoading={isSendingEmail}
                    disabled={details.isEmailSent || isSendingEmail}
                >
                    {details.isEmailSent ? <CheckBadgeIcon className="h-5 w-5 mr-2 text-green-500" /> : <EnvelopeIcon className="h-5 w-5 mr-2" />}
                    {details.isEmailSent ? 'ইমেইল পাঠানো হয়েছে' : 'বিবরণ ইমেইল করুন (৳৩)'}
                </Button>
                 <Button variant="secondary" onClick={onClose}>বন্ধ করুন</Button>
            </div>
        </div>
    );
};


const OrderHistory: React.FC = () => {
    const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<OrderHistoryItem | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
    const { addToast } = useToast();

    const loadOrders = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await fetchOrderHistory();
            setOrders(data);
        } catch (error) {
             addToast('অর্ডার লোড করা যায়নি।', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        loadOrders();
    }, [loadOrders]);
    
    const handleViewDetails = (order: OrderHistoryItem) => {
        setSelectedOrder(order);
        if (order.status === OrderStatus.PENDING) {
            setIsProgressModalOpen(true);
        } else {
            setIsModalOpen(true);
        }
    };

    const handleEmailSent = (orderId: string) => {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, isEmailSent: true } : o));
        if (selectedOrder?.id === orderId) {
            setSelectedOrder(prev => prev ? { ...prev, isEmailSent: true } : null);
        }
    };

    const SkeletonTable = () => (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-lg overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
                    <tr>
                        <th scope="col" className="px-6 py-3">তারিখ</th>
                        <th scope="col" className="px-6 py-3">অর্ডারের ধরন</th>
                        <th scope="col" className="px-6 py-3">বিবরণ</th>
                        <th scope="col" className="px-6 py-3">মূল্য</th>
                        <th scope="col" className="px-6 py-3">স্ট্যাটাস</th>
                        <th scope="col" className="px-6 py-3">একশন</th>
                    </tr>
                </thead>
                <tbody>
                    {[...Array(5)].map((_, i) => (
                        <tr key={i} className="border-b dark:border-slate-700 animate-pulse">
                            <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div></td>
                            <td className="px-6 py-4"><div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-24"></div></td>
                            <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div></td>
                            <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16"></div></td>
                            <td className="px-6 py-4"><div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-20"></div></td>
                            <td className="px-6 py-4"><div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-full"></div></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="space-y-6">
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-200">অর্ডার হিস্টোরি</h1>
            {isLoading ? <SkeletonTable /> : (
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-lg overflow-x-auto">
                    <table className="w-full min-w-[700px] text-sm text-left text-slate-500 dark:text-slate-400">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
                            <tr>
                                <th scope="col" className="px-6 py-3">তারিখ</th>
                                <th scope="col" className="px-6 py-3">অর্ডারের ধরন</th>
                                <th scope="col" className="px-6 py-3">বিবরণ</th>
                                <th scope="col" className="px-6 py-3">মূল্য</th>
                                <th scope="col" className="px-6 py-3">স্ট্যাটাস</th>
                                <th scope="col" className="px-6 py-3">একশন</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => (
                                <tr key={order.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600/50">
                                    <td className="px-6 py-4">{order.date}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                            order.type === 'Biometric' 
                                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                                            : 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300'
                                        }`}>
                                            {order.type === 'Biometric' ? 'বায়োমেট্রিক' : 'কল লিস্ট'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-semibold">{order.mobile} ({order.operator})</p>
                                        {order.type === 'Call List' && <p className="text-xs text-slate-500">{order.duration === '3 Months' ? '৩ মাস' : '৬ মাস'}</p>}
                                    </td>
                                    <td className="px-6 py-4 font-semibold">৳{toBengaliNumber(order.price)}</td>
                                    <td className="px-6 py-4"><StatusBadge status={order.status} /></td>
                                    <td className="px-6 py-4">
                                        <button onClick={() => handleViewDetails(order)} className="p-2 rounded-full text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/50">
                                            <EyeIcon className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {orders.length === 0 && <p className="text-center p-6 text-slate-500">কোনো অর্ডার পাওয়া যায়নি।</p>}
                </div>
            )}
            {selectedOrder && (
                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="অর্ডারের বিবরণ">
                   <OrderDetailsModal details={selectedOrder} onClose={() => setIsModalOpen(false)} onEmailSent={handleEmailSent} />
                </Modal>
            )}
            {selectedOrder && isProgressModalOpen && (
                <OrderProgressModal details={selectedOrder} onClose={() => setIsProgressModalOpen(false)} />
            )}
        </div>
    );
};

export default OrderHistory;