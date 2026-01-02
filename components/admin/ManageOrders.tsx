
import React, { useState, useEffect, useCallback } from 'react';
import { Order, OrderStatus } from '../../types';
import { fetchOrders, uploadOrderPdf, updateOrderStatus, updateOrderDetails } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import { DocumentArrowUpIcon, LinkIcon, EyeIcon, ArrowDownTrayIcon, PencilSquareIcon, XCircleIcon } from '@heroicons/react/24/outline';


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

const ManageOrders: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
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
            const data = await fetchOrders(); 
            setOrders(data);
        } catch (error) {
            console.error("Failed to load orders", error);
            addToast('অর্ডার লোড করা যায়নি।', 'error');
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
        setEditableDetails({
            nidNumber: order.nidNumber || '',
            customerName: order.customerName || '',
            dateOfBirth: order.dateOfBirth || '',
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

    const handleStatusChange = async (orderId: string, newStatus: OrderStatus, event: React.ChangeEvent<HTMLSelectElement>) => {
        const originalStatus = orders.find(o => o.id === orderId)?.status;
        if (!originalStatus || newStatus === originalStatus) return;

        const isConfirmed = window.confirm(`আপনি কি এই অর্ডারের স্ট্যাটাস পরিবর্তন করতে নিশ্চিত?`);
        if (!isConfirmed) {
            event.target.value = originalStatus;
            return;
        }

        setUpdatingStatusId(orderId);
        try {
            await updateOrderStatus(orderId, newStatus);
            addToast('স্ট্যাটাস সফলভাবে পরিবর্তন করা হয়েছে।', 'success');
            await loadOrders();
        } catch (error) {
            const err = error as Error;
            addToast(err.message || 'স্ট্যাটাস পরিবর্তন করা যায়নি।', 'error');
            event.target.value = originalStatus;
        } finally {
            setUpdatingStatusId(null);
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
            await loadOrders(); 
            setSelectedOrder(prev => prev ? { ...prev, ...editableDetails } : null);
        } catch (error) {
            const err = error as Error;
            addToast(err.message || 'বিবরণ সংরক্ষণ করা যায়নি।', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="text-center p-10">অর্ডার লোড হচ্ছে...</div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-200">অর্ডার ম্যানেজ করুন</h1>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-lg overflow-x-auto">
                <table className="w-full min-w-[800px] text-sm text-left text-slate-500 dark:text-slate-400">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
                        <tr>
                            <th scope="col" className="px-6 py-3">অর্ডার আইডি</th>
                            <th scope="col" className="px-6 py-3">অপারেটর</th>
                            <th scope="col" className="px-6 py-3">মোবাইল</th>
                            <th scope="col" className="px-6 py-3">স্ট্যাটাস</th>
                            <th scope="col" className="px-6 py-3">একশন</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order) => (
                            <tr key={order.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700">
                                <td className="px-6 py-4 font-mono">{order.id}</td>
                                <td className="px-6 py-4">{order.operator}</td>
                                <td className="px-6 py-4">{order.mobile}</td>
                                <td className="px-6 py-4">
                                    {updatingStatusId === order.id ? (
                                        <span className="text-xs text-slate-500 dark:text-slate-400 animate-pulse">আপডেট হচ্ছে...</span>
                                    ) : (
                                        <select
                                            value={order.status}
                                            onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus, e)}
                                            disabled={order.status === OrderStatus.COMPLETED || order.status === OrderStatus.REJECTED}
                                            title={order.status !== OrderStatus.PENDING ? "এই অর্ডারের স্ট্যাটাস পরিবর্তন করা যাবে না।" : "স্ট্যাটাস পরিবর্তন করুন"}
                                            className={`w-full p-2 text-xs font-medium rounded-lg border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none
                                                ${order.status === OrderStatus.PENDING ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' : ''}
                                                ${order.status === OrderStatus.COMPLETED ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : ''}
                                                ${order.status === OrderStatus.REJECTED ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' : ''}
                                                ${order.status !== OrderStatus.PENDING ? 'cursor-not-allowed' : ''}
                                            `}
                                        >
                                            <option value={OrderStatus.PENDING}>পেন্ডিং</option>
                                            <option value={OrderStatus.COMPLETED}>কমপ্লিট</option>
                                            <option value={OrderStatus.REJECTED} disabled>রিজেক্টেড</option>
                                        </select>
                                    )}
                                </td>
                                <td className="px-6 py-4 flex items-center space-x-2">
                                     <button onClick={() => handleViewDetails(order)} className="p-2 rounded-full text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/50" title="বিস্তারিত দেখুন">
                                        <EyeIcon className="h-5 w-5" />
                                    </button>
                                    {order.status === OrderStatus.PENDING && (
                                        <>
                                        <button onClick={() => handleOpenPdfModal(order)} className="flex items-center text-xs font-semibold text-white bg-indigo-500 hover:bg-indigo-600 px-3 py-1.5 rounded-md shadow transition" title="PDF আপলোড করুন">
                                            <DocumentArrowUpIcon className="h-4 w-4 mr-1"/>
                                            PDF
                                        </button>
                                        <button onClick={() => handleOpenRejectModal(order)} className="p-2 rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50" title="অর্ডার বাতিল করুন">
                                            <XCircleIcon className="h-5 w-5" />
                                        </button>
                                        </>
                                    )}
                                    {order.pdfUrl && (
                                        <a href={order.pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-xs font-semibold text-white bg-green-500 hover:bg-green-600 px-3 py-1.5 rounded-md shadow transition">
                                            <LinkIcon className="h-4 w-4 mr-1"/>
                                            PDF দেখুন
                                        </a>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* PDF Upload Modal */}
            <Modal isOpen={isPdfModalOpen} onClose={handleClosePdfModal} title={`PDF আপলোড: ${selectedOrder?.id}`}>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="pdf-upload" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
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
                    {selectedFile && <p className="text-sm text-slate-500 dark:text-slate-400">সিলেক্টেড ফাইল: {selectedFile.name}</p>}
                    <div className="pt-4">
                        <Button onClick={handlePdfUpload} isLoading={isUploading} disabled={!selectedFile || isUploading}>
                            আপলোড করুন
                        </Button>
                    </div>
                </div>
            </Modal>
            
             {/* Reject Order Modal */}
            <Modal isOpen={isRejectModalOpen} onClose={handleCloseRejectModal} title={`অর্ডার বাতিল করুন: ${selectedOrder?.id}`}>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="rejectionReason" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
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
                            <div className="space-y-3 text-slate-600 dark:text-slate-300">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-semibold text-lg text-slate-800 dark:text-slate-200">অর্ডারের বিবরণ</h4>
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
                                
                                <p><strong>নাম:</strong> {selectedOrder.customerName || 'N/A'}</p>
                                <p><strong>NID নাম্বার:</strong> {selectedOrder.nidNumber || 'N/A'}</p>
                                <p><strong>জন্ম তারিখ:</strong> {selectedOrder.dateOfBirth || 'N/A'}</p>
                                <p><strong>মোবাইল:</strong> {selectedOrder.mobile}</p>
                                <p><strong>অপারেটর:</strong> {selectedOrder.operator}</p>

                                <hr className="dark:border-slate-600 my-4"/>
                                
                                <p><strong>অর্ডার আইডি:</strong> {selectedOrder.id}</p>
                                <div><strong>স্ট্যাটাস:</strong> <StatusBadge status={selectedOrder.status} /></div>
                                
                                {selectedOrder.status === OrderStatus.REJECTED && selectedOrder.rejectionReason && (
                                     <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/30 rounded-lg">
                                        <p className="font-semibold text-red-700 dark:text-red-300">বাতিলের কারণ:</p>
                                        <p className="text-red-600 dark:text-red-400">{selectedOrder.rejectionReason}</p>
                                    </div>
                                )}

                                {selectedOrder.pdfUrl && (
                                    <div className="mt-6">
                                         <a href={selectedOrder.pdfUrl} target="_blank" rel="noopener noreferrer">
                                            <Button>
                                                <ArrowDownTrayIcon className="h-5 w-5 mr-2"/>
                                                PDF ডাউনলোড করুন
                                            </Button>
                                        </a>
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
