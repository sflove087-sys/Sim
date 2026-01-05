import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CallListOrder, OrderStatus, User } from '../../types';
import { fetchCallListOrders, updateCallListOrderStatus, uploadCallListOrderPdf, fetchAllUsers } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { toBengaliNumber, printPdf } from '../../utils/formatters';
import { DocumentArrowUpIcon, LinkIcon, PrinterIcon, MagnifyingGlassIcon, EyeIcon, UserCircleIcon } from '@heroicons/react/24/solid';
import LoadingModal from '../common/LoadingModal';

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

const ManageCallListOrders: React.FC = () => {
    const [orders, setOrders] = useState<CallListOrder[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<CallListOrder | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { addToast } = useToast();

    const loadOrders = useCallback(async () => {
        setIsLoading(true);
        try {
            const [data, usersData] = await Promise.all([
                fetchCallListOrders(),
                fetchAllUsers(1, 10000)
            ]);
            setOrders(data);
            setUsers(usersData.users);
        } catch (error) {
            addToast('কল লিস্ট অর্ডার বা ব্যবহারকারীদের তথ্য লোড করা যায়নি।', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    const filteredOrders = useMemo(() => {
        if (!searchTerm.trim()) {
            return orders;
        }
        const lowercasedFilter = searchTerm.toLowerCase();
        return orders.filter(order =>
            order.mobile.toLowerCase().includes(lowercasedFilter) ||
            order.userId.toLowerCase().includes(lowercasedFilter)
        );
    }, [orders, searchTerm]);

    const handleOpenRejectModal = (order: CallListOrder) => {
        setSelectedOrder(order);
        setIsRejectModalOpen(true);
    };

    const handleCloseRejectModal = () => {
        setIsRejectModalOpen(false);
        setRejectionReason('');
        setSelectedOrder(null);
    };
    
    const handleOpenPdfModal = (order: CallListOrder) => {
        setSelectedOrder(order);
        setIsPdfModalOpen(true);
    };

    const handleClosePdfModal = () => {
        setIsPdfModalOpen(false);
        setSelectedFile(null);
        setSelectedOrder(null);
    };
    
    const handleViewDetails = (order: CallListOrder) => {
        setSelectedOrder(order);
        setIsDetailsModalOpen(true);
    };

    const handleConfirmRejection = async () => {
        if (!selectedOrder || !rejectionReason.trim()) {
            addToast('অনুগ্রহ করে বাতিলের কারণ উল্লেখ করুন।', 'error');
            return;
        }
        setIsSubmitting(true);
        try {
            await updateCallListOrderStatus(selectedOrder.id, OrderStatus.REJECTED, rejectionReason);
            addToast('অর্ডার সফলভাবে বাতিল করা হয়েছে।', 'success');
            handleCloseRejectModal();
            loadOrders();
        } catch (error) {
            addToast((error as Error).message || 'অর্ডার বাতিল করা যায়নি।', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
        setUpdatingStatusId(orderId);
        try {
            await updateCallListOrderStatus(orderId, newStatus);
            addToast('স্ট্যাটাস সফলভাবে পরিবর্তন করা হয়েছে।', 'success');
            loadOrders();
        } catch (error) {
            addToast((error as Error).message || 'স্ট্যাটাস পরিবর্তন করা যায়নি।', 'error');
        } finally {
            setUpdatingStatusId(null);
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            if (event.target.files[0].type !== 'application/pdf') {
                addToast('শুধুমাত্র PDF ফাইল আপলোড করা যাবে।', 'error');
                return;
            }
            setSelectedFile(event.target.files[0]);
        }
    };

    const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });

    const handlePdfUpload = async () => {
        if (!selectedFile || !selectedOrder) return;
        
        setIsUploading(true);
        try {
            const base64 = await toBase64(selectedFile);
            const response = await uploadCallListOrderPdf(selectedOrder.id, base64, selectedFile.type);
            addToast(response.message, 'success');
            handleClosePdfModal();
            loadOrders();
        } catch (error) {
            addToast((error as Error).message || 'PDF আপলোড করা যায়নি।', 'error');
        } finally {
            setIsUploading(false);
        }
    };


    if (isLoading) {
        return <div className="text-center p-10">লোড হচ্ছে...</div>;
    }

    return (
        <div className="space-y-6">
            <LoadingModal isOpen={isUploading} />
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-200">কল লিস্ট অর্ডার ম্যানেজমেন্ট</h1>
            
            <div className="relative max-w-sm">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
                </div>
                <input
                    type="text"
                    placeholder="মোবাইল বা ইউজার আইডি দিয়ে খুঁজুন..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-lg overflow-x-auto">
                <table className="responsive-table w-full min-w-[900px] text-sm text-left text-slate-500 dark:text-slate-400">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
                        <tr>
                            <th scope="col" className="px-6 py-3">তারিখ</th>
                            <th scope="col" className="px-6 py-3">অর্ডার আইডি</th>
                            <th scope="col" className="px-6 py-3">ইউজার আইডি</th>
                            <th scope="col" className="px-6 py-3">মোবাইল</th>
                            <th scope="col" className="px-6 py-3">মেয়াদ</th>
                            <th scope="col" className="px-6 py-3">মূল্য</th>
                            <th scope="col" className="px-6 py-3">স্ট্যাটাস</th>
                            <th scope="col" className="px-6 py-3">একশন</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOrders.map((order) => (
                            <tr key={order.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700">
                                <td data-label="তারিখ" className="px-6 py-4">{new Date(order.date).toLocaleDateString('bn-BD')}</td>
                                <td data-label="অর্ডার আইডি" className="px-6 py-4 font-mono">{order.id}</td>
                                <td data-label="ইউজার আইডি" className="px-6 py-4 font-mono">{order.userId}</td>
                                <td data-label="মোবাইল" className="px-6 py-4">{order.operator} - {order.mobile}</td>
                                <td data-label="মেয়াদ" className="px-6 py-4">{order.duration === '3 Months' ? '৩ মাস' : '৬ মাস'}</td>
                                <td data-label="মূল্য" className="px-6 py-4">৳{toBengaliNumber(order.price)}</td>
                                <td data-label="স্ট্যাটাস" className="px-6 py-4"><StatusBadge status={order.status} /></td>
                                <td data-label="একশন" className="px-6 py-4">
                                    <div className="flex items-center space-x-2 justify-end">
                                        <button onClick={() => handleViewDetails(order)} className="p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition" title="বিস্তারিত দেখুন">
                                            <EyeIcon className="h-5 w-5" />
                                        </button>
                                        {updatingStatusId === order.id ? (
                                            <span className="text-xs animate-pulse">প্রসেসিং...</span>
                                        ) : order.status === OrderStatus.PENDING ? (
                                            <>
                                                <button onClick={() => handleOpenPdfModal(order)} className="p-2 rounded-full text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/50" title="PDF আপলোড করুন">
                                                    <DocumentArrowUpIcon className="h-5 w-5"/>
                                                </button>
                                                <button onClick={() => handleOpenRejectModal(order)} className="text-xs font-semibold text-red-600 hover:underline dark:text-red-500">রিজেক্ট</button>
                                            </>
                                        ) : order.status === OrderStatus.COMPLETED && order.pdfUrl ? (
                                            <div className="flex items-center space-x-2">
                                                <a href={order.pdfUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/50" title="PDF দেখুন">
                                                    <LinkIcon className="h-5 w-5"/>
                                                </a>
                                                <button onClick={() => order.pdfUrl && printPdf(order.pdfUrl)} className="p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700 transition" title="প্রিন্ট করুন">
                                                    <PrinterIcon className="h-5 w-5"/>
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-400">N/A</span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {filteredOrders.length === 0 && <p className="text-center p-6 text-slate-500">{searchTerm ? 'আপনার অনুসন্ধানের সাথে মেলে এমন কোনো অর্ডার পাওয়া যায়নি।' : 'কোনো অর্ডার পাওয়া যায়নি।'}</p>}
            </div>

            <Modal isOpen={isRejectModalOpen} onClose={handleCloseRejectModal} title={`অর্ডার বাতিল করুন: ${selectedOrder?.id}`}>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="rejectionReason" className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-2">
                           বাতিলের কারণ লিখুন
                        </label>
                        <textarea
                            id="rejectionReason"
                            rows={3}
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                            placeholder="যেমন: ভুল মোবাইল নম্বর"
                        />
                    </div>
                    <div className="flex space-x-3 pt-4">
                         <Button type="button" variant="secondary" onClick={handleCloseRejectModal} className="w-1/2">
                            ফিরে যান
                        </Button>
                        <Button variant="danger" onClick={handleConfirmRejection} isLoading={isSubmitting} disabled={!rejectionReason.trim()} className="w-1/2">
                            বাতিল নিশ্চিত করুন
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isPdfModalOpen} onClose={handleClosePdfModal} title={`PDF আপলোড: ${selectedOrder?.id}`}>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="pdf-upload" className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-2">
                            একটি PDF ফাইল সিলেক্ট করুন
                        </label>
                        <input 
                            id="pdf-upload"
                            type="file" 
                            accept="application/pdf"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                    </div>
                    {selectedFile && <p className="text-[13px] text-slate-500 dark:text-slate-400">সিলেক্টেড ফাইল: {selectedFile.name}</p>}
                    <div className="pt-4">
                        <Button onClick={handlePdfUpload} isLoading={isUploading} disabled={!selectedFile || isUploading}>
                            আপলোড করুন
                        </Button>
                    </div>
                </div>
            </Modal>
            
            <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title="কল লিস্ট অর্ডারের বিবরণ">
                {selectedOrder && (
                    <div className="space-y-4 text-[13px]">
                        {(() => {
                            const orderUser = users.find(u => u.id === selectedOrder.userId);
                            if (orderUser) {
                                return (
                                    <div className="pb-3 mb-3 border-b dark:border-slate-600">
                                        <h4 className="font-semibold text-base text-slate-800 dark:text-slate-200 mb-2">ব্যবহারকারী</h4>
                                        <div className="flex items-center space-x-3">
                                            {orderUser.photoUrl ? (
                                                <img src={orderUser.photoUrl} alt={orderUser.name} className="h-10 w-10 rounded-full object-cover"/>
                                            ) : (
                                                <UserCircleIcon className="h-10 w-10 text-slate-300 dark:text-slate-600"/>
                                            )}
                                            <div>
                                                <p className="font-bold text-slate-800 dark:text-slate-200">{orderUser.name}</p>
                                                <p className="text-xs text-slate-500">{orderUser.mobile}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        })()}

                        <div>
                            <h4 className="font-semibold text-base text-slate-800 dark:text-slate-200 mb-2">অর্ডারের তথ্য</h4>
                            <p><strong>অর্ডার আইডি:</strong> <span className="font-mono">{selectedOrder.id}</span></p>
                            <p><strong>মোবাইল:</strong> {selectedOrder.operator} - {selectedOrder.mobile}</p>
                            <p><strong>মেয়াদ:</strong> {selectedOrder.duration === '3 Months' ? '৩ মাস' : '৬ মাস'}</p>
                            <p><strong>মূল্য:</strong> ৳{toBengaliNumber(selectedOrder.price)}</p>
                            <p><strong>স্ট্যাটাস:</strong> <StatusBadge status={selectedOrder.status} /></p>
                            {selectedOrder.status === OrderStatus.REJECTED && selectedOrder.rejectionReason && (
                                <p><strong>বাতিলের কারণ:</strong> {selectedOrder.rejectionReason}</p>
                            )}
                        </div>

                        {selectedOrder.pdfUrl && (
                            <div className="pt-4 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                                <a href={selectedOrder.pdfUrl} target="_blank" rel="noopener noreferrer" className="w-full">
                                    <Button><LinkIcon className="h-5 w-5 mr-2"/> PDF দেখুন</Button>
                                </a>
                                <Button variant="secondary" onClick={() => selectedOrder.pdfUrl && printPdf(selectedOrder.pdfUrl)} className="w-full">
                                    <PrinterIcon className="h-5 w-5 mr-2"/> প্রিন্ট করুন
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default ManageCallListOrders;