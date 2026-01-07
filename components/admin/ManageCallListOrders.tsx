import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { CallListOrder, OrderStatus, User } from '../../types';
import { fetchCallListOrders, updateCallListOrderStatus, uploadCallListOrderPdf, fetchAllUsers } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { toBengaliNumber, printPdf } from '../../utils/formatters';
import { DocumentArrowUpIcon, LinkIcon, PrinterIcon, MagnifyingGlassIcon, EyeIcon, UserCircleIcon, InformationCircleIcon, DevicePhoneMobileIcon, ClockIcon, WifiIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
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

const DetailRow: React.FC<{ icon: React.FC<any>, label: string, value: string | React.ReactNode }> = ({ icon: Icon, label, value }) => (
    <div className="flex items-start space-x-3 text-slate-600 dark:text-slate-300">
        <Icon className="h-5 w-5 mt-0.5 text-slate-400" />
        <div className="flex-1">
            <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
            <p className="font-semibold text-[15px]">{value}</p>
        </div>
    </div>
);

const OrderCardSkeleton: React.FC = () => (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md animate-pulse">
        <div className="flex justify-between items-start">
            <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                <div>
                    <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-1.5"></div>
                    <div className="h-3 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </div>
            </div>
            <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
            {[...Array(4)].map((_, i) => (
                <div key={i}>
                    <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded mb-1.5"></div>
                    <div className="h-5 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </div>
            ))}
        </div>
        <div className="flex justify-end items-center mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 space-x-2">
             <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
             <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
        </div>
    </div>
);

const OrderCard: React.FC<{
    order: CallListOrder;
    user: User | undefined;
    onViewDetails: (order: CallListOrder) => void;
    onComplete: (order: CallListOrder) => void;
    onReject: (order: CallListOrder) => void;
    processingId: string | null;
}> = ({ order, user, onViewDetails, onComplete, onReject, processingId }) => (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-4 transition-all hover:shadow-lg border border-transparent hover:border-indigo-500/30">
        <div className="flex justify-between items-start pb-3">
            <div className="flex items-center space-x-3 group">
                {user?.photoUrl ? (
                    <img src={user.photoUrl} alt={user.name} className="h-10 w-10 rounded-full object-cover"/>
                ) : (
                    <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 font-bold text-base">
                        {user?.name.charAt(0)}
                    </div>
                )}
                <div>
                    <p className="font-bold text-base text-slate-800 dark:text-slate-200">{user?.name || 'অজানা'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{order.userId}</p>
                </div>
            </div>
            <StatusBadge status={order.status} />
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-slate-100 dark:border-slate-700/50 text-sm">
            <div><p className="text-xs text-slate-500">মোবাইল</p><p className="font-semibold text-slate-700 dark:text-slate-300">{order.operator}-{order.mobile}</p></div>
            <div><p className="text-xs text-slate-500">মেয়াদ</p><p className="font-semibold text-slate-700 dark:text-slate-300">{order.duration === '3 Months' ? '৩ মাস' : '৬ মাস'}</p></div>
            <div><p className="text-xs text-slate-500">মূল্য</p><p className="font-bold text-indigo-600 dark:text-indigo-400">৳{toBengaliNumber(order.price)}</p></div>
            <div><p className="text-xs text-slate-500">তারিখ</p><p className="font-semibold text-slate-700 dark:text-slate-300">{new Date(order.date).toLocaleDateString('bn-BD')}</p></div>
        </div>

        <div className="flex items-center justify-end space-x-2 pt-3">
            <Button variant="secondary" onClick={() => onViewDetails(order)} className="!w-auto !px-2.5 !py-1" title="বিস্তারিত দেখুন"><EyeIcon className="h-4 w-4"/></Button>
            {processingId === order.id ? (
                <span className="text-xs animate-pulse">প্রসেসিং...</span>
            ) : order.status === OrderStatus.PENDING ? (
                <>
                    <Button onClick={() => onComplete(order)} className="!w-auto !py-1 !px-2.5 !text-xs !font-semibold !bg-indigo-600 hover:!bg-indigo-700"><DocumentArrowUpIcon className="h-4 w-4 mr-1.5"/> PDF আপলোড</Button>
                    <Button variant="danger" onClick={() => onReject(order)} className="!w-auto !py-1 !px-2.5 !text-xs !font-semibold !bg-red-600 hover:!bg-red-700"><XCircleIcon className="h-4 w-4 mr-1.5"/> বাতিল</Button>
                </>
            ) : order.status === OrderStatus.COMPLETED && order.pdfUrl ? (
                <div className="flex items-center space-x-2">
                    <a href={order.pdfUrl} target="_blank" rel="noopener noreferrer">
                        <Button className="!w-auto !py-1 !px-2.5 !text-xs !font-semibold"><LinkIcon className="h-4 w-4 mr-1.5"/> PDF দেখুন</Button>
                    </a>
                    <Button variant="secondary" onClick={() => order.pdfUrl && printPdf(order.pdfUrl)} className="!w-auto !px-2.5 !py-1" title="প্রিন্ট করুন">
                        <PrinterIcon className="h-4 w-4"/>
                    </Button>
                </div>
            ) : ( <span className="text-xs text-slate-400">N/A</span> )}
        </div>
    </div>
);


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

    // For PDF upload dropzone
    const [dragActive, setDragActive] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

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
        setDragActive(false);
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
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        event.preventDefault();
        if (event.target.files && event.target.files[0]) {
            if (event.target.files[0].type !== 'application/pdf') {
                addToast('শুধুমাত্র PDF ফাইল আপলোড করা যাবে।', 'error');
                return;
            }
            setSelectedFile(event.target.files[0]);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileChange({ target: { files: e.dataTransfer.files } } as any);
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
            
            <div className="space-y-4">
                {isLoading ? (
                     [...Array(5)].map((_, i) => <OrderCardSkeleton key={i} />)
                ) : filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                        <OrderCard
                            key={order.id}
                            order={order}
                            user={users.find(u => u.id === order.userId)}
                            onViewDetails={handleViewDetails}
                            onComplete={handleOpenPdfModal}
                            onReject={handleOpenRejectModal}
                            processingId={updatingStatusId}
                        />
                    ))
                ) : (
                    <div className="text-center p-10 bg-white dark:bg-slate-800 rounded-lg shadow">
                        <p className="text-slate-500">{searchTerm ? 'আপনার অনুসন্ধানের সাথে মেলে এমন কোনো অর্ডার পাওয়া যায়নি।' : 'কোনো অর্ডার পাওয়া যায়নি।'}</p>
                    </div>
                )}
            </div>

            <Modal isOpen={isRejectModalOpen} onClose={handleCloseRejectModal} title={`অর্ডার বাতিল করুন`}>
                <div className="space-y-4">
                    <p className="text-sm text-slate-500">অর্ডার আইডি: <span className="font-mono">{selectedOrder?.id}</span></p>
                    <div>
                        <label htmlFor="rejectionReason" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                           বাতিলের কারণ লিখুন
                        </label>
                        <textarea
                            id="rejectionReason"
                            rows={3}
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500"
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

            <Modal isOpen={isPdfModalOpen} onClose={handleClosePdfModal} title="PDF আপলোড করুন">
                <div className="space-y-4 text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">অর্ডার আইডি: <span className="font-mono">{selectedOrder?.id}</span></p>
                    
                    <div onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} className="relative">
                        <input ref={inputRef} type="file" id="pdf-upload" accept="application/pdf" className="hidden" onChange={handleFileChange} />
                        <label 
                            htmlFor="pdf-upload" 
                            className={`flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${dragActive ? "border-indigo-600 bg-indigo-50 dark:bg-slate-700" : "border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500"}`}
                        >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <DocumentArrowUpIcon className="w-10 h-10 mb-3 text-slate-400" />
                                <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
                                    <span className="font-semibold">ফাইল সিলেক্ট করতে ক্লিক করুন</span> অথবা টেনে আনুন
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">শুধু PDF ফাইল গ্রহণযোগ্য</p>
                            </div>
                        </label>
                    </div>

                    {selectedFile && (
                        <div className="flex items-center justify-between p-2 mt-4 bg-slate-100 dark:bg-slate-700 rounded-lg text-left">
                            <p className="text-sm text-slate-700 dark:text-slate-200 truncate">{selectedFile.name}</p>
                            <button 
                                onClick={() => {
                                    setSelectedFile(null);
                                    if(inputRef.current) inputRef.current.value = "";
                                }} 
                                className="p-1 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600"
                            >
                                <XCircleIcon className="h-5 w-5" />
                            </button>
                        </div>
                    )}
                    <div className="pt-4">
                        <Button onClick={handlePdfUpload} isLoading={isUploading} disabled={!selectedFile || isUploading}>
                            আপলোড ও সম্পন্ন করুন
                        </Button>
                    </div>
                </div>
            </Modal>
            
            <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title="কল লিস্ট অর্ডারের বিবরণ">
                {selectedOrder && (
                    <div className="space-y-4 text-sm">
                        {(() => {
                            const orderUser = users.find(u => u.id === selectedOrder.userId);
                            if (orderUser) {
                                return (
                                    <div className="pb-4 mb-4 border-b dark:border-slate-600">
                                        <div className="flex flex-col items-center text-center space-y-2">
                                            {orderUser.photoUrl ? (
                                                <img src={orderUser.photoUrl} alt={orderUser.name} className="h-16 w-16 rounded-full object-cover shadow-md"/>
                                            ) : (
                                                <UserCircleIcon className="h-16 w-16 text-slate-300 dark:text-slate-600"/>
                                            )}
                                            <div>
                                                <p className="font-bold text-lg text-slate-800 dark:text-slate-200">{orderUser.name}</p>
                                                <p className="text-sm text-slate-500">{orderUser.mobile}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        })()}

                        <div>
                            <h4 className="font-semibold text-base text-slate-800 dark:text-slate-200 mb-4">অর্ডারের তথ্য</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                                <DetailRow icon={InformationCircleIcon} label="অর্ডার আইডি" value={<span className="font-mono">{selectedOrder.id}</span>} />
                                <DetailRow icon={DevicePhoneMobileIcon} label="মোবাইল" value={`${selectedOrder.operator} - ${selectedOrder.mobile}`} />
                                <DetailRow icon={ClockIcon} label="মেয়াদ" value={selectedOrder.duration === '3 Months' ? '৩ মাস' : '৬ মাস'} />
                                <DetailRow icon={WifiIcon} label="অপারেটর" value={selectedOrder.operator} />
                            </div>
                        </div>

                        <hr className="dark:border-slate-600 my-4"/>

                        <p><strong>মূল্য:</strong> ৳{toBengaliNumber(selectedOrder.price)}</p>
                        <p><strong>স্ট্যাটাস:</strong> <StatusBadge status={selectedOrder.status} /></p>
                        {selectedOrder.status === OrderStatus.REJECTED && selectedOrder.rejectionReason && (
                            <p><strong>বাতিলের কারণ:</strong> {selectedOrder.rejectionReason}</p>
                        )}

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