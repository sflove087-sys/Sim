
import { User, Wallet, Transaction, Order, OrderDetails, Operator, AdminTransaction, OrderStatus, Settings } from '../types';

// =========================================================================
// গুরুত্বপূর্ণ: আপনার ডিপ্লয় করা Apps Script Web App URL টি এখানে পেস্ট করুন
// =========================================================================
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwIYuCOsm_JUmodCN8VLLO8Nw7NGcIEcl7HUDxGtMz2DaWW5lJ9ZQxAgFxGVcg_qA63TQ/exec"; 

// --- Central API Handler ---
// This function sends requests to our Google Apps Script backend
const callApi = async (action: string, payload: object = {}) => {
  try {
    // We get the userId from a simple session storage to simulate passing it with each request
    const sessionUser = sessionStorage.getItem('currentUser');
    const user = sessionUser ? JSON.parse(sessionUser) : null;
    
    // We always want to send the userId if a user is logged in, so the backend can handle permissions.
    const finalPayload = user ? { ...payload, userId: user.id } : payload;
    
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
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
    // Simulate session by storing user data in sessionStorage after login
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    return user;
};

// We will use a mock logout that just clears the session
export const apiLogout = () => {
    sessionStorage.removeItem('currentUser');
};

// --- USER DATA ---
export const fetchWallet = async (): Promise<Wallet> => callApi('fetchWallet');
export const fetchTransactions = async (): Promise<Transaction[]> => callApi('fetchTransactions');
export const fetchOrders = async (): Promise<Order[]> => {
    // Backend now handles role-based data fetching, so we just call it.
    // The userId of the logged-in user (admin or regular) will be sent by `callApi`.
    return callApi('fetchOrders');
};

export const addMoneyRequest = async (transactionId: string, amount: number, paymentMethod: string) => {
    return callApi('addMoneyRequest', { transactionId, amount, paymentMethod });
};

export const createBiometricOrder = async (order: { operator: Operator, mobile: string }) => {
    return callApi('createBiometricOrder', { order });
};

export const fetchOrderDetails = async (orderId: string): Promise<OrderDetails> => {
    // We call fetchOrders which returns all necessary details, even for a single user.
    const allOrders: Order[] = await callApi('fetchOrders'); 
    const baseOrder = allOrders.find(o => o.id === orderId);
    if (!baseOrder) throw new Error('অর্ডার খুঁজে পাওয়া যায়নি।');
    
    // The baseOrder from fetchOrders now contains all the necessary details.
    // We just need to ensure the fields exist and satisfy the OrderDetails type.
    return {
        ...baseOrder,
        nidNumber: baseOrder.nidNumber || 'N/A', // Provide a fallback if empty
        customerName: baseOrder.customerName || 'N/A', // Provide a fallback if empty
        dateOfBirth: baseOrder.dateOfBirth || 'N/A', // Provide a fallback if empty
    };
};

export const apiUpdateProfile = async (details: { name: string, photoBase64?: string, mimeType?: string }): Promise<User> => {
    return callApi('updateProfile', details);
};


// --- Admin Functions ---
export const fetchAllUsers = async (): Promise<User[]> => {
    return callApi('fetchAllUsers'); 
};
export const fetchAdminDashboardAnalytics = async () => {
    return callApi('fetchAdminDashboardAnalytics');
};

export const uploadOrderPdf = async (orderId: string, pdfBase64: string, mimeType: string) => {
    return callApi('uploadOrderPdf', { orderId, pdfBase64, mimeType });
}

export const fetchPendingTransactions = async (): Promise<AdminTransaction[]> => {
    return callApi('fetchPendingTransactions');
};

export const approveTransaction = async (requestId: string) => {
    return callApi('approveTransaction', { requestId });
};

export const rejectTransaction = async (requestId: string) => {
    return callApi('rejectTransaction', { requestId });
};

export const updateOrderStatus = async (orderId: string, status: OrderStatus, reason?: string) => {
    return callApi('updateOrderStatus', { orderId, status, reason });
}

export const updateOrderDetails = async (orderId: string, details: { nidNumber: string; customerName: string; dateOfBirth: string }) => {
    return callApi('updateOrderDetails', { orderId, details });
}

export const updateUserStatus = async (userIdToUpdate: string, status: 'Active' | 'Blocked') => {
    return callApi('updateUserStatus', { userIdToUpdate, status });
};

export const fetchAllTransactions = async (): Promise<Transaction[]> => {
    return callApi('fetchAllTransactions');
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