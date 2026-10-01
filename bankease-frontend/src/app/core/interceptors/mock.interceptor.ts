import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, delay, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResponse } from '../models/common.model';
import { DemoAccountCreds, MOCK_USER_PROFILES, MOCK_USERS, createMockAuthResponse } from '../mock/mock-users';
import { MOCK_ACCOUNTS } from '../mock/mock-accounts';
import { MOCK_TRANSACTIONS } from '../mock/mock-transactions';
import { MOCK_BENEFICIARIES } from '../mock/mock-beneficiaries';
import { MOCK_BILLERS, MOCK_BILL_HISTORY, MOCK_PENDING_BILLS } from '../mock/mock-bills';
import { MOCK_LOAN_APPLICATIONS, MOCK_LOAN_PRODUCTS, MOCK_MY_LOANS, MOCK_REPAYMENT_SCHEDULE } from '../mock/mock-loans';
import { MOCK_INVESTMENTS, MOCK_INVESTMENT_PRODUCTS, MOCK_PORTFOLIO_SUMMARY } from '../mock/mock-investments';
import { MOCK_NOTIFICATIONS } from '../mock/mock-notifications';
import { MOCK_AUDIT_LOGS } from '../mock/mock-audit-logs';
import { Account } from '../models/account.model';
import { Beneficiary } from '../models/beneficiary.model';
import { BillPaymentResponse } from '../models/bill.model';
import { Loan, LoanApplication } from '../models/loan.model';
import { Investment } from '../models/investment.model';
import { NotificationItem } from '../models/notification.model';
import { Transaction } from '../models/transaction.model';
import { UserProfile } from '../models/user.model';
import { AuthResponse, UserSummary } from '../models/auth.model';

// In-memory state preserved across navigations for the frontend session
let mockAccounts = [...MOCK_ACCOUNTS];
let mockTransactions = [...MOCK_TRANSACTIONS];
let mockBeneficiaries = [...MOCK_BENEFICIARIES];
let mockBillers = [...MOCK_BILLERS];
let mockPendingBills = [...MOCK_PENDING_BILLS];
let mockBillHistory = [...MOCK_BILL_HISTORY];
let mockLoans = [...MOCK_MY_LOANS];
let mockLoanApplications = [...MOCK_LOAN_APPLICATIONS];
let mockInvestments = [...MOCK_INVESTMENTS];
let mockPortfolio = { ...MOCK_PORTFOLIO_SUMMARY };
let mockNotifications = [...MOCK_NOTIFICATIONS];
let mockUsers = [...MOCK_USER_PROFILES];
let mockAuditLogs = [...MOCK_AUDIT_LOGS];

function ok<T>(data: T, message: string = 'Success'): Observable<HttpEvent<ApiResponse<T>>> {
  const body: ApiResponse<T> = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
  return of(new HttpResponse({ status: 200, body })).pipe(delay(80));
}

function paginate<T>(items: T[], page: number = 0, size: number = 15): PaginatedResponse<T> {
  const total = items.length;
  const start = page * size;
  const content = items.slice(start, start + size);
  return {
    content,
    page,
    size,
    totalElements: total,
    totalPages: Math.ceil(total / size) || 1,
    last: start + size >= total
  };
}

function error(status: number, message: string): Observable<never> {
  return throwError(() => new HttpErrorResponse({
    status,
    statusText: status === 401 ? 'Unauthorized' : status === 403 ? 'Forbidden' : 'Bad Request',
    error: {
      success: false,
      message,
      status,
      timestamp: new Date().toISOString()
    }
  }));
}

export const mockInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  // If demoMode is false, pass the request to the real backend
  if (!environment.demoMode) {
    return next(req);
  }

  const { method, url } = req;
  const parsedUrl = new URL(url, 'http://localhost:8080');
  const pathname = parsedUrl.pathname;
  const params = parsedUrl.searchParams;

  // 1. AUTHENTICATION & REGISTRATION
  if (pathname === '/api/auth/login' && method === 'POST') {
    const { email, password } = req.body as { email?: string; password?: string };
    const cleanEmail = (email || '').trim().toLowerCase();

    // Match existing mock users or match role by prefix/name
    let matchedUser = MOCK_USERS.find(
      u => u.email.toLowerCase() === cleanEmail ||
           (cleanEmail.includes('customer') && u.role === 'CUSTOMER') ||
           (cleanEmail.includes('officer') && u.role === 'BANK_OFFICER') ||
           (cleanEmail.includes('admin') && u.role === 'ADMIN')
    );

    if (!matchedUser) {
      // Default to customer role for any other email
      matchedUser = {
        email: cleanEmail,
        password: password || 'Password@123',
        role: 'CUSTOMER',
        fullName: cleanEmail.split('@')[0].replace(/[^a-zA-Z]/g, ' ') || 'Customer User',
        mobile: '+91 98765 43210'
      };
    }

    const authResp: AuthResponse = createMockAuthResponse(matchedUser);
    return ok<AuthResponse>(authResp, 'Authentication successful');
  }

  if (pathname === '/api/auth/register' && method === 'POST') {
    const body = req.body as { fullName: string; email: string; mobile: string; password?: string };
    const newSummary: UserSummary = {
      id: mockUsers.length + 1,
      fullName: body.fullName,
      email: body.email,
      mobile: body.mobile,
      role: 'CUSTOMER',
      kycStatus: 'VERIFIED',
      accountStatus: 'ACTIVE'
    };
    mockUsers.push({
      id: newSummary.id,
      fullName: body.fullName,
      email: body.email,
      mobile: body.mobile,
      role: 'CUSTOMER',
      kycStatus: 'VERIFIED',
      accountStatus: 'ACTIVE',
      createdAt: new Date().toISOString()
    });
    // Provision opening savings account
    mockAccounts.push({
      id: mockAccounts.length + 1,
      userId: newSummary.id,
      accountHolderName: body.fullName,
      userName: body.fullName,
      accountNumber: '1000' + Math.floor(10000000 + Math.random() * 90000000).toString(),
      accountType: 'SAVINGS',
      balance: 10000.0,
      currency: 'INR',
      status: 'ACTIVE',
      branchName: 'Digital Branch',
      ifscCode: 'BANE0001001',
      createdAt: new Date().toISOString()
    });
    return ok<UserSummary>(newSummary, 'Account registered successfully');
  }

  // 2. USER PROFILE & SETTINGS
  if (pathname === '/api/users/me') {
    if (method === 'GET') {
      const storedUser = localStorage.getItem('bankease_auth_user');
      const current = storedUser ? JSON.parse(storedUser) : mockUsers[0];
      const profile = mockUsers.find(u => u.id === current.id) || mockUsers[0];
      return ok<UserProfile>(profile);
    }
    if (method === 'PUT') {
      const body = req.body as { fullName?: string; mobile?: string };
      const storedUser = localStorage.getItem('bankease_auth_user');
      const current = storedUser ? JSON.parse(storedUser) : mockUsers[0];
      const idx = mockUsers.findIndex(u => u.id === current.id);
      if (idx >= 0) {
        if (body.fullName) mockUsers[idx].fullName = body.fullName;
        if (body.mobile) mockUsers[idx].mobile = body.mobile;
        return ok<UserProfile>(mockUsers[idx], 'Profile updated');
      }
      return ok<UserProfile>(mockUsers[0]);
    }
  }

  if (pathname === '/api/users/me/password' && method === 'PUT') {
    return ok<void>(undefined, 'Password updated successfully');
  }

  // 3. ACCOUNTS
  if (pathname === '/api/accounts' && method === 'GET') {
    return ok<Account[]>(mockAccounts);
  }

  const accountMatch = pathname.match(/^\/api\/accounts\/(\d+)$/);
  if (accountMatch && method === 'GET') {
    const accId = Number(accountMatch[1]);
    const acc = mockAccounts.find(a => a.id === accId) || mockAccounts[0];
    return ok<Account>(acc);
  }

  const balanceMatch = pathname.match(/^\/api\/accounts\/(\d+)\/balance$/);
  if (balanceMatch && method === 'GET') {
    const accId = Number(balanceMatch[1]);
    const acc = mockAccounts.find(a => a.id === accId) || mockAccounts[0];
    return ok({ currentBalance: acc.balance, availableBalance: acc.balance, currency: 'INR' });
  }

  const accountTxMatch = pathname.match(/^\/api\/accounts\/(\d+)\/transactions$/);
  if (accountTxMatch && method === 'GET') {
    const page = Number(params.get('page') || '0');
    const size = Number(params.get('size') || '10');
    return ok(paginate(mockTransactions, page, size));
  }

  // 4. TRANSFERS
  if (pathname === '/api/transfers') {
    if (method === 'GET') {
      const transferList = mockTransactions
        .filter(t => t.transactionType === 'FUND_TRANSFER')
        .map(t => ({
          referenceNumber: t.referenceNumber,
          sourceAccountId: t.senderAccountId || 1,
          sourceAccountNumber: t.senderAccountNumber || '100010002486',
          beneficiaryName: 'Beneficiary Payee',
          beneficiaryAccountNumber: t.receiverAccountNumber || '50100234564532',
          amount: t.amount,
          status: t.status,
          description: t.description,
          timestamp: t.createdAt
        }));
      return ok(transferList);
    }

    if (method === 'POST') {
      const body = req.body as { sourceAccountId: number; beneficiaryId: number; amount: number; description?: string };
      const sourceAcc = mockAccounts.find(a => a.id === body.sourceAccountId) || mockAccounts[0];
      const ben = mockBeneficiaries.find(b => b.id === body.beneficiaryId) || mockBeneficiaries[0];

      if (sourceAcc.balance < body.amount) {
        return error(400, `Insufficient account balance. Available: ₹${sourceAcc.balance}`);
      }

      // Deduct balance
      sourceAcc.balance -= body.amount;

      const refNumber = 'TXN' + Date.now();
      const newTx: Transaction = {
        id: mockTransactions.length + 1,
        referenceNumber: refNumber,
        senderAccountId: sourceAcc.id,
        senderAccountNumber: sourceAcc.accountNumber,
        receiverAccountNumber: ben.accountNumber,
        transactionType: 'FUND_TRANSFER',
        type: 'DEBIT',
        amount: body.amount,
        status: 'SUCCESS',
        description: body.description || `Transfer to ${ben.name} (${ben.bankName})`,
        createdAt: new Date().toISOString()
      };
      mockTransactions.unshift(newTx);

      const receipt = {
        referenceNumber: refNumber,
        sourceAccountId: sourceAcc.id,
        sourceAccountNumber: sourceAcc.accountNumber,
        beneficiaryName: ben.name,
        beneficiaryAccountNumber: ben.accountNumber,
        amount: body.amount,
        status: 'SUCCESS',
        description: newTx.description,
        timestamp: newTx.createdAt
      };

      // Add notification
      mockNotifications.unshift({
        id: mockNotifications.length + 1,
        title: 'Fund Transfer Successful',
        message: `₹${body.amount.toLocaleString('en-IN')} transferred to ${ben.name}. Ref: ${refNumber}`,
        type: 'TRANSACTION',
        read: false,
        createdAt: new Date().toISOString()
      });

      return ok(receipt, 'Transfer executed successfully');
    }
  }

  // 5. BENEFICIARIES
  if (pathname === '/api/beneficiaries') {
    if (method === 'GET') {
      return ok<Beneficiary[]>(mockBeneficiaries);
    }
    if (method === 'POST') {
      const body = req.body as Partial<Beneficiary>;
      const newBen: Beneficiary = {
        id: mockBeneficiaries.length + 1,
        userId: 1,
        name: body.name || 'New Beneficiary',
        accountNumber: body.accountNumber || '',
        bankName: body.bankName || 'Partner Bank',
        ifscCode: (body.ifscCode || 'BANE0001001').toUpperCase(),
        status: 'ACTIVE',
        createdAt: new Date().toISOString()
      };
      mockBeneficiaries.unshift(newBen);
      return ok<Beneficiary>(newBen, 'Beneficiary registered');
    }
  }

  const benMatch = pathname.match(/^\/api\/beneficiaries\/(\d+)$/);
  if (benMatch) {
    const benId = Number(benMatch[1]);
    if (method === 'GET') {
      const ben = mockBeneficiaries.find(b => b.id === benId) || mockBeneficiaries[0];
      return ok<Beneficiary>(ben);
    }
    if (method === 'PUT') {
      const body = req.body as Partial<Beneficiary>;
      const idx = mockBeneficiaries.findIndex(b => b.id === benId);
      if (idx >= 0) {
        mockBeneficiaries[idx] = { ...mockBeneficiaries[idx], ...body };
        return ok<Beneficiary>(mockBeneficiaries[idx], 'Beneficiary updated');
      }
      return ok<Beneficiary>(mockBeneficiaries[0]);
    }
    if (method === 'DELETE') {
      mockBeneficiaries = mockBeneficiaries.filter(b => b.id !== benId);
      return ok<void>(undefined, 'Beneficiary removed');
    }
  }

  // 6. BILLS & BILLERS
  if (pathname === '/api/billers') {
    if (method === 'GET') {
      return ok(mockBillers);
    }
  }

  if (pathname === '/api/bills/fetch' && method === 'POST') {
    const { billerId, consumerNumber } = req.body as { billerId: number; consumerNumber: string };
    const biller = mockBillers.find(b => b.id === Number(billerId)) || mockBillers[0];
    const found = mockPendingBills.find(b => b.billerId === Number(billerId) || b.consumerNumber === consumerNumber);
    if (found) {
      return ok(found);
    }
    // Generate simulated bill for arbitrary consumer ID
    const genBill = {
      id: Math.floor(1000 + Math.random() * 9000),
      billerId: biller.id,
      billerName: biller.name,
      billerCategory: biller.category,
      consumerNumber,
      consumerName: 'Customer',
      amount: 1450.00,
      billDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      status: 'UNPAID'
    };
    return ok(genBill);
  }

  if (pathname === '/api/bills/pay' && method === 'POST') {
    const { sourceAccountId, billId, amount } = req.body as { sourceAccountId: number; billId: number; amount: number };
    const sourceAcc = mockAccounts.find(a => a.id === sourceAccountId) || mockAccounts[0];
    sourceAcc.balance -= (amount || 0);

    const bill = mockPendingBills.find(b => b.id === billId) || {
      billerName: 'Utility Provider',
      consumerNumber: '00000'
    };

    const receipt: BillPaymentResponse = {
      receiptNumber: 'RCPT-' + Date.now(),
      billId,
      billerName: (bill as any).billerName || 'Utility Provider',
      consumerNumber: (bill as any).consumerNumber || '00000',
      amount: amount || 1000,
      paymentDate: new Date().toISOString(),
      sourceAccountNumber: sourceAcc.accountNumber,
      status: 'SUCCESS'
    };
    mockBillHistory.unshift(receipt);

    // Remove from pending bills if present
    mockPendingBills = mockPendingBills.filter(b => b.id !== billId);

    // Create ledger transaction
    mockTransactions.unshift({
      id: mockTransactions.length + 1,
      referenceNumber: receipt.receiptNumber,
      senderAccountId: sourceAcc.id,
      senderAccountNumber: sourceAcc.accountNumber,
      receiverAccountNumber: (bill as any).billerName || 'BBPS-UTILITY',
      transactionType: 'BILL_PAYMENT',
      type: 'DEBIT',
      amount: receipt.amount,
      status: 'SUCCESS',
      description: `Bill settlement to ${receipt.billerName}`,
      createdAt: new Date().toISOString()
    });

    return ok(receipt, 'Bill paid successfully');
  }

  if (pathname === '/api/bills/history' && method === 'GET') {
    return ok(mockBillHistory);
  }

  // 7. LOANS & EMIs
  if (pathname === '/api/loans/products' && method === 'GET') {
    return ok(MOCK_LOAN_PRODUCTS);
  }

  if (pathname === '/api/loans/my-loans' && method === 'GET') {
    return ok(mockLoans);
  }

  if (pathname === '/api/loans/apply' && method === 'POST') {
    const body = req.body as any;
    const prod = MOCK_LOAN_PRODUCTS.find(p => p.id === body.loanProductId) || MOCK_LOAN_PRODUCTS[0];
    const newApp: LoanApplication = {
      id: mockLoanApplications.length + 1001,
      userId: 1,
      customerName: 'Customer',
      loanProductId: prod.id,
      loanProductName: prod.name,
      loanType: prod.loanType,
      requestedAmount: body.requestedAmount || body.amount || 250000,
      tenureMonths: body.tenureMonths || 24,
      annualIncome: body.annualIncome || 1200000,
      purpose: body.purpose || 'Retail Financing',
      status: 'PENDING',
      estimatedEmi: Math.round(((body.requestedAmount || 250000) * 1.1) / (body.tenureMonths || 24)),
      disbursementAccountId: body.disbursementAccountId || mockAccounts[0].id,
      createdAt: new Date().toISOString()
    };
    mockLoanApplications.unshift(newApp);
    return ok(newApp, 'Loan application submitted for review');
  }

  if (pathname === '/api/loans/applications' && method === 'GET') {
    const page = Number(params.get('page') || '0');
    const size = Number(params.get('size') || '20');
    // If query has page/size, return PaginatedResponse (used by officer/admin table)
    if (params.has('page') || params.has('size')) {
      return ok(paginate(mockLoanApplications, page, size));
    }
    // Customer sees own applications
    return ok(mockLoanApplications);
  }

  const approveMatch = pathname.match(/^\/api\/loans\/applications\/(\d+)\/approve$/);
  if (approveMatch && method === 'PUT') {
    const appId = Number(approveMatch[1]);
    const app = mockLoanApplications.find(a => a.id === appId);
    if (app) app.status = 'APPROVED';

    const newLoan: Loan = {
      id: mockLoans.length + 201,
      loanAccountNumber: 'LN' + Date.now().toString().slice(-8),
      loanProductId: app ? app.loanProductId : 1,
      loanProductName: app ? app.loanProductName : 'Personal Loan',
      loanType: app ? app.loanType : 'PERSONAL',
      principalAmount: app ? app.requestedAmount : 250000,
      interestRate: 9.5,
      tenureMonths: app ? app.tenureMonths : 24,
      emiAmount: app ? app.estimatedEmi : 11500,
      totalPayable: (app ? app.estimatedEmi : 11500) * (app ? app.tenureMonths : 24),
      remainingBalance: (app ? app.estimatedEmi : 11500) * (app ? app.tenureMonths : 24),
      status: 'ACTIVE',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 24 * 30 * 86400000).toISOString().split('T')[0],
      disbursedAccountNumber: mockAccounts[0].accountNumber
    };
    mockLoans.unshift(newLoan);
    mockAccounts[0].balance += newLoan.principalAmount;

    return ok(newLoan, 'Loan approved and disbursed');
  }

  const rejectMatch = pathname.match(/^\/api\/loans\/applications\/(\d+)\/reject$/);
  if (rejectMatch && method === 'PUT') {
    const appId = Number(rejectMatch[1]);
    const body = req.body as { rejectionReason?: string };
    const app = mockLoanApplications.find(a => a.id === appId);
    if (app) {
      app.status = 'REJECTED';
      app.rejectionReason = body.rejectionReason || 'Criteria not met';
    }
    return ok(app, 'Loan application rejected');
  }

  const loanMatch = pathname.match(/^\/api\/loans\/(\d+)$/);
  if (loanMatch && method === 'GET') {
    const loanId = Number(loanMatch[1]);
    const l = mockLoans.find(x => x.id === loanId) || mockLoans[0];
    return ok(l);
  }

  const loanPayMatch = pathname.match(/^\/api\/loans\/(\d+)\/pay$/);
  if (loanPayMatch && method === 'POST') {
    const loanId = Number(loanPayMatch[1]);
    const { sourceAccountId, amount } = req.body as { sourceAccountId: number; amount: number };
    const acc = mockAccounts.find(a => a.id === sourceAccountId) || mockAccounts[0];
    acc.balance -= (amount || 0);

    const l = mockLoans.find(x => x.id === loanId);
    if (l) {
      l.remainingBalance = Math.max(0, l.remainingBalance - amount);
    }
    return ok({ loanId, amount, paymentDate: new Date().toISOString(), status: 'SUCCESS' }, 'EMI Payment processed');
  }

  const loanSchedMatch = pathname.match(/^\/api\/loans\/(\d+)\/schedule$/);
  if (loanSchedMatch && method === 'GET') {
    return ok(MOCK_REPAYMENT_SCHEDULE);
  }

  // 8. INVESTMENTS
  if (pathname === '/api/investments/products' && method === 'GET') {
    return ok(MOCK_INVESTMENT_PRODUCTS);
  }

  if (pathname === '/api/investments/portfolio' && method === 'GET') {
    return ok(mockPortfolio);
  }

  if (pathname === '/api/investments') {
    if (method === 'GET') {
      return ok<Investment[]>(mockInvestments);
    }
    if (method === 'POST') {
      const body = req.body as any;
      const prod = MOCK_INVESTMENT_PRODUCTS.find(p => p.id === body.investmentProductId) || MOCK_INVESTMENT_PRODUCTS[0];
      const sourceAcc = mockAccounts.find(a => a.id === body.sourceAccountId) || mockAccounts[0];
      sourceAcc.balance -= body.amount;

      const newInv: Investment = {
        id: mockInvestments.length + 10,
        investmentNumber: (prod.investmentType === 'FIXED_DEPOSIT' ? 'FD' : prod.investmentType === 'RECURRING_DEPOSIT' ? 'RD' : 'MF') + Date.now().toString().slice(-8),
        investmentProductId: prod.id,
        investmentProductName: prod.name,
        investmentType: prod.investmentType,
        investedAmount: body.amount,
        interestRate: prod.interestRate,
        tenureMonths: body.tenureMonths,
        expectedMaturityAmount: Math.round(body.amount * (1 + (prod.interestRate * body.tenureMonths) / 1200)),
        currentValue: body.amount,
        status: 'ACTIVE',
        startDate: new Date().toISOString().split('T')[0],
        maturityDate: new Date(Date.now() + body.tenureMonths * 30 * 86400000).toISOString().split('T')[0],
        sourceAccountNumber: sourceAcc.accountNumber,
        createdAt: new Date().toISOString()
      };
      mockInvestments.unshift(newInv);
      mockPortfolio.totalInvested += body.amount;
      mockPortfolio.currentValue += body.amount;
      mockPortfolio.totalInvestments += 1;

      return ok(newInv, 'Investment opened successfully');
    }
  }

  const withdrawMatch = pathname.match(/^\/api\/investments\/(\d+)\/withdraw$/);
  if (withdrawMatch && method === 'POST') {
    const invId = Number(withdrawMatch[1]);
    const { destinationAccountId } = req.body as { destinationAccountId: number };
    const inv = mockInvestments.find(i => i.id === invId);
    if (inv) {
      inv.status = 'CLOSED';
      const destAcc = mockAccounts.find(a => a.id === destinationAccountId) || mockAccounts[0];
      destAcc.balance += inv.currentValue;
    }
    return ok(inv, 'Withdrawal processed');
  }

  // 9. TRANSACTIONS
  if (pathname === '/api/transactions' && method === 'GET') {
    const page = Number(params.get('page') || '0');
    const size = Number(params.get('size') || '15');
    const accountId = params.get('accountId');
    const type = params.get('type');
    const status = params.get('status');

    let filtered = [...mockTransactions];
    if (accountId) filtered = filtered.filter(t => t.senderAccountId === Number(accountId) || t.receiverAccountId === Number(accountId));
    if (type) filtered = filtered.filter(t => t.type === type || t.transactionType === type);
    if (status) filtered = filtered.filter(t => t.status === status);

    return ok(paginate(filtered, page, size));
  }

  // 10. NOTIFICATIONS
  if (pathname === '/api/notifications' && method === 'GET') {
    return ok<NotificationItem[]>(mockNotifications);
  }

  const notifReadMatch = pathname.match(/^\/api\/notifications\/(\d+)\/read$/);
  if (notifReadMatch && method === 'PUT') {
    const id = Number(notifReadMatch[1]);
    const n = mockNotifications.find(x => x.id === id);
    if (n) n.read = true;
    return ok<void>(undefined);
  }

  if (pathname === '/api/notifications/read-all' && method === 'PUT') {
    mockNotifications.forEach(n => n.read = true);
    return ok<void>(undefined);
  }

  // 11. ADMIN CONSOLE
  if (pathname === '/api/admin/users' && method === 'GET') {
    return ok<UserProfile[]>(mockUsers);
  }

  const adminUserStatusMatch = pathname.match(/^\/api\/admin\/users\/(\d+)\/status$/);
  if (adminUserStatusMatch && method === 'PUT') {
    const userId = Number(adminUserStatusMatch[1]);
    const { accountStatus } = req.body as any;
    const u = mockUsers.find(x => x.id === userId);
    if (u && accountStatus) u.accountStatus = accountStatus;
    return ok(u, 'User status updated');
  }

  const adminUserRoleMatch = pathname.match(/^\/api\/admin\/users\/(\d+)\/role$/);
  if (adminUserRoleMatch && method === 'PUT') {
    const userId = Number(adminUserRoleMatch[1]);
    const { role } = req.body as any;
    const u = mockUsers.find(x => x.id === userId);
    if (u && role) u.role = role;
    return ok(u, 'User role updated');
  }

  if (pathname === '/api/admin/accounts' && method === 'GET') {
    return ok<Account[]>(mockAccounts);
  }

  const adminAccStatusMatch = pathname.match(/^\/api\/admin\/accounts\/(\d+)\/status$/);
  if (adminAccStatusMatch && method === 'PUT') {
    const accId = Number(adminAccStatusMatch[1]);
    const { status } = req.body as any;
    const a = mockAccounts.find(x => x.id === accId);
    if (a && status) a.status = status;
    return ok(a, 'Account status updated');
  }

  if (pathname === '/api/admin/billers' && method === 'POST') {
    const body = req.body as any;
    const newBiller = {
      id: mockBillers.length + 1,
      name: body.name,
      category: body.category,
      billerCode: body.billerCode,
      description: body.description || 'Registered Utility Provider',
      active: true
    };
    mockBillers.push(newBiller);
    return ok(newBiller, 'Biller registered');
  }

  if (pathname === '/api/admin/audit-logs' && method === 'GET') {
    const page = Number(params.get('page') || '0');
    const size = Number(params.get('size') || '20');
    return ok(paginate(mockAuditLogs, page, size));
  }

  if (pathname === '/api/admin/transactions' && method === 'GET') {
    const page = Number(params.get('page') || '0');
    const size = Number(params.get('size') || '20');
    return ok(paginate(mockTransactions, page, size));
  }

  // Fallback for any unhandled /api call
  return ok({}, 'Mock fallback success');
};
