import React, { useState, useEffect, useCallback } from 'react';
import { Order, OrderStatus, User } from '../../types';
import { fetchOrders, uploadOrderPdf, updateOrderStatus, updateOrderDetails, fetchAllUsers } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import { DocumentArrowUpIcon, LinkIcon, EyeIcon, ArrowDownTrayIcon, PencilSquareIcon, XCircleIcon, PrinterIcon, CheckCircleIcon, UserCircleIcon, UserIcon, IdentificationIcon, CalendarIcon, DevicePhoneMobileIcon, WifiIcon, InformationCircleIcon, Squares2X2Icon } from '@heroicons/react/24/solid';
import { printPdf } from '../../utils/formatters';
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
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-3 animate-pulse">
        <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0 space-y-1.5">
                <div className="h-3 w-28 bg-slate-200 dark:bg-slate-700 rounded"></div>
                <div className="h-4 w-36 bg-slate-200 dark:bg-slate-700 rounded"></div>
                <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
            <div className="flex-shrink-0 ml-3">
                 <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
            </div>
        </div>
        <div className="flex items-center justify-end space-x-2 pt-2 mt-2 border-t border-slate-100 dark:border-slate-700">
            <div className="h-6 w-8 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
            <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
        </div>
    </div>
);

const OrderCard: React.FC<{
    order: Order;
    onViewDetails: (order: Order) => void;
    onComplete: (order: Order) => void;
    onReject: (order: Order) => void;
}> = ({ order, onViewDetails, onComplete, onReject }) => (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-3 transition-shadow hover:shadow-lg">
        <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
                <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400 truncate" title={order.id}>{order.id}</p>
                <p className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate" title={`${order.operator} - ${order.mobile}`}>{order.operator} - {order.mobile}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{order.date}</p>
            </div>
            <div className="flex-shrink-0 ml-3">
                 <StatusBadge status={order.status} />
            </div>
        </div>
        <div className="flex items-center justify-end space-x-2 pt-2 mt-2 border-t border-slate-100 dark:border-slate-700">
            <Button variant="secondary" onClick={() => onViewDetails(order)} className="!w-auto !px-2.5 !py-1" title="বিস্তারিত দেখুন"><EyeIcon className="h-4 w-4"/></Button>
            {order.status === OrderStatus.PENDING && (
                <>
                    <Button onClick={() => onComplete(order)} className="!w-auto !py-1 !px-2.5 !text-[11px] !font-semibold !bg-green-600 hover:!bg-green-700"><CheckCircleIcon className="h-3.5 w-3.5 mr-1"/> সম্পন্ন</Button>
                    <Button variant="danger" onClick={() => onReject(order)} className="!w-auto !py-1 !px-2.5 !text-[11px] !font-semibold !bg-red-600 hover:!bg-red-700"><XCircleIcon className="h-3.5 w-3.5 mr-1"/> বাতিল</Button>
                </>
            )}
            {order.pdfUrl && (
                <a href={order.pdfUrl} target="_blank" rel="noopener noreferrer">
                    <Button className="!w-auto !py-1 !px-2.5 !text-[11px] !font-semibold"><LinkIcon className="h-3.5 w-3.5 mr-1"/> PDF</Button>
                </a>
            )}
        </div>
    </div>
);


const ManageOrders: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const { addToast } = useToast();

    // --- State for editing order details ---
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editableDetails, setEditableDetails] = useState({
        nidNumber: '',
        customerName: '',
        dateOfBirth: '',
    });

    const loadOrders = useCallback(async () => {
        setIsLoading(true);
        try {
            const [data, usersData] = await Promise.all([
                fetchOrders(),
                fetchAllUsers(1, 10000)
            ]);
            setOrders(data);
            setUsers(usersData.users);
        } catch (error) {
            console.error("Failed to load orders and users", error);
            addToast('অর্ডার ও ব্যবহারকারীদের তথ্য লোড করা যায়নি।', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    const handleOpenPdfModal = (order: Order) => {
        setSelectedOrder(order);
        setIsPdfModalOpen(true);
    };
    const handleClosePdfModal = () => {
        setIsPdfModalOpen(false);
        setSelectedFile(null);
        setSelectedOrder(null);
    };

    const handleViewDetails = (order: Order) => {
        setSelectedOrder(order);
        const dobForInput = order.dateOfBirth ? order.dateOfBirth.split('T')[0] : '';
        setEditableDetails({
            nidNumber: order.nidNumber || '',
            customerName: order.customerName || '',
            dateOfBirth: dobForInput,
        });
        setIsDetailsModalOpen(true);
    };
    const handleCloseDetailsModal = () => {
        setIsDetailsModalOpen(false);
        setSelectedOrder(null);
        setIsEditing(false);
    };

    const handleOpenRejectModal = (order: Order) => {
        setSelectedOrder(order);
        setIsRejectModalOpen(true);
    };
    const handleCloseRejectModal = () => {
        setIsRejectModalOpen(false);
        setRejectionReason('');
        setSelectedOrder(null);
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
            const response = await uploadOrderPdf(selectedOrder.id, base64, selectedFile.type);
            addToast(response.message, 'success');
            handleClosePdfModal();
            loadOrders();
        } catch (error) {
            const err = error as Error;
            addToast(err.message || 'PDF আপলোড করা যায়নি।', 'error');
        } finally {
            setIsUploading(false);
        }
    };
    
    const handleConfirmRejection = async () => {
        if (!selectedOrder || !rejectionReason.trim()) {
            addToast('অনুগ্রহ করে বাতিলের কারণ উল্লেখ করুন।', 'error');
            return;
        }
        setIsRejecting(true);
        try {
            await updateOrderStatus(selectedOrder.id, OrderStatus.REJECTED, rejectionReason);
            addToast('অর্ডার সফলভাবে বাতিল করা হয়েছে।', 'success');
            handleCloseRejectModal();
            loadOrders();
        } catch (error) {
            const err = error as Error;
            addToast(err.message || 'অর্ডার বাতিল করা যায়নি।', 'error');
        } finally {
            setIsRejecting(false);
        }
    };
    
    const handleDetailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditableDetails(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveChanges = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOrder) return;

        setIsSaving(true);
        try {
            await updateOrderDetails(selectedOrder.id, editableDetails);
            addToast('বিবরণ সফলভাবে সংরক্ষণ করা হয়েছে।', 'success');
            setIsEditing(false); 
            // Optimistically update the selected order details for instant UI feedback
            const updatedOrder = { ...selectedOrder, ...editableDetails };
            setSelectedOrder(updatedOrder);
            // Also update the main orders list
            setOrders(prevOrders => prevOrders.map(o => o.id === selectedOrder.id ? updatedOrder : o));
        } catch (error) {
            const err = error as Error;
            addToast(err.message || 'বিবরণ সংরক্ষণ করা যায়নি।', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <LoadingModal isOpen={isUploading || isSaving} />
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-200">অর্ডার ম্যানেজ করুন</h1>
            
            <div className="space-y-4">
                {isLoading ? (
                    [...Array(5)].map((_, i) => <OrderCardSkeleton key={i} />)
                ) : orders.length > 0 ? (
                    orders.map((order) => (
                        <OrderCard
                            key={order.id}
                            order={order}
                            onViewDetails={handleViewDetails}
                            onComplete={handleOpenPdfModal}
                            onReject={handleOpenRejectModal}
                        />
                    ))
                ) : (
                    <div className="text-center p-10 bg-white dark:bg-slate-800 rounded-lg shadow">
                        <p className="text-slate-500">কোনো অর্ডার পাওয়া যায়নি।</p>
                    </div>
                )}
            </div>

            {/* PDF Upload Modal */}
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
                            আপলোড ও সম্পন্ন করুন
                        </Button>
                    </div>
                </div>
            </Modal>
            
             {/* Reject Order Modal */}
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
                        <Button variant="danger" onClick={handleConfirmRejection} isLoading={isRejecting} disabled={!rejectionReason.trim()} className="w-1/2">
                            বাতিল নিশ্চিত করুন
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Details Modal */}
            <Modal isOpen={isDetailsModalOpen} onClose={handleCloseDetailsModal} title="অর্ডারের বিবরণ">
                {selectedOrder && (
                    <>
                        {!isEditing ? (
                            <div className="space-y-4 text-[13px] text-slate-600 dark:text-slate-300">
                                {(() => {
                                    const orderUser = users.find(u => u.id === selectedOrder.userId);
                                    if (orderUser) {
                                        return (
                                            <div className="pb-4 mb-4 border-b dark:border-slate-600">
                                                <div className="flex flex-col items-center text-center space-y-2">
                                                    {orderUser.photoUrl ? (
                                                        <img src={orderUser.photoUrl} alt={orderUser.name} referrerPolicy="no-referrer" className="h-16 w-16 rounded-full object-cover shadow-md"/>
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
                                
                                <div className="flex justify-between items-start">
                                    <h4 className="font-semibold text-base text-slate-800 dark:text-slate-200">অর্ডারের বিবরণ</h4>
                                    {selectedOrder.status === OrderStatus.PENDING && (
                                         <button
                                            onClick={() => setIsEditing(true)}
                                            className="p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                                            title="বিবরণ এডিট করুন"
                                        >
                                            <PencilSquareIcon className="h-5 w-5" />
                                        </button>
                                    )}
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 pt-2">
                                    <DetailRow icon={InformationCircleIcon} label="অর্ডার আইডি" value={<span className="font-mono text-sm">{selectedOrder.id}</span>} />
                                    <DetailRow icon={Squares2X2Icon} label="অর্ডারের ধরণ" value="বায়োমেট্রিক" />
                                    <DetailRow icon={UserIcon} label="নাম" value={selectedOrder.customerName || 'N/A'} />
                                    <DetailRow icon={IdentificationIcon} label="NID নাম্বার" value={selectedOrder.nidNumber || 'N/A'} />
                                    <DetailRow icon={CalendarIcon} label="জন্ম তারিখ" value={selectedOrder.dateOfBirth ? new Date(selectedOrder.dateOfBirth).toLocaleDateString('bn-BD') : 'N/A'} />
                                    <DetailRow icon={DevicePhoneMobileIcon} label="মোবাইল" value={selectedOrder.mobile} />
                                    <DetailRow icon={WifiIcon} label="অপারেটর" value={selectedOrder.operator} />
                                </div>
                                
                                <hr className="dark:border-slate-600 my-4"/>
                                
                                <div><strong>স্ট্যাটাস:</strong> <StatusBadge status={selectedOrder.status} /></div>
                                
                                {selectedOrder.status === OrderStatus.REJECTED && selectedOrder.rejectionReason && (
                                     <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/30 rounded-lg">
                                        <p className="font-semibold text-red-700 dark:text-red-300">বাতিলের কারণ:</p>
                                        <p className="text-red-600 dark:text-red-400">{selectedOrder.rejectionReason}</p>
                                    </div>
                                )}

                                {selectedOrder.pdfUrl && (
                                    <div className="mt-6 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                                         <a href={selectedOrder.pdfUrl} target="_blank" rel="noopener noreferrer" className="w-full">
                                            <Button>
                                                <ArrowDownTrayIcon className="h-5 w-5 mr-2"/>
                                                PDF ডাউনলোড করুন
                                            </Button>
                                        </a>
                                        <Button variant="secondary" onClick={() => selectedOrder.pdfUrl && printPdf(selectedOrder.pdfUrl)} className="w-full">
                                            <PrinterIcon className="h-5 w-5 mr-2"/>
                                            প্রিন্ট করুন
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <form onSubmit={handleSaveChanges} className="space-y-4">
                                <Input id="customerName" name="customerName" label="গ্রাহকের নাম" value={editableDetails.customerName} onChange={handleDetailChange} />
                                <Input id="nidNumber" name="nidNumber" label="NID নাম্বার" value={editableDetails.nidNumber} onChange={handleDetailChange} />
                                <Input id="dateOfBirth" name="dateOfBirth" label="জন্ম তারিখ" type="date" value={editableDetails.dateOfBirth} onChange={handleDetailChange} />

                                <div className="flex space-x-3 pt-4">
                                     <Button type="button" variant="secondary" onClick={() => setIsEditing(false)} className="w-1/2">
                                        বাতিল
                                    </Button>
                                    <Button type="submit" isLoading={isSaving} className="w-1/2">
                                        সংরক্ষণ করুন
                                    </Button>
                                </div>
                            </form>
                        )}
                    </>
                )}
            </Modal>
        </div>
    );
};

export default ManageOrders;