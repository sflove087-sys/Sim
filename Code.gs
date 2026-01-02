
const SPREADSHEET_ID = "18rYrE70i5_HKqxXoABvtMbetFAt8bnRxNy0YIgmI5ZQ"; // আপনার Google Sheet ID এখানে দিন
const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
const usersSheet = ss.getSheetByName("Users");
const walletSheet = ss.getSheetByName("Wallet");
const transactionsSheet = ss.getSheetByName("Transactions");
const ordersSheet = ss.getSheetByName("Orders");
const adminTransactionsSheet = ss.getSheetByName("AdminTransactions");
const settingsSheet = ss.getSheetByName("Settings");

const REGISTRATION_BONUS = 10;
const ORDER_TIMEOUT_MINUTES = 40; 

// --- Main Handler ---
function doPost(e) {
  try {
    const request = JSON.parse(e.postData.contents);
    const action = request.action;
    let response;

    const lock = LockService.getScriptLock();
    lock.waitLock(30000); 

    try {
      const actions = {
        'signup': handleSignup, 'login': handleLogin, 'fetchWallet': handleFetchWallet,
        'addMoneyRequest': handleAddMoneyRequest, 'createBiometricOrder': handleCreateBiometricOrder,
        'fetchTransactions': handleFetchTransactions, 'fetchOrders': handleFetchOrders,
        'updateProfile': handleUpdateProfile,
        // Admin
        'fetchAllUsers': handleFetchAllUsers, 'fetchPendingTransactions': handleFetchPendingTransactions,
        'approveTransaction': handleApproveTransaction, 'rejectTransaction': handleRejectTransaction,
        'uploadOrderPdf': handleUploadOrderPdf, 'updateOrderStatus': handleUpdateOrderStatus,
        'updateOrderDetails': handleUpdateOrderDetails, 'fetchAdminDashboardAnalytics': handleFetchAdminDashboardAnalytics,
        'updateUserStatus': handleUpdateUserStatus, 'fetchAllTransactions': handleFetchAllTransactions,
        'fetchSettings': handleFetchSettings, 'updateSettings': handleUpdateSettings,
        'adminRecharge': handleAdminRecharge, 'fetchAdminRecharges': handleFetchAdminRecharges,
      };

      if (actions[action]) {
        response = actions[action](request.payload);
      } else {
        throw new Error("Invalid action specified.");
      }
    } finally {
      lock.releaseLock();
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, data: response }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log(error.stack);
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// --- Setting Utility ---
function getSetting(key) {
    if (!settingsSheet) throw new Error("Settings sheet not found.");
    const settings = settingsSheet.getDataRange().getValues();
    const settingRow = settings.find(row => row[0] === key);
    if (!settingRow || settingRow[1] === '') {
        // Provide default values for critical settings if they are not found or empty
        if (key === 'paymentMethods') return '[]'; 
        if (key === 'biometricOrderPrice') return '350';
        if (key === 'notificationEmail') return '';
        throw new Error(`Setting key "${key}" not found.`);
    }
    return settingRow[1];
}


// --- User Action Handlers ---

function handleSignup(payload) {
  const { name, mobile, email, pass, ipAddress } = payload;
  if (!name || !mobile || !email || !pass) throw new Error("অনুগ্রহ করে সকল ঘর পূরণ করুন।");
  if (findRow(usersSheet, email, 4) !== -1 || findRow(usersSheet, mobile, 3) !== -1) throw new Error("এই ইমেইল অথবা মোবাইল দিয়ে ইতিমধ্যে একাউন্ট আছে।");

  const userId = "user" + Date.now();
  const signupDate = new Date().toISOString();
  
  usersSheet.appendRow([userId, name, mobile, email, pass, 'User', signupDate, 'Active', '', ipAddress || 'N/A']);
  walletSheet.appendRow([userId, REGISTRATION_BONUS]);
  transactionsSheet.appendRow(["tx" + Date.now(), userId, signupDate, "রেজিস্ট্রেশন বোনাস", "Bonus", REGISTRATION_BONUS, "Completed"]);

  return { message: 'রেজিস্ট্রেশন সফল হয়েছে!' };
}

function handleLogin(payload) {
    const { loginId, pass } = payload;
    const usersData = usersSheet.getDataRange().getValues();
    const userRow = usersData.find(row => (row[3] === loginId || row[2] === loginId));

    if (!userRow || userRow[4] !== pass) throw new Error("ভুল মোবাইল/ইমেইল অথবা পাসওয়ার্ড।");
    if (userRow[7] === 'Blocked') throw new Error("আপনার একাউন্টটি ব্লক করা হয়েছে। অনুগ্রহ করে সাপোর্টে যোগাযোগ করুন।");

    return mapUserRowToObject(userRow);
}

function handleFetchWallet(payload) {
  const { userId } = payload;
  const walletRowIndex = findRow(walletSheet, userId, 1);
  if (walletRowIndex === -1) throw new Error("ওয়ালেট খুঁজে পাওয়া যায়নি।");
  return { balance: walletSheet.getRange(walletRowIndex, 2).getValue() };
}

function handleAddMoneyRequest(payload) {
  const { userId, transactionId, amount, paymentMethod } = payload;
  if (!transactionId || !amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0 || !paymentMethod) {
     throw new Error("অনুগ্রহ করে সকল তথ্য সঠিকভাবে পূরণ করুন।");
  }
  if (findRow(adminTransactionsSheet, transactionId, 4) !== -1) throw new Error("এই ট্রানজেকশন আইডিটি ইতিমধ্যে ব্যবহার করা হয়েছে।");

  const requestId = "req" + Date.now();
  const date = new Date();
  adminTransactionsSheet.appendRow([requestId, date.toISOString(), userId, transactionId, parseFloat(amount), "Pending", paymentMethod]);
  
  // Send notification email
  const subject = `নতুন টাকা যোগ করার অনুরোধ: ৳${amount}`;
  const body = `
    একজন ব্যবহারকারী টাকা যোগ করার জন্য একটি নতুন অনুরোধ জমা দিয়েছেন।<br><br>
    <b>ব্যবহারকারী আইডি:</b> ${userId}<br>
    <b>টাকার পরিমাণ:</b> ৳${amount}<br>
    <b>পেমেন্ট পদ্ধতি:</b> ${paymentMethod}<br>
    <b>ট্রানজেকশন আইডি:</b> ${transactionId}<br>
    <b>তারিখ:</b> ${date.toLocaleString('bn-BD')}<br><br>
    অনুগ্রহ করে অ্যাডমিন প্যানেল থেকে অনুরোধটি যাচাই করুন।
  `;
  sendNotificationEmail(subject, body);

  return { message: "আপনার অনুরোধটি পর্যালোচনার জন্য পাঠানো হয়েছে।" };
}

function handleCreateBiometricOrder(payload) {
    const { userId, order } = payload;
    const BIOMETRIC_ORDER_PRICE = Number(getSetting('biometricOrderPrice'));
    const walletRowIndex = findRow(walletSheet, userId, 1);
    if(walletRowIndex === -1) throw new Error("ওয়ালেট পাওয়া যায়নি।");

    const currentBalance = walletSheet.getRange(walletRowIndex, 2).getValue();
    if (currentBalance < BIOMETRIC_ORDER_PRICE) throw new Error("আপনার ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই।");

    walletSheet.getRange(walletRowIndex, 2).setValue(currentBalance - BIOMETRIC_ORDER_PRICE);

    const orderId = "ord" + Date.now();
    const date = new Date();
    
    ordersSheet.appendRow([orderId, userId, date.toISOString(), order.operator, order.mobile, BIOMETRIC_ORDER_PRICE, "Pending", "", "", "", "", ""]);
    transactionsSheet.appendRow(["tx" + Date.now(), userId, date.toISOString(), `বায়োমেট্রিক অর্ডার (${order.mobile})`, "Debit", BIOMETRIC_ORDER_PRICE, "Completed"]);

    // Send notification email
    const subject = `নতুন বায়োমেট্রিক অর্ডার: ${order.operator} - ${order.mobile}`;
    const body = `
      একটি নতুন বায়োমেট্রিক অর্ডার তৈরি করা হয়েছে।<br><br>
      <b>অর্ডার আইডি:</b> ${orderId}<br>
      <b>ব্যবহারকারী আইডি:</b> ${userId}<br>
      <b>অপারেটর:</b> ${order.operator}<br>
      <b>মোবাইল নম্বর:</b> ${order.mobile}<br>
      <b>মূল্য:</b> ৳${BIOMETRIC_ORDER_PRICE}<br>
      <b>তারিখ:</b> ${date.toLocaleString('bn-BD')}<br><br>
      অনুগ্রহ করে অ্যাডমিন প্যানেল থেকে অর্ডারটি ম্যানেজ করুন।
    `;
    sendNotificationEmail(subject, body);

    return { message: "আপনার অর্ডার সফলভাবে তৈরি হয়েছে।" };
}

function handleUpdateProfile(payload) {
  const { userId, name, photoBase64, mimeType } = payload;
  if (!name.trim()) throw new Error("Name cannot be empty.");

  const userRowIndex = findRow(usersSheet, userId, 1);
  if (userRowIndex === -1) throw new Error("User not found.");

  usersSheet.getRange(userRowIndex, 2).setValue(name);

  if (photoBase64 && mimeType) {
    const fileUrl = uploadFileToDrive(photoBase64, mimeType, userId, "Profile Photos");
    usersSheet.getRange(userRowIndex, 9).setValue(fileUrl);
  }
  
  const updatedUserRow = usersSheet.getRange(userRowIndex, 1, 1, usersSheet.getLastColumn()).getValues()[0];
  return mapUserRowToObject(updatedUserRow);
}

function handleFetchTransactions(payload) {
  const { userId } = payload;
  
  const completedTransactions = transactionsSheet.getDataRange().getValues().slice(1)
    .filter(row => row[1] === userId)
    .map(row => ({ id: row[0], date: new Date(row[2]), description: row[3], type: row[4], amount: row[5], status: row[6] }));

  const pendingAddMoneyRequests = adminTransactionsSheet.getDataRange().getValues().slice(1)
    .filter(row => row[2] === userId && row[5] === "Pending")
    .map(row => ({ id: row[0], date: new Date(row[1]), description: "টাকা যোগ করার অনুরোধ", type: "Credit", amount: row[4], status: "Pending" }));
  
  const allTransactions = [...completedTransactions, ...pendingAddMoneyRequests];
  allTransactions.sort((a, b) => b.date.getTime() - a.date.getTime());

  return allTransactions.map(tx => ({ ...tx, date: tx.date.toLocaleDateString('bn-BD') }));
}

function handleFetchOrders(payload) {
  const { userId } = payload;
  if(!userId) throw new Error("অনুরোধ করার জন্য ইউজার আইডি আবশ্যক।");

  const sheetData = ordersSheet.getLastRow() > 1 ? ordersSheet.getRange(2, 1, ordersSheet.getLastRow() - 1, 12).getValues() : [];
  
  const mapRowToOrder = row => ({ id: row[0], date: new Date(row[2]).toLocaleDateString('bn-BD'), operator: row[3], mobile: row[4], price: row[5], status: row[6], pdfUrl: row[7], nidNumber: row[8], customerName: row[9], dateOfBirth: row[10], rejectionReason: row[11] });

  const dataToReturn = isAdmin(userId) ? sheetData : sheetData.filter(row => row[1] === userId);
  return dataToReturn.map(mapRowToOrder).reverse();
}

// --- ADMIN HANDLERS ---
function handleFetchAllUsers(payload) {
  if (!isAdmin(payload.userId)) throw new Error("শুধুমাত্র অ্যাডমিনরা এই তথ্য দেখতে পারবেন।");

  const usersData = usersSheet.getLastRow() > 1 ? usersSheet.getRange(2, 1, usersSheet.getLastRow() - 1, 10).getValues() : [];
  return usersData.map(mapUserRowToObject);
}

function handleFetchPendingTransactions() {
  return adminTransactionsSheet.getDataRange().getValues().slice(1)
    .filter(row => row[5] === "Pending")
    .map(row => ({ 
        requestId: row[0], 
        date: new Date(row[1]).toLocaleDateString('bn-BD'), 
        userId: row[2], 
        transactionId: row[3], 
        amount: row[4],
        paymentMethod: row[6] || 'N/A'
    }));
}

function handleFetchAdminDashboardAnalytics(payload) {
    if (!isAdmin(payload.userId)) throw new Error("শুধুমাত্র অ্যাডমিনরা এই তথ্য দেখতে পারবেন।");
    const BIOMETRIC_ORDER_PRICE = Number(getSetting('biometricOrderPrice'));
    const totalUsers = usersSheet.getLastRow() - 1;
    const ordersData = ordersSheet.getLastRow() > 1 ? ordersSheet.getRange(2, 1, ordersSheet.getLastRow() - 1, 7).getValues() : [];
    
    const pendingOrders = ordersData.filter(row => row[6] === 'Pending').length;
    const completedOrders = ordersData.filter(row => row[6] === 'Completed').length;
    const totalRevenue = completedOrders * BIOMETRIC_ORDER_PRICE;

    return { totalUsers, pendingOrders, completedOrders, totalRevenue };
}

function handleFetchSettings() {
    const methodsString = getSetting('paymentMethods');
    let paymentMethods = [];
    try {
        paymentMethods = JSON.parse(methodsString);
        if(!Array.isArray(paymentMethods)) paymentMethods = [];
    } catch (e) {
        paymentMethods = [];
    }

    return {
      biometricOrderPrice: Number(getSetting('biometricOrderPrice')),
      paymentMethods: paymentMethods,
      notificationEmail: getSetting('notificationEmail')
    };
}

function handleUpdateSettings(payload) {
  if (!isAdmin(payload.userId)) throw new Error("Permission denied.");
  
  const { settings } = payload;
  const settingsRange = settingsSheet.getDataRange();
  const settingsValues = settingsRange.getValues();

  for (const key in settings) {
    let valueToSave = settings[key];
    if (typeof valueToSave === 'object' && valueToSave !== null) {
      valueToSave = JSON.stringify(valueToSave);
    }

    const rowIndex = settingsValues.findIndex(row => row[0] === key);

    if (rowIndex !== -1) {
      settingsSheet.getRange(rowIndex + 1, 2).setValue(valueToSave);
    } else {
      settingsSheet.appendRow([key, valueToSave]);
      settingsValues.push([key, valueToSave]);
    }
  }
  return { message: "সেটিংস সফলভাবে আপডেট করা হয়েছে।" };
}

function handleAdminRecharge(payload) {
    if (!isAdmin(payload.userId)) throw new Error("শুধুমাত্র অ্যাডমিনরা এই তথ্য পরিবর্তন করতে পারবেন।");
    const { userIdToRecharge, amount, description } = payload;
    const numericAmount = parseFloat(amount);

    if (!userIdToRecharge || !numericAmount || numericAmount <= 0) {
        throw new Error("অনুগ্রহ করে সঠিক ইউজার আইডি এবং টাকার পরিমাণ দিন।");
    }

    const walletRowIndex = findRow(walletSheet, userIdToRecharge, 1);
    if (walletRowIndex === -1) {
        throw new Error(`ব্যবহারকারী (${userIdToRecharge}) এর ওয়ালেট খুঁজে পাওয়া যায়নি।`);
    }

    const currentBalance = walletSheet.getRange(walletRowIndex, 2).getValue();
    walletSheet.getRange(walletRowIndex, 2).setValue(currentBalance + numericAmount);

    const transactionDescription = `অ্যাডমিন কর্তৃক: ${description || 'রিচার্জ'}`;
    transactionsSheet.appendRow(["tx" + Date.now(), userIdToRecharge, new Date().toISOString(), transactionDescription, "Credit", numericAmount, "Completed"]);

    return { message: `৳${numericAmount} সফলভাবে রিচার্জ করা হয়েছে।` };
}

function handleFetchAdminRecharges(payload) {
  if (!isAdmin(payload.userId)) throw new Error("শুধুমাত্র অ্যাডমিনরা এই তথ্য দেখতে পারবেন।");
  
  const allTransactions = transactionsSheet.getDataRange().getValues().slice(1);
  
  const adminRecharges = allTransactions.filter(row => {
    const type = row[4];
    const description = row[3]; 
    return type === 'Credit' && description.startsWith('অ্যাডমিন কর্তৃক:');
  });

  return adminRecharges.map(row => ({ 
      id: row[0], 
      userId: row[1], 
      date: new Date(row[2]).toLocaleDateString('bn-BD'), 
      description: row[3], 
      type: row[4], 
      amount: row[5], 
      status: row[6] 
  })).reverse();
}

function handleUpdateUserStatus(payload) { const { userId, userIdToUpdate, status } = payload; if (!isAdmin(userId)) throw new Error("শুধুমাত্র অ্যাডমিনরা এই তথ্য পরিবর্তন করতে পারবেন।"); const validStatuses = ['Active', 'Blocked']; if (!userIdToUpdate || !status || validStatuses.indexOf(status) === -1) throw new Error("প্রয়োজনীয় তথ্য সঠিক নয়।"); const userRowIndex = findRow(usersSheet, userIdToUpdate, 1); if (userRowIndex === -1) throw new Error("ইউজারকে খুঁজে পাওয়া যায়নি।"); usersSheet.getRange(userRowIndex, 8).setValue(status); return { message: `ইউজারের স্ট্যাটাস সফলভাবে '${status}' করা হয়েছে।` }; }
function handleApproveTransaction(payload) { const { requestId } = payload; const requestRowIndex = findRow(adminTransactionsSheet, requestId, 1); if (requestRowIndex === -1) throw new Error("অনুরোধটি পাওয়া যায়নি।"); const requestRow = adminTransactionsSheet.getRange(requestRowIndex, 1, 1, 6).getValues()[0]; if (requestRow[5] !== "Pending") throw new Error("এই অনুরোধটি ইতিমধ্যে প্রসেস করা হয়েছে।"); const userId = requestRow[2]; const amount = parseFloat(requestRow[4]); const walletRowIndex = findRow(walletSheet, userId, 1); if (walletRowIndex === -1) throw new Error(`${userId} এর ওয়ালেট পাওয়া যায়নি।`); const currentBalance = walletSheet.getRange(walletRowIndex, 2).getValue(); walletSheet.getRange(walletRowIndex, 2).setValue(currentBalance + amount); transactionsSheet.appendRow(["tx" + Date.now(), userId, new Date().toISOString(), "টাকা যোগ (অ্যাডমিন)", "Credit", amount, "Completed"]); adminTransactionsSheet.getRange(requestRowIndex, 6).setValue("Approved"); return { message: "লেনদেনটি সফলভাবে Approve করা হয়েছে।" }; }
function handleRejectTransaction(payload) { const { requestId } = payload; const requestRowIndex = findRow(adminTransactionsSheet, requestId, 1); if (requestRowIndex === -1) throw new Error("অনুরোধটি পাওয়া যায়নি।"); if (adminTransactionsSheet.getRange(requestRowIndex, 6).getValue() !== "Pending") throw new Error("এই অনুরোধটি ইতিমধ্যে প্রসেস করা হয়েছে।"); const requestRow = adminTransactionsSheet.getRange(requestRowIndex, 1, 1, 6).getValues()[0]; const userId = requestRow[2]; const amount = parseFloat(requestRow[4]); transactionsSheet.appendRow(["tx" + Date.now(), userId, new Date().toISOString(), "টাকা যোগ করার অনুরোধ ব্যর্থ", "Credit", amount, "Failed"]); adminTransactionsSheet.getRange(requestRowIndex, 6).setValue("Rejected"); return { message: "লেনদেনটি Reject করা হয়েছে।" }; }
function handleUploadOrderPdf(payload) { const { orderId, pdfBase64, mimeType } = payload; const pdfUrl = uploadFileToDrive(pdfBase64, mimeType, orderId, "Order PDFs"); const orderRowIndex = findRow(ordersSheet, orderId, 1); if (orderRowIndex === -1) throw new Error("অর্ডারটি খুঁজে পাওয়া যায়নি।"); ordersSheet.getRange(orderRowIndex, 8).setValue(pdfUrl); ordersSheet.getRange(orderRowIndex, 7).setValue("Completed"); return { message: "PDF সফলভাবে আপলোড এবং অর্ডার কমপ্লিট করা হয়েছে।", pdfUrl }; }

function handleUpdateOrderStatus(payload) {
  if (!isAdmin(payload.userId)) throw new Error("শুধুমাত্র অ্যাডমিনরা এই তথ্য পরিবর্তন করতে পারবেন।");
  const { orderId, status, reason } = payload;
  if (!orderId || !status) throw new Error("অর্ডার আইডি এবং স্ট্যাটাস আবশ্যক।");
  if (["Pending", "Completed", "Rejected"].indexOf(status) === -1) throw new Error("অবৈধ স্ট্যাটাস।");

  const orderRowIndex = findRow(ordersSheet, orderId, 1);
  if (orderRowIndex === -1) throw new Error("অর্ডারটি খুঁজে পাওয়া যায়নি।");
  
  const orderData = ordersSheet.getRange(orderRowIndex, 1, 1, 12).getValues()[0];
  const currentStatus = orderData[6];

  // যদি স্ট্যাটাস 'Rejected' করা হয় এবং আগে থেকে 'Rejected' না থাকে
  if (status === 'Rejected' && currentStatus !== 'Rejected') {
    const orderUserId = orderData[1];
    const orderPrice = parseFloat(orderData[5]);

    // ব্যবহারকারীর ওয়ালেটে টাকা ফেরত দিন
    const walletRowIndex = findRow(walletSheet, orderUserId, 1);
    if (walletRowIndex !== -1) {
      const currentBalance = parseFloat(walletSheet.getRange(walletRowIndex, 2).getValue());
      walletSheet.getRange(walletRowIndex, 2).setValue(currentBalance + orderPrice);

      // রিফান্ডের জন্য একটি লেনদেন তৈরি করুন
      transactionsSheet.appendRow([
        "tx" + Date.now(),
        orderUserId,
        new Date().toISOString(),
        `অর্ডার (${orderId}) বাতিলের জন্য টাকা ফেরত`,
        "Credit",
        orderPrice,
        "Completed"
      ]);
    } else {
      Logger.log(`Critical Error: Wallet not found for user ${orderUserId} during refund for order ${orderId}.`);
    }
  }

  // অর্ডারের স্ট্যাটাস এবং বাতিলের কারণ আপডেট করুন
  ordersSheet.getRange(orderRowIndex, 7).setValue(status);
  ordersSheet.getRange(orderRowIndex, 12).setValue(status === "Rejected" ? reason || "কারণ উল্লেখ করা হয়নি।" : "");
  
  return { message: `অর্ডারের স্ট্যাটাস সফলভাবে "${status}" করা হয়েছে।` };
}

function handleUpdateOrderDetails(payload) { if (!isAdmin(payload.userId)) throw new Error("শুধুমাত্র অ্যাডমিনরা এই তথ্য পরিবর্তন করতে পারবেন।"); const { orderId, details } = payload; if (!orderId || !details) throw new Error("অর্ডার আইডি এবং বিবরণ আবশ্যক।"); const { nidNumber, customerName, dateOfBirth } = details; const orderRowIndex = findRow(ordersSheet, orderId, 1); if (orderRowIndex === -1) throw new Error("অর্ডারটি খুঁজে পাওয়া যায়নি।"); ordersSheet.getRange(orderRowIndex, 9, 1, 3).setValues([[nidNumber || "", customerName || "", dateOfBirth || ""]]); return { message: 'অর্ডারের বিবরণ সফলভাবে আপডেট করা হয়েছে।' }; }
function handleFetchAllTransactions(payload) { if (!isAdmin(payload.userId)) throw new Error("শুধুমাত্র অ্যাডমিনরা এই তথ্য দেখতে পারবেন।"); return transactionsSheet.getDataRange().getValues().slice(1).map(row => ({ id: row[0], userId: row[1], date: new Date(row[2]).toLocaleDateString('bn-BD'), description: row[3], type: row[4], amount: row[5], status: row[6] })).reverse(); }

// --- Utility Functions ---

function isAdmin(userId) { if (!userId) return false; const userRowIndex = findRow(usersSheet, userId, 1); return userRowIndex !== -1 && usersSheet.getRange(userRowIndex, 6).getValue() === 'Admin'; }
function findRow(sheet, value, col) { if (sheet.getLastRow() < 1) return -1; const data = sheet.getRange(1, col, sheet.getLastRow(), 1).getValues(); for (let i = 0; i < data.length; i++) if (data[i][0] == value) return i + 1; return -1; }
function mapUserRowToObject(row) { return { id: row[0], name: row[1], mobile: row[2], email: row[3], role: row[5], status: row[7], photoUrl: row[8], ipAddress: row[9] }; }
function uploadFileToDrive(base64Data, mimeType, fileName, folderName) { let folder; const folders = DriveApp.getFoldersByName(folderName); if (folders.hasNext()) folder = folders.next(); else folder = DriveApp.createFolder(folderName); const decoded = Utilities.base64Decode(base64Data.split(';base64,')[1]); const blob = Utilities.newBlob(decoded, mimeType, `${fileName}.${mimeType.split('/')[1]}`); const file = folder.createFile(blob); file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); return file.getUrl(); }
function sendNotificationEmail(subject, body) {
  try {
    const email = getSetting('notificationEmail');
    if (email && email.trim() !== '') {
      MailApp.sendEmail({
        to: email,
        subject: `🔔 ডিজিটাল সার্ভিস: ${subject}`,
        htmlBody: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            ${body}
            <br><hr>
            <p style="font-size: 12px; color: #888;">এটি একটি স্বয়ংক্রিয় ইমেইল। অনুগ্রহ করে এর উত্তর দেবেন না।</p>
          </div>
        `
      });
    } else {
      Logger.log("Notification email is not set. Skipping email.");
    }
  } catch(error) {
    Logger.log(`Failed to send notification email: ${error.toString()}`);
  }
}

// --- Time-based Triggers ---
function autoCancelOldOrders() { const lock = LockService.getScriptLock(); lock.waitLock(30000); try { const ordersData = ordersSheet.getDataRange().getValues(); const now = new Date(); const timeout = ORDER_TIMEOUT_MINUTES * 60 * 1000; for (let i = 1; i < ordersData.length; i++) { const orderRow = ordersData[i]; if (orderRow[6] === "Pending" && (now.getTime() - new Date(orderRow[2]).getTime() > timeout)) { const [orderId, userId, , , , orderPrice] = orderRow; const rowIndex = i + 1; ordersSheet.getRange(rowIndex, 7).setValue("Rejected"); ordersSheet.getRange(rowIndex, 12).setValue("সময়সীমা শেষ হওয়ায় অর্ডারটি স্বয়ংক্রিয়ভাবে বাতিল হয়েছে।"); const walletRowIndex = findRow(walletSheet, userId, 1); if (walletRowIndex !== -1) { const newBalance = parseFloat(walletSheet.getRange(walletRowIndex, 2).getValue()) + parseFloat(orderPrice); walletSheet.getRange(walletRowIndex, 2).setValue(newBalance); transactionsSheet.appendRow(["tx" + Date.now(), userId, new Date().toISOString(), `অর্ডার (${orderId}) বাতিলের জন্য টাকা ফেরত`, "Credit", orderPrice, "Completed"]); Logger.log(`Order ${orderId} for user ${userId} auto-cancelled and refunded.`); } else { Logger.log(`Could not find wallet for user ${userId} to refund order ${orderId}.`); } } } } catch (error) { Logger.log(`Error in autoCancelOldOrders: ${error}`); } finally { lock.releaseLock(); } }
function createTimeBasedTriggers() { ScriptApp.getProjectTriggers().forEach(trigger => trigger.getHandlerFunction() === "autoCancelOldOrders" && ScriptApp.deleteTrigger(trigger)); ScriptApp.newTrigger("autoCancelOldOrders").timeBased().everyMinutes(5).create(); Logger.log("Time-based trigger for autoCancelOldOrders created successfully."); }