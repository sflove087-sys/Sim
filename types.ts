

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
  fcmToken?: string;
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
  userId: string;
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
  senderNumber?: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Verifying';
  rejectionReason?: string;
  verificationStatus?: 'Verified' | 'Mismatch' | 'Not Found' | 'Duplicate';
  smsAmount?: number;
  smsCompany?: string;
  smsSenderNumber?: string;
  verificationAttempts?: number;
}

export interface PaymentMethod {
    name: string;
    type: 'Bkash' | 'Nagad' | 'Rocket';
    number: string;
    logoUrl?: string;
}

export interface Settings {
    biometricOrderPrice: number;
    callListPrice3Months: number;
    callListPrice6Months: number;
    paymentMethods: PaymentMethod[];
    notificationEmail: string;
    isAddMoneyVisible: boolean;
    isBiometricOrderVisible: boolean;
    isCallListOrderVisible: boolean;
    biometricOrderOffMessage: string;
    callListOrderOffMessage: string;
    headlineNotices: string[];
    emailDetailsCharge: number;
}

export interface AdminDashboardAnalytics {
  totalUsers: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
}

export interface AdminChartData {
  labels: string[];
  signupData: number[];
  orderData: number[];
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
  isEmailSent?: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  timestamp: string;
  message: string;
  isRead: boolean;
  type: 'ORDER_COMPLETED' | 'RECHARGE_SUCCESS' | 'GENERAL';
  referenceId?: string;
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
    RECHARGE_REQUESTS = 'RECHARGE_REQUESTS',
    MANAGE_ORDERS = 'MANAGE_ORDERS',
    MANAGE_CALL_LIST_ORDERS = 'MANAGE_CALL_LIST_ORDERS',
    ALL_TRANSACTIONS = 'ALL_TRANSACTIONS',
    ADMIN_SETTINGS = 'ADMIN_SETTINGS',
    PUSH_NOTIFICATIONS = 'PUSH_NOTIFICATIONS',
}