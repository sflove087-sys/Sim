
export interface User {
  id: string;
  name: string;
  mobile: string;
  email: string;
  role: 'User' | 'Admin';
  status: 'Active' | 'Blocked';
  photoUrl?: string;
  ipAddress?: string;
}

export interface Wallet {
  balance: number;
}

export enum TransactionType {
  CREDIT = 'Credit',
  DEBIT = 'Debit',
  BONUS = 'Bonus'
}

export enum TransactionStatus {
  PENDING = 'Pending',
  COMPLETED = 'Completed',
  FAILED = 'Failed'
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  userId?: string;
}

export enum Operator {
  GP = 'GP',
  ROBI = 'Robi',
  BANGLALINK = 'Banglalink',
  AIRTEL = 'Airtel',
  TELETALK = 'Teletalk'
}

export enum OrderStatus {
  PENDING = 'Pending',
  COMPLETED = 'Completed',
  REJECTED = 'Rejected'
}

export interface Order {
  id: string;
  date: string;
  operator: Operator;
  mobile: string;
  price: number;
  status: OrderStatus;
  pdfUrl?: string;
  nidNumber?: string;
  customerName?: string;
  dateOfBirth?: string;
  rejectionReason?: string;
}

export interface OrderDetails extends Order {
    nidNumber: string;
    customerName: string;
    dateOfBirth: string;
}

export interface PaymentMethod {
    name: string; // e.g., "Bkash Personal"
    type: 'Bkash' | 'Nagad' | 'Rocket';
    number: string;
    logoUrl?: string;
}

// For Admin Verification Panel
export interface AdminTransaction {
  requestId: string;
  date: string;
  userId: string;
  transactionId: string;
  amount: number;
  paymentMethod?: string;
}


export enum Page {
    DASHBOARD = 'DASHBOARD',
    ADD_MONEY = 'ADD_MONEY',
    BIOMETRIC_ORDER = 'BIOMETRIC_ORDER',
    ORDER_HISTORY = 'ORDER_HISTORY',
    TRANSACTION_HISTORY = 'TRANSACTION_HISTORY',
    PROFILE = 'PROFILE',
    // Admin pages
    ADMIN_DASHBOARD = 'ADMIN_DASHBOARD',
    USER_MANAGEMENT = 'USER_MANAGEMENT',
    MANAGE_ORDERS = 'MANAGE_ORDERS',
    ALL_TRANSACTIONS = 'ALL_TRANSACTIONS',
    ADMIN_SETTINGS = 'ADMIN_SETTINGS',
    ADMIN_RECHARGE = 'ADMIN_RECHARGE',
}

export interface Settings {
    biometricOrderPrice: number;
    paymentMethods: PaymentMethod[];
    notificationEmail?: string;
}