
export interface User {
  id: string;
  name: string;
  mobile: string;
  email: string;
  role: 'User' | 'Admin';
  status: 'Active' | 'Blocked';
  photoUrl?: string;
  ipAddress?: string;
  balance?: number;
  lastSeen?: string;
}

export interface Wallet {
  balance: number;
}

export enum TransactionType {
  CREDIT = 'Credit',
  DEBIT = 'Debit',
  BONUS = 'Bonus',
}

export enum TransactionStatus {
  COMPLETED = 'Completed',
  PENDING = 'Pending',
  FAILED = 'Failed',
}

export interface Transaction {
  id: string;
  userId?: string;
  date: string;
  description: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
}

export enum Operator {
  GP = 'GP',
  ROBI = 'Robi',
  AIRTEL = 'Airtel',
  BANGLALINK = 'Banglalink',
  TELETALK = 'Teletalk',
}

export enum OrderStatus {
  PENDING = 'Pending',
  COMPLETED = 'Completed',
  REJECTED = 'Rejected',
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

export interface CallListOrder {
  id: string;
  userId: string;
  date: string;
  operator: Operator;
  mobile: string;
  duration: '3 Months' | '6 Months';
  price: number;
  status: OrderStatus;
  rejectionReason?: string;
  pdfUrl?: string;
}

export interface OrderDetails extends Order {
  nidNumber: string;
  customerName: string;
  dateOfBirth: string;
}

export interface AdminTransaction {
  requestId: string;
  date: string;
  userId: string;
  transactionId: string;
  amount: number;
  paymentMethod: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  rejectionReason?: string;
}

export interface PaymentMethod {
    name: string;
    type: 'Bkash' | 'Nagad' | 'Rocket';
    number: string;
    logoUrl?: string;
}

export interface Settings {
    biometricOrderPrice: number;
    paymentMethods: PaymentMethod[];
    notificationEmail: string;
    isOrderingEnabled: boolean;
    isCallListOrderingEnabled: boolean;
    headlineNotice: string;
}

export interface OrderHistoryItem {
  id: string;
  date: string;
  price: number;
  status: OrderStatus;
  rejectionReason?: string;
  type: 'Biometric' | 'Call List';
  operator: Operator;
  mobile: string;
  // Biometric specific
  pdfUrl?: string;
  nidNumber?: string;
  customerName?: string;
  dateOfBirth?: string;
  // Call List specific
  duration?: '3 Months' | '6 Months';
}

export enum Page {
    DASHBOARD = 'DASHBOARD',
    ADD_MONEY = 'ADD_MONEY',
    BIOMETRIC_ORDER = 'BIOMETRIC_ORDER',
    CALL_LIST_ORDER = 'CALL_LIST_ORDER',
    ORDER_HISTORY = 'ORDER_HISTORY',
    TRANSACTION_HISTORY = 'TRANSACTION_HISTORY',
    PROFILE = 'PROFILE',
    // Admin
    ADMIN_DASHBOARD = 'ADMIN_DASHBOARD',
    USER_MANAGEMENT = 'USER_MANAGEMENT',
    MANAGE_ORDERS = 'MANAGE_ORDERS',
    MANAGE_CALL_LIST_ORDERS = 'MANAGE_CALL_LIST_ORDERS',
    ALL_TRANSACTIONS = 'ALL_TRANSACTIONS',
    ADMIN_SETTINGS = 'ADMIN_SETTINGS',
    ADMIN_RECHARGE = 'ADMIN_RECHARGE',
}
