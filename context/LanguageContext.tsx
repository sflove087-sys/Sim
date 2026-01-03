import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

// --- Embedded Translations ---
const bn = {
    "common": { "processing": "প্রসেসিং হচ্ছে...", "pleaseWait": "অনুগ্রহ করে অপেক্ষা করুন।", "save": "সংরক্ষণ করুন", "cancel": "বাতিল", "edit": "এডিট করুন", "goBack": "ফিরে যান", "submit": "জমা দিন", "viewDetails": "বিস্তারিত দেখুন", "actions": "একশন", "status": "স্ট্যাটাস", "description": "বিবরণ", "amount": "পরিমাণ", "date": "তারিখ", "na": "N/A", "price": "মূল্য", "completed": "কমপ্লিট", "pending": "পেন্ডিং", "rejected": "রিজেক্টেড", "failed": "ব্যর্থ", "loading": "লোড হচ্ছে...", "refresh": "রিফ্রেশ করুন", "all": "সব দেখুন" },
    "language": { "change": "Change Language" },
    "header": { "welcome": "স্বাগতম", "logout": "লগআউট" },
    "auth": { "signInTitle": "আপনার একাউন্টে সাইন ইন করুন", "signInSubtitle": "ডিজিটাল সেবা", "mobileOrEmailLabel": "মোবাইল অথবা ইমেইল", "mobilePlaceholder": "171 234 5678", "emailPlaceholder": "example@email.com", "passwordLabel": "পাসওয়ার্ড", "passwordPlaceholder": "••••••••", "forgotPassword": "পাসওয়ার্ড ভুলে গেছেন?", "signInButton": "সাইন ইন করুন", "noAccount": "একাউন্ট নেই?", "registerHere": "এখানে রেজিস্টার করুন", "signUpTitle": "নতুন একাউন্ট তৈরি করুন", "nameLabel": "আপনার নাম", "mobileLabel": "মোবাইল নাম্বার", "emailLabel": "ইমেইল", "passwordRequirement": "কমপক্ষে ৮ অক্ষর, ১টি বড় হাতের, ১টি ছোট হাতের অক্ষর এবং ১টি সংখ্যা থাকতে হবে।", "registerButton": "রেজিস্টার করুন", "hasAccount": "ইতিমধ্যে একাউন্ট আছে?", "loginHere": "লগইন করুন", "resetPasswordTitle": "পাসওয়ার্ড রিসেট", "resetPasswordInstruction": "আপনার নিবন্ধিত ইমেইল বা মোবাইল নম্বর দিন। আমরা আপনাকে পাসওয়ার্ড রিসেট করার জন্য একটি কোড পাঠাবো।", "sendResetCode": "রিসেট কোড পাঠান", "setNewPasswordTitle": "নতুন পাসওয়ার্ড সেট করুন", "setNewPasswordInstruction": "আপনার ইমেইলে পাঠানো ৬-সংখ্যার কোড এবং নতুন পাসওয়ার্ড দিন।", "resetCodeLabel": "রিসেট কোড", "newPasswordLabel": "নতুন পাসওয়ার্ড", "confirmPasswordLabel": "পাসওয়ার্ড নিশ্চিত করুন", "changePasswordButton": "পাসওয়ার্ড পরিবর্তন করুন", "backToLogin": "লগইন পেজে ফিরে যান" },
    "dashboard": { "title": "ড্যাশবোর্ড", "walletBalance": "ওয়ালেট ব্যালেন্স", "hideBalance": "ব্যালেন্স লুকান", "showBalance": "ব্যালেন্স দেখুন", "notice": "নোটিশ", "dismissNotice": "নোটিশ বন্ধ করুন", "menu": { "addMoney": "টাকা যোগ করুন", "biometricOrder": "বায়োমেট্রিক অর্ডার", "callListOrder": "কল লিস্ট অর্ডার", "orderHistory": "অর্ডার হিস্টোরি" }, "recentTransactions": "সাম্প্রতিক লেনদেন", "noTransactions": "কোনো লেনদেন পাওয়া যায়নি।" },
    "transactions": { "title": "লেনদেন হিস্টোরি", "detailsTitle": "লেনদেনের বিবরণ", "id": "ট্রানজেকশন আইডি", "type": "ধরন", "noTransactionsFound": "কোনো লেনদেন পাওয়া যায়নি", "ifYouTransact": "আপনি কোনো লেনদেন করলে তা এখানে দেখানো হবে।" },
    "addMoney": { "title": "টাকা যোগ করুন", "step1": "পদ্ধতি বাছাই", "step2": "বিবরণ জমা", "step1Title": "ধাপ ১: পেমেন্ট পদ্ধতি বাছাই করুন", "step2Title": "ধাপ ২: টাকা পাঠিয়ে তথ্য জমা দিন", "change": "পরিবর্তন করুন", "sendMoneyInstruction": "আপনার {methodName} অ্যাপ থেকে নিচের নম্বরে Send Money করুন:", "copyNumber": "নম্বর কপি করুন", "numberCopied": "নম্বর কপি করা হয়েছে!", "sendMoneyNote": "শুধুমাত্র 'Send Money' অপশন ব্যবহার করুন। রেফারেন্সে কিছু লেখার প্রয়োজন নেই।", "amountPlaceholder": "আপনি কত টাকা পাঠিয়েছেন?", "senderLast4": "প্রেরক নম্বর (শেষ ৪ ডিজিট)", "senderLast4Placeholder": "যে নম্বর থেকে টাকা পাঠিয়েছেন তার শেষ ৪টি সংখ্যা", "transactionId": "ট্রানজেকশন আইডি (TxnID)", "transactionIdPlaceholder": "টাকা পাঠানোর পর মেসেজে পাওয়া TxnID দিন", "noPaymentMethods": "দুঃখিত, এই মুহূর্তে কোনো পেমেন্ট পদ্ধতি উপলব্ধ নেই।", "tryLater": "অনুগ্রহ করে পরে আবার চেষ্টা করুন অথবা সাপোর্টে যোগাযোগ করুন।" },
    "biometricOrder": { "title": "বায়োমেট্রিক অর্ডার", "orderPrice": "অর্ডার মূল্য", "priceNote": "আপনার ওয়ালেট থেকে এই পরিমাণ টাকা কেটে নেওয়া হবে।", "operator": "অপারেটর", "mobileNumber": "মোবাইল নাম্বার", "mobilePlaceholder": "e.g., 01712345678", "confirmOrder": "অর্ডার কনফার্ম করুন", "orderingDisabledNotice": "অর্ডার সুবিধা বন্ধ আছে", "orderingDisabledMessage": "অর্ডার করার সুবিধা সাময়িকভাবে বন্ধ রাখা হয়েছে। অনুগ্রহ করে পরে আবার চেষ্টা করুন।" },
    "callListOrder": { "title": "কল লিস্ট অর্ডার", "selectDuration": "মেয়াদ নির্বাচন করুন", "3months": "৩ মাস", "6months": "৬ মাস", "operator": "অপারেটর", "mobileNumber": "মোবাইল নাম্বার", "mobilePlaceholder": "e.g., 01712345678", "confirmOrder": "অর্ডার কনফার্ম করুন (মূল্য: ৳{price})", "orderingDisabledNotice": "অর্ডার সুবিধা বন্ধ আছে", "orderingDisabledMessage": "কল লিস্ট অর্ডার করার সুবিধা সাময়িকভাবে বন্ধ রাখা হয়েছে। অনুগ্রহ করে পরে আবার চেষ্টা করুন।" },
    "orderHistory": { "title": "অর্ডার হিস্টোরি", "orderType": "অর্ডারের ধরন", "biometric": "বায়োমেট্রিক", "callList": "কল লিস্ট", "details": "বিবরণ", "noOrders": "কোনো অর্ডার পাওয়া যায়নি।", "orderDetailsTitle": "অর্ডারের বিবরণ", "orderId": "অর্ডার আইডি", "customerName": "নাম", "nidNumber": "NID নাম্বার", "dateOfBirth": "জন্ম তারিখ", "duration": "মেয়াদ", "rejectionReason": "বাতিলের কারণ", "downloadPdf": "PDF ডাউনলোড করুন", "print": "প্রিন্ট করুন", "pdfNotAvailable": "PDF এখনো পাওয়া যায়নি" },
    "profile": { "title": "প্রোফাইল", "roleAdmin": "অ্যাডমিন", "roleUser": "ব্যবহারকারী", "email": "ইমেইল", "mobile": "মোবাইল", "editProfile": "প্রোফাইল এডিট করুন", "nameLabel": "আপনার নাম" },
    "sidebar": { "user": { "title": "ডিজিটাল সার্ভিস", "dashboard": "ড্যাশবোর্ড", "addMoney": "টাকা যোগ করুন", "biometricOrder": "বায়োমেট্রিক অর্ডার", "callListOrder": "কল লিস্ট অর্ডার", "orderHistory": "অর্ডার হিস্টোরি", "transactionHistory": "লেনদেন হিস্টোরি", "profile": "প্রোফাইল" }, "admin": { "title": "অ্যাডমিন প্যানেল", "dashboard": "অ্যাডমিন ড্যাশবোর্ড", "userManagement": "ইউজার ম্যানেজমেন্ট", "rechargeRequests": "টাকা যোগের অনুরোধ", "manageBiometricOrders": "বায়োমেট্রিক অর্ডার", "manageCallListOrders": "কল লিস্ট অর্ডার", "allTransactions": "সকল লেনদেন", "settings": "সেটিংস" }, "logout": "লগআউট" },
    "admin": { "dashboard": { "title": "অ্যাডমিন ড্যাশবোর্ড", "totalUsers": "মোট ইউজার", "pendingOrders": "পেন্ডিং অর্ডার", "completedOrders": "কমপ্লিট অর্ডার", "totalRevenue": "মোট আয়", "last7Days": "বিগত ৭ দিনের কার্যক্রম", "newUsers": "নতুন ব্যবহারকারী", "successfulOrders": "সফল অর্ডার" }, "userManagement": { "title": "ইউজার ম্যানেজমেন্ট", "name": "নাম", "email": "ইমেইল", "mobile": "মোবাইল", "walletBalance": "ওয়ালেট ব্যালেন্স", "active": "একটিভ", "blocked": "ব্লকড", "blockUser": "ব্লক করুন", "unblockUser": "আনব্লক করুন", "processing": "প্রসেসিং...", "confirmStatusChangeTitle": "স্ট্যাটাস পরিবর্তন নিশ্চিত করুন", "confirmStatusChangeMessage": "আপনি কি সত্যিই ব্যবহারকারী {userName} কে {action} করতে চান?", "yesBlock": "হ্যাঁ, ব্লক করুন", "yesUnblock": "হ্যাঁ, আনব্লক করুন", "userDetailsTitle": "ইউজারের বিবরণ", "userId": "ইউজার আইডি", "balance": "ব্যালেন্স", "ipAddress": "আইপি ঠিকানা", "lastActive": "সর্বশেষ সক্রিয়", "never": "কখনো না", "online": "অনলাইন", "offline": "অফলাইন" } },
    "toasts": { "error": { "fillAllFields": "অনুগ্রহ করে সকল ঘর পূরণ করুন।", "passwordMismatch": "পাসওয়ার্ড দুটি মেলেনি।", "invalidAmount": "অনুগ্রহ করে সঠিক টাকার পরিমাণ দিন।", "insufficientBalance": "আপনার ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই।", "genericLoadError": "তথ্য লোড করা যায়নি।" }, "success": { "loginSuccess": "লগইন সফল হয়েছে!", "profileUpdated": "প্রোফাইল সফলভাবে আপডেট করা হয়েছে।" } }
};
const en = {
    "common": { "processing": "Processing...", "pleaseWait": "Please wait.", "save": "Save", "cancel": "Cancel", "edit": "Edit", "goBack": "Go Back", "submit": "Submit", "viewDetails": "View Details", "actions": "Actions", "status": "Status", "description": "Description", "amount": "Amount", "date": "Date", "na": "N/A", "price": "Price", "completed": "Completed", "pending": "Pending", "rejected": "Rejected", "failed": "Failed", "loading": "Loading...", "refresh": "Refresh", "all": "View All" },
    "language": { "change": "ভাষা পরিবর্তন করুন" },
    "header": { "welcome": "Welcome", "logout": "Logout" },
    "auth": { "signInTitle": "Sign in to your account", "signInSubtitle": "Digital Services", "mobileOrEmailLabel": "Mobile or Email", "mobilePlaceholder": "171 234 5678", "emailPlaceholder": "example@email.com", "passwordLabel": "Password", "passwordPlaceholder": "••••••••", "forgotPassword": "Forgot password?", "signInButton": "Sign In", "noAccount": "Don't have an account?", "registerHere": "Register here", "signUpTitle": "Create a new account", "nameLabel": "Your Name", "mobileLabel": "Mobile Number", "emailLabel": "Email", "passwordRequirement": "At least 8 characters, 1 uppercase, 1 lowercase letter, and 1 number.", "registerButton": "Register", "hasAccount": "Already have an account?", "loginHere": "Login here", "resetPasswordTitle": "Reset Password", "resetPasswordInstruction": "Enter your registered email or mobile number. We will send you a code to reset your password.", "sendResetCode": "Send Reset Code", "setNewPasswordTitle": "Set a New Password", "setNewPasswordInstruction": "Enter the 6-digit code sent to your email and your new password.", "resetCodeLabel": "Reset Code", "newPasswordLabel": "New Password", "confirmPasswordLabel": "Confirm Password", "changePasswordButton": "Change Password", "backToLogin": "Back to Login" },
    "dashboard": { "title": "Dashboard", "walletBalance": "Wallet Balance", "hideBalance": "Hide Balance", "showBalance": "Show Balance", "notice": "Notice", "dismissNotice": "Dismiss Notice", "menu": { "addMoney": "Add Money", "biometricOrder": "Biometric Order", "callListOrder": "Call List Order", "orderHistory": "Order History" }, "recentTransactions": "Recent Transactions", "noTransactions": "No transactions found." },
    "transactions": { "title": "Transaction History", "detailsTitle": "Transaction Details", "id": "Transaction ID", "type": "Type", "noTransactionsFound": "No Transactions Found", "ifYouTransact": "Your transactions will be shown here." },
    "addMoney": { "title": "Add Money", "step1": "Select Method", "step2": "Submit Details", "step1Title": "Step 1: Select a Payment Method", "step2Title": "Step 2: Send money and submit information", "change": "Change", "sendMoneyInstruction": "Use your {methodName} app to 'Send Money' to the number below:", "copyNumber": "Copy Number", "numberCopied": "Number copied!", "sendMoneyNote": "Only use the 'Send Money' option. No reference is needed.", "amountPlaceholder": "How much did you send?", "senderLast4": "Sender Number (Last 4 digits)", "senderLast4Placeholder": "Last 4 digits of the number you sent from", "transactionId": "Transaction ID (TxnID)", "transactionIdPlaceholder": "Enter the TxnID from the confirmation SMS", "noPaymentMethods": "Sorry, no payment methods are available at the moment.", "tryLater": "Please try again later or contact support." },
    "biometricOrder": { "title": "Biometric Order", "orderPrice": "Order Price", "priceNote": "This amount will be deducted from your wallet.", "operator": "Operator", "mobileNumber": "Mobile Number", "mobilePlaceholder": "e.g., 01712345678", "confirmOrder": "Confirm Order", "orderingDisabledNotice": "Ordering is currently disabled", "orderingDisabledMessage": "The ordering facility is temporarily suspended. Please try again later." },
    "callListOrder": { "title": "Call List Order", "selectDuration": "Select Duration", "3months": "3 Months", "6months": "6 Months", "operator": "Operator", "mobileNumber": "Mobile Number", "mobilePlaceholder": "e.g., 01712345678", "confirmOrder": "Confirm Order (Price: ৳{price})", "orderingDisabledNotice": "Ordering is currently disabled", "orderingDisabledMessage": "The call list ordering facility is temporarily suspended. Please try again later." },
    "orderHistory": { "title": "Order History", "orderType": "Order Type", "biometric": "Biometric", "callList": "Call List", "details": "Details", "noOrders": "No orders found.", "orderDetailsTitle": "Order Details", "orderId": "Order ID", "customerName": "Name", "nidNumber": "NID Number", "dateOfBirth": "Date of Birth", "duration": "Duration", "rejectionReason": "Reason for Rejection", "downloadPdf": "Download PDF", "print": "Print", "pdfNotAvailable": "PDF not yet available" },
    "profile": { "title": "Profile", "roleAdmin": "Admin", "roleUser": "User", "email": "Email", "mobile": "Mobile", "editProfile": "Edit Profile", "nameLabel": "Your Name" },
    "sidebar": { "user": { "title": "Digital Service", "dashboard": "Dashboard", "addMoney": "Add Money", "biometricOrder": "Biometric Order", "callListOrder": "Call List Order", "orderHistory": "Order History", "transactionHistory": "Transactions", "profile": "Profile" }, "admin": { "title": "Admin Panel", "dashboard": "Admin Dashboard", "userManagement": "User Management", "rechargeRequests": "Recharge Requests", "manageBiometricOrders": "Biometric Orders", "manageCallListOrders": "Call List Orders", "allTransactions": "All Transactions", "settings": "Settings" }, "logout": "Logout" },
    "admin": { "dashboard": { "title": "Admin Dashboard", "totalUsers": "Total Users", "pendingOrders": "Pending Orders", "completedOrders": "Completed Orders", "totalRevenue": "Total Revenue", "last7Days": "Activity in Last 7 Days", "newUsers": "New Users", "successfulOrders": "Successful Orders" }, "userManagement": { "title": "User Management", "name": "Name", "email": "Email", "mobile": "Mobile", "walletBalance": "Wallet Balance", "active": "Active", "blocked": "Blocked", "blockUser": "Block", "unblockUser": "Unblock", "processing": "Processing...", "confirmStatusChangeTitle": "Confirm Status Change", "confirmStatusChangeMessage": "Are you sure you want to {action} user {userName}?", "yesBlock": "Yes, block", "yesUnblock": "Yes, unblock", "userDetailsTitle": "User Details", "userId": "User ID", "balance": "Balance", "ipAddress": "IP Address", "lastActive": "Last Active", "never": "Never", "online": "Online", "offline": "Offline" } },
    "toasts": { "error": { "fillAllFields": "Please fill in all fields.", "passwordMismatch": "Passwords do not match.", "invalidAmount": "Please enter a valid amount.", "insufficientBalance": "Insufficient balance in your wallet.", "genericLoadError": "Could not load data." }, "success": { "loginSuccess": "Login successful!", "profileUpdated": "Profile updated successfully." } }
};
const translations = { bn, en };
// --- End of Translations ---

type Language = 'bn' | 'en';
type Translations = typeof translations;

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  translations: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('language') as Language) || 'bn';
  });

  const setLanguage = (lang: Language) => {
    localStorage.setItem('language', lang);
    setLanguageState(lang);
    document.documentElement.lang = lang;
  };
  
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = {
    language,
    setLanguage,
    translations
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
