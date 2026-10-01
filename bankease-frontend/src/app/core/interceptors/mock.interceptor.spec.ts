import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { mockInterceptor } from './mock.interceptor';
import { environment } from '../../../environments/environment';

describe('mockInterceptor standalone banking tests', () => {
  let http: HttpClient;

  beforeEach(() => {
    environment.demoMode = true;

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([mockInterceptor]))
      ]
    });

    http = TestBed.inject(HttpClient);
  });

  it('should authenticate customer successfully', async () => {
    const res: any = await http.post('http://localhost:8080/api/auth/login', {
      email: 'customer@bankease.com',
      password: 'Customer@123'
    }).toPromise();

    expect(res.success).toBe(true);
    expect(res.data.accessToken).toBeTruthy();
    expect(res.data.user.role).toBe('CUSTOMER');
  });

  it('should authenticate officer and admin', async () => {
    const officerRes: any = await http.post('http://localhost:8080/api/auth/login', {
      email: 'officer@bankease.com',
      password: 'Officer@123'
    }).toPromise();
    expect(officerRes.data.user.role).toBe('BANK_OFFICER');

    const adminRes: any = await http.post('http://localhost:8080/api/auth/login', {
      email: 'admin@bankease.com',
      password: 'Admin@123'
    }).toPromise();
    expect(adminRes.data.user.role).toBe('ADMIN');
  });

  it('should fetch accounts and balance', async () => {
    const accsRes: any = await http.get('http://localhost:8080/api/accounts').toPromise();
    expect(accsRes.success).toBe(true);
    expect(accsRes.data.length).toBeGreaterThan(0);

    const balRes: any = await http.get('http://localhost:8080/api/accounts/1/balance').toPromise();
    expect(balRes.success).toBe(true);
    expect(balRes.data.currentBalance).toBeGreaterThan(0);
  });

  it('should execute fund transfers and record transaction', async () => {
    const accs: any = await http.get('http://localhost:8080/api/accounts').toPromise();
    const initialBal = accs.data[0].balance;

    const transferRes: any = await http.post('http://localhost:8080/api/transfers', {
      sourceAccountId: accs.data[0].id,
      beneficiaryId: 1,
      amount: 500,
      description: 'Test Unit Transfer'
    }).toPromise();

    expect(transferRes.success).toBe(true);
    expect(transferRes.data.referenceNumber).toBeTruthy();

    const updatedAcc: any = await http.get(`http://localhost:8080/api/accounts/${accs.data[0].id}`).toPromise();
    expect(updatedAcc.data.balance).toBe(initialBal - 500);
  });

  it('should fetch billers and dynamic bills', async () => {
    const billersRes: any = await http.get('http://localhost:8080/api/billers').toPromise();
    expect(billersRes.success).toBe(true);
    expect(billersRes.data.length).toBeGreaterThan(0);

    const billRes: any = await http.post('http://localhost:8080/api/bills/fetch', {
      billerId: 1,
      consumerNumber: '10293847'
    }).toPromise();
    expect(billRes.success).toBe(true);
    expect(billRes.data.amount).toBeGreaterThan(0);
  });

  it('should manage loan applications and loan products', async () => {
    const prodsRes: any = await http.get('http://localhost:8080/api/loans/products').toPromise();
    expect(prodsRes.success).toBe(true);
    expect(prodsRes.data.length).toBeGreaterThan(0);

    const applyRes: any = await http.post('http://localhost:8080/api/loans/apply', {
      loanProductId: 1,
      disbursementAccountId: 1,
      requestedAmount: 100000,
      tenureMonths: 12,
      annualIncome: 800000,
      purpose: 'Home Improvement'
    }).toPromise();
    expect(applyRes.success).toBe(true);
    expect(applyRes.data.status).toBe('PENDING');
  });

  it('should return investment portfolio and notifications', async () => {
    const portRes: any = await http.get('http://localhost:8080/api/investments/portfolio').toPromise();
    expect(portRes.success).toBe(true);
    expect(portRes.data.totalInvested).toBeGreaterThan(0);

    const notifRes: any = await http.get('http://localhost:8080/api/notifications').toPromise();
    expect(notifRes.success).toBe(true);
    expect(notifRes.data.length).toBeGreaterThan(0);
  });

  it('should return admin user list and audit logs', async () => {
    const usersRes: any = await http.get('http://localhost:8080/api/admin/users').toPromise();
    expect(usersRes.success).toBe(true);
    expect(usersRes.data.length).toBeGreaterThan(0);

    const auditRes: any = await http.get('http://localhost:8080/api/admin/audit-logs').toPromise();
    expect(auditRes.success).toBe(true);
    expect(auditRes.data.content.length).toBeGreaterThan(0);
  });
});
