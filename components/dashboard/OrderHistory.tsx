
import React, { useState, useEffect } from 'react';
import { OrderStatus, OrderHistoryItem } from '../../types';
import { fetchOrderHistory } from '../../services/api';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { EyeIcon, ArrowDownTrayIcon, PrinterIcon } from '@heroicons/react/24/solid';
import { useToast } from '../../context/ToastContext';
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

const OrderDetailsModal: React.FC<{details: OrderHistoryItem}> = ({ details }) => (
    <>
        <div className="space-y-3 text-slate-600 dark:text-slate-300">
            <p><strong>অর্ডার আইডি:</strong> <span className="font-mono">{details.id}</span></p>
            <p><strong>অর্ডারের ধরন:</strong> {details.type === 'Biometric' ? 'বায়োমেট্রিক' : 'কল লিস্ট'}</p>
            <p><strong>মোবাইল:</strong> {details.mobile} ({details.operator})</p>
            
            {details.type === 'Call List' && (
                <p><strong>মেয়াদ:</strong> {details.duration === '3 Months' ? '৩ মাস' : '৬ মাস'}</p>
            )}

            {details.type === 'Biometric' && (
                <>
                    <p><strong>নাম:</strong> {details.customerName || 'N/A'}</p>
                    <p><strong>NID নাম্বার:</strong> {details.nidNumber || 'N/A'}</p>
                    <p><strong>জন্ম তারিখ:</strong> {details.dateOfBirth ? new Date(details.dateOfBirth).toLocaleDateString('bn-BD') : 'N/A'}</p>
                </>
            )}

            <hr className="dark:border-slate-600 my-2"/>
            
            {details.status === OrderStatus.REJECTED && details.rejectionReason && (
                 <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/30 rounded-lg">
                    <p className="font-semibold text-red-700 dark:text-red-300">বাতিলের কারণ:</p>
                    <p className="text-red-600 dark:text-red-400">{details.rejectionReason}</p>
                </div>
            )}
        </div>
        
        {details.status === OrderStatus.COMPLETED && details.pdfUrl && (
            <div className="mt-6 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <a href={details.pdfUrl} target="_blank" rel="noopener noreferrer" className="w-full">
                    <Button>
                        <ArrowDownTrayIcon className="h-5 w-5 mr-2"/>
                        PDF ডাউনলোড করুন
                    </Button>
                </a>
                <Button variant="secondary" onClick={() => details.pdfUrl && printPdf(details.pdfUrl)} className="w-full">
                    <PrinterIcon className="h-5 w-5 mr-2"/>
                    প্রিন্ট করুন
                </Button>
            </div>
        )}
         {details.type === 'Biometric' && details.status === OrderStatus.PENDING && (
            <div className="mt-6">
                 <Button disabled={true} variant="secondary">PDF এখনো পাওয়া যায়নি</Button>
            </div>
        )}
    </>
);


const OrderHistory: React.FC = () => {
    const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<OrderHistoryItem | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        const loadOrders = async () => {
            try {
                const data = await fetchOrderHistory();
                setOrders(data);
            } catch (error) {
                 addToast('অর্ডার লোড করা যায়নি।', 'error');
            } finally {
                setIsLoading(false);
            }
        };
        loadOrders();
    }, [addToast]);
    
    const handleViewDetails = (order: OrderHistoryItem) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
    };

    if (isLoading) {
        return <div className="text-center p-10">লোড হচ্ছে...</div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-200">অর্ডার হিস্টোরি</h1>
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
            {selectedOrder && (
                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="অর্ডারের বিবরণ">
                   <OrderDetailsModal details={selectedOrder} />
                </Modal>
            )}
        </div>
    );
};

export default OrderHistory;
