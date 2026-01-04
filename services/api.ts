import { User, Wallet, Transaction, Order, OrderDetails, Operator, AdminTransaction, OrderStatus, Settings, CallListOrder, OrderHistoryItem, AdminDashboardAnalytics, AdminChartData, Notification } from '../types';

// =========================================================================
// গুরুত্বপূর্ণ: আপনার ডিপ্লয় করা Apps Script Web App URL টি এখানে পেস্ট করুন
// =========================================================================
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx-7qRY7YTRwWtzMq13forLOpg6xKaXjINPOlAad7RpA_h3kT-incAE4AdH2j-L91XBAg/exec"; 

// --- Central API Handler ---
// This function sends requests to our Google Apps Script backend
const callApi = async (action: string, payload: object = {}) => {
  try {
    // We get the userId from a simple local storage to simulate passing it with each request
    const sessionUser = localStorage.getItem('currentUser');
    const user = sessionUser ? JSON.parse(sessionUser) : null;
    
    // We always want to send the userId if a user is logged in, so the backend can handle permissions.
    const finalPayload = user ? { ...payload, userId: user.id } : payload;
    
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      redirect: 'follow', // Explicitly set redirect policy for Apps Script compatibility
      mode: 'cors', // Explicitly set CORS mode
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // Apps Script web apps often work best this way
      },
      body: JSON.stringify({ 
        action, 
        payload: finalPayload
      }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'সার্ভার থেকে একটি ত্রুটি এসেছে।');
    }
    
    return result.data;

  } catch (error) {
    console.error(`API Error on action "${action}":`, error);
    // Rethrow the error so UI components can catch it
    throw error;
  }
};


// --- AUTH ---
export const apiSignup = async (details: { name: string, mobile: string, email: string, pass: string, ipAddress: string }) => {
    return callApi('signup', details);
};

export const apiLogin = async (creds: { loginId: string, pass:string }): Promise<User> => {
    const user = await callApi('login', creds);
    // Simulate session by storing user data in localStorage after login
    localStorage.setItem('currentUser', JSON.stringify(user));
    return user;
};

// We will use a mock logout that just clears the session
export const apiLogout = () => {
    localStorage.removeItem('currentUser');
};

export const apiForgotPasswordRequest = async (emailOrMobile: string) => {
    return callApi('forgotPasswordRequest', { emailOrMobile });
};

export const apiResetPassword = async (details: { emailOrMobile: string, code: string, newPassword: string }) => {
    return callApi('resetPassword', details);
};

export const apiUpdateUserActivity = async () => {
    return callApi('updateUserActivity');
};


// --- USER DATA ---
export const fetchWallet = async (): Promise<Wallet> => callApi('fetchWallet');
export const fetchTransactions = async (): Promise<Transaction[]> => callApi('fetchTransactions');
export const fetchOrders = async (): Promise<Order[]> => {
    // This is now mainly for the Admin Panel to fetch only BIOMETRIC orders.
    // User-facing order history will use the new `fetchOrderHistory` function.
    return callApi('fetchOrders');
};
export const fetchOrderHistory = async (): Promise<OrderHistoryItem[]> => {
    return callApi('fetchOrderHistoryForUser');
};

export const addMoneyRequest = async (transactionId: string, amount: number, paymentMethod: string, senderNumber: string) => {
    return callApi('addMoneyRequest', { transactionId, amount, paymentMethod, senderNumber });
};

export const createBiometricOrder = async (order: { operator: Operator, mobile: string }) => {
    return callApi('createBiometricOrder', { order });
};

export const createCallListOrder = async (order: { operator: Operator, mobile: string, duration: '3 Months' | '6 Months' }) => {
    return callApi('createCallListOrder', { order });
};

export const fetchOrderDetails = async (orderId: string): Promise<OrderDetails> => {
    // This function might become obsolete or needs adjustment if we stop fetching single order details.
    // For now, it still fetches from the main biometric orders list.
    const allOrders: Order[] = await callApi('fetchOrders'); 
    const baseOrder = allOrders.find(o => o.id === orderId);
    if (!baseOrder) throw new Error('অর্ডার খুঁজে পাওয়া যায়নি।');
    
    return {
        ...baseOrder,
        nidNumber: baseOrder.nidNumber || 'N/A',
        customerName: baseOrder.customerName || 'N/A',
        dateOfBirth: baseOrder.dateOfBirth || 'N/A',
    };
};

export const apiUpdateProfile = async (details: { name: string, photoBase64?: string, mimeType?: string }): Promise<User> => {
    return callApi('updateProfile', details);
};

export const apiSendDetailsByEmail = async (itemId: string, itemType: 'transaction' | 'order'): Promise<{ message: string }> => {
    return callApi('sendDetailsByEmail', { itemId, itemType });
};

// --- Notifications ---
export const apiFetchNotifications = async (): Promise<Notification[]> => {
    return callApi('fetchNotifications');
};

export const apiMarkNotificationsRead = async (notificationIds: string[]): Promise<{ message: string }> => {
    return callApi('markNotificationsRead', { notificationIds });
};


// --- Admin Functions ---
export const fetchAllUsers = async (page: number, pageSize: number): Promise<{ users: User[], total: number }> => {
    return callApi('fetchAllUsers', { page, pageSize }); 
};
export const fetchAdminDashboardAnalytics = async (): Promise<AdminDashboardAnalytics> => {
    return callApi('fetchAdminDashboardAnalytics');
};

export const apiFetchChartData = async (): Promise<AdminChartData> => {
    return callApi('fetchChartData');
};

export const uploadOrderPdf = async (orderId: string, pdfBase64: string, mimeType: string) => {
    return callApi('uploadOrderPdf', { orderId, pdfBase64, mimeType });
}

export const fetchAllMoneyRequests = async (): Promise<AdminTransaction[]> => {
    return callApi('fetchAllMoneyRequests');
};

export const approveTransaction = async (requestId: string) => {
    return callApi('approveTransaction', { requestId });
};

export const rejectTransaction = async (requestId: string, reason?: string) => {
    return callApi('rejectTransaction', { requestId, reason });
};

export const apiReverifyTransaction = async (requestId: string): Promise<{ newStatus: string, verificationStatus: string, smsAmount?: number, smsCompany?: string, smsSenderNumber?: string }> => {
    return callApi('reverifyTransaction', { requestId });
};

export const updateOrderStatus = async (orderId: string, status: OrderStatus, reason?: string) => {
    return callApi('updateOrderStatus', { orderId, status, reason });
}

export const updateOrderDetails = async (orderId: string, details: { nidNumber: string; customerName: string; dateOfBirth: string }) => {
    return callApi('updateOrderDetails', { orderId, details });
}

export const fetchCallListOrders = async (): Promise<CallListOrder[]> => {
    return callApi('fetchCallListOrders');
};

export const uploadCallListOrderPdf = async (orderId: string, pdfBase64: string, mimeType: string) => {
    return callApi('uploadCallListOrderPdf', { orderId, pdfBase64, mimeType });
};

export const updateCallListOrderStatus = async (orderId: string, status: OrderStatus, reason?: string) => {
    return callApi('updateCallListOrderStatus', { orderId, status, reason });
};

export const updateUserStatus = async (userIdToUpdate: string, status: 'Active' | 'Blocked') => {
    return callApi('updateUserStatus', { userIdToUpdate, status });
};

export const apiAdminSendEmail = async (targetUserId: string, subject: string, body: string) => {
    return callApi('adminSendEmailToUser', { targetUserId, subject, body });
};

export const apiAdminSendEmailToAllUsers = async (subject: string, body: string) => {
    return callApi('adminSendEmailToAllUsers', { subject, body });
};

export const fetchAllTransactions = async (page: number, pageSize: number): Promise<{ transactions: Transaction[], total: number }> => {
    return callApi('fetchAllTransactions', { page, pageSize });
};

export const apiFetchSettings = async (): Promise<Settings> => {
    return callApi('fetchSettings');
};

export const apiUpdateSettings = async (settings: Settings) => {
    return callApi('updateSettings', { settings });
};

export const apiAdminRecharge = async (userIdToRecharge: string, amount: number, description: string) => {
    return callApi('adminRecharge', { userIdToRecharge, amount, description });
};

export const apiFetchAdminRecharges = async (): Promise<Transaction[]> => {
    return callApi('fetchAdminRecharges');
};