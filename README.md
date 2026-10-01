# BankEase: NextGen Net Banking Backend

A production-grade, secure, and transactional net-banking REST API built from scratch with **Java 21/23**, **Spring Boot 3.3.4**, **Spring Security 6**, **JWT Authentication**, **Spring Data JPA**, and **PostgreSQL**.

---

## 1. Project Overview

BankEase provides a robust digital banking backend tailored for modern banking operations:
- **Authentication & Security**: BCrypt password hashing, JWT stateless authentication, role-based authorization (`CUSTOMER`, `BANK_OFFICER`, `ADMIN`), CORS configuration, and security event auditing.
- **Account Management**: Savings and Current account management with live balance queries and account statements.
- **Beneficiaries**: Beneficiary registration, validation of account numbers, and IFSC verification.
- **Fund Transfers**: Atomic fund transfers protected by database pessimistic locking (`SELECT ... FOR UPDATE`) to prevent race conditions and double spending.
- **Transaction History**: Searchable and paginated transaction history filtered by account, type, status, and date ranges.
- **Bill Payments**: Biller discovery, dynamic bill fetching, and transactional bill settlements with unique receipt generation.
- **Loans & EMIs**: Loan products, customer loan applications, officer review and approval workflow, automatic fund disbursement, mathematical EMI calculation, repayment schedules, and loan repayment.
- **Investments & Portfolio**: Fixed Deposits (FD), Recurring Deposits (RD), and Mutual Funds (MF), compound interest return projections, and portfolio asset breakdown.
- **In-App Notifications**: Real-time event notifications for transactions, security events, bill payments, and loan status changes.
- **Audit Logging**: Immutable, tamper-evident audit trails recording user logins, financial transfers, administrative overrides, and loan decisions.
- **API Documentation**: Interactive Swagger UI and OpenAPI 3 specifications.

---

## 2. Architecture & Layered Flow

```text
HTTP Request
     ↓
JwtAuthenticationFilter (Validates Bearer token, sets SecurityContext)
     ↓
Spring Security (Role & Endpoint Authorization)
     ↓
REST Controller (Validates Request Body via Bean Validation)
     ↓
Service Layer (Business Logic, Concurrency Locks, @Transactional Boundary)
     ↓
JPA Repositories (Spring Data JPA / Hibernate)
     ↓
PostgreSQL Database (ACID Transactions, Foreign Keys, Indexes)
```

### Module Structure

```text
src/main/java/com/bankease/
├── BankEaseApplication.java       # Spring Boot Application Entry Point
├── config/
│   ├── DataInitializer.java      # Development Seed Data Runner
│   ├── OpenApiConfig.java        # Swagger / OpenAPI 3 Configuration
│   └── SecurityConfig.java       # Spring Security 6 & CORS Configuration
├── controller/
│   ├── AccountController.java    # /api/accounts
│   ├── AdminController.java      # /api/admin
│   ├── AuthController.java       # /api/auth
│   ├── BeneficiaryController.java# /api/beneficiaries
│   ├── BillController.java       # /api/billers, /api/bills
│   ├── InvestmentController.java # /api/investments
│   ├── LoanController.java       # /api/loans
│   ├── NotificationController.java# /api/notifications
│   ├── TransactionController.java# /api/transactions
│   ├── TransferController.java   # /api/transfers
│   └── UserController.java       # /api/users
├── dto/                          # Clean Request & Response DTOs
├── entity/                       # JPA Entities and Enums
├── exception/                    # GlobalExceptionHandler and Custom Exceptions
├── mapper/                       # DtoMapper (Entity ↔ DTO conversions)
├── repository/                   # Spring Data JPA Repositories
├── security/                     # JwtTokenProvider, UserPrincipal, CustomUserDetailsService
├── service/                      # Transactional Business Services
└── util/                         # FinancialUtils (EMI formula, compounding, generators)
```

---

## 3. Technology Stack

- **Java**: 21 / 23
- **Framework**: Spring Boot 3.3.4
- **Security**: Spring Security 6 + JJWT 0.12.6
- **Database**: PostgreSQL 16+ / 18
- **ORM**: Spring Data JPA / Hibernate 6.5
- **API Documentation**: SpringDoc OpenAPI 2.6.0 (Swagger UI)
- **Validation**: Jakarta Bean Validation (Hibernate Validator)
- **Build Tool**: Apache Maven 3.9+
- **Testing**: JUnit 5, Mockito, Spring Boot Test, MockMvc

---

## 4. Prerequisites

1. **Java JDK 21** or **23** installed and on `PATH`.
2. **Apache Maven 3.8+** installed.
3. **PostgreSQL** running locally on port `5432`.

---

## 5. PostgreSQL Database Setup

Connect to PostgreSQL CLI and create the `bankease` database:

```sql
CREATE DATABASE bankease;
```

---

## 6. Configuration & Environment Variables

Copy `.env.example` or set the following environment variables:

| Variable | Description | Default Value |
|---|---|---|
| `DB_URL` | PostgreSQL JDBC connection URL | `jdbc:postgresql://localhost:5432/bankease` |
| `DB_USERNAME` | Database username | `postgres` |
| `DB_PASSWORD` | Database password | `postgres` |
| `JWT_SECRET` | 256-bit Secret Key for signing JWTs | `404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970` |
| `JWT_EXPIRATION_MS` | Token lifespan in milliseconds | `86400000` (24 Hours) |
| `SERVER_PORT` | Backend HTTP listening port | `8080` |

---

## 7. How to Run

### Run Locally with Maven
```bash
mvn clean spring-boot:run
```

The application will start on `http://localhost:8080`.

### Run Test Suite
```bash
mvn test
```

---

## 8. Default Pre-seeded Test Users

On initial startup, `DataInitializer` automatically seeds development data:

| Role | Email | Password | Pre-seeded Features |
|---|---|---|---|
| **CUSTOMER** | `customer@bankease.com` | `Customer@123` | Savings (₹75k), Current (₹250k), Beneficiary "Sarah Jenkins", Unpaid bills |
| **CUSTOMER** | `sarah@bankease.com` | `Customer@123` | Savings Account (₹50k) for cross-transfer testing |
| **BANK_OFFICER** | `officer@bankease.com` | `Officer@123` | Can approve/reject customer loan applications |
| **ADMIN** | `admin@bankease.com` | `Admin@123` | Can manage users, account status, billers, and view system audit logs |

---

## 9. Interactive API Documentation (Swagger UI)

Once the backend is running, open:
- **Swagger UI**: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- **OpenAPI JSON Spec**: [http://localhost:8080/api-docs](http://localhost:8080/api-docs)

To test authenticated endpoints in Swagger:
1. Call `POST /api/auth/login` with `customer@bankease.com` / `Customer@123`.
2. Copy the `accessToken` from the response.
3. Click the **Authorize** button at the top of Swagger UI.
4. Enter the token into the **BearerAuth** dialog and click **Authorize**.

---

## 10. Core API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Register customer with opening savings account
- `POST /api/auth/login` - Authenticate and receive JWT Bearer token

### User Profile (`/api/users`)
- `GET /api/users/me` - Get profile of authenticated user
- `PUT /api/users/me` - Update profile name / contact
- `PUT /api/users/me/password` - Update account password

### Bank Accounts (`/api/accounts`)
- `GET /api/accounts` - List accounts owned by current user
- `GET /api/accounts/{id}` - Account details (with ownership enforcement)
- `GET /api/accounts/{id}/balance` - Live balance check
- `GET /api/accounts/{id}/transactions` - Paginated account statement

### Beneficiaries (`/api/beneficiaries`)
- `GET /api/beneficiaries` - List saved beneficiaries
- `POST /api/beneficiaries` - Add new beneficiary (validates IFSC & account)
- `GET /api/beneficiaries/{id}` - Get beneficiary details
- `PUT /api/beneficiaries/{id}` - Update beneficiary
- `DELETE /api/beneficiaries/{id}` - Remove beneficiary

### Fund Transfers (`/api/transfers`)
- `POST /api/transfers` - Atomic fund transfer with pessimistic locking
- `GET /api/transfers` - User's transfer history
- `GET /api/transfers/{id}` - Transfer receipt

### Transactions & Statements (`/api/transactions`)
- `GET /api/transactions` - Filtered & paginated transactions by type, status, and dates
- `GET /api/transactions/{id}` - Detailed transaction audit record

### Bill Payments (`/api/bills` & `/api/billers`)
- `GET /api/billers` - List electricity, water, mobile, and internet billers
- `POST /api/bills/fetch` - Fetch bill by consumer number
- `POST /api/bills/pay` - Pay bill atomically with receipt generation
- `GET /api/bills/history` - User's bill payment history

### Loans & EMIs (`/api/loans`)
- `GET /api/loans/products` - List loan products (Personal, Home, Education, Vehicle)
- `POST /api/loans/apply` - Apply for a loan with income & tenure
- `GET /api/loans/applications` - View applications (Customer sees own, Officer sees all)
- `PUT /api/loans/applications/{id}/approve` - Approve application & disburse funds (`BANK_OFFICER` / `ADMIN`)
- `PUT /api/loans/applications/{id}/reject` - Reject application with reason (`BANK_OFFICER` / `ADMIN`)
- `GET /api/loans/my-loans` - Customer's active and completed loans
- `GET /api/loans/{id}` - Detailed loan progress and remaining balance
- `POST /api/loans/{id}/pay` - Make EMI or partial repayment
- `GET /api/loans/{id}/schedule` - Full monthly amortization table

### Investments (`/api/investments`)
- `GET /api/investments/products` - List Fixed Deposits, Recurring Deposits, and Mutual Funds
- `POST /api/investments` - Subscribe to an investment product
- `GET /api/investments` - User's active investments
- `GET /api/investments/portfolio` - Portfolio valuation, returns, and category breakdown
- `POST /api/investments/{id}/withdraw` - Withdraw investment payout to bank account

### Notifications (`/api/notifications`)
- `GET /api/notifications` - In-app notifications
- `PUT /api/notifications/{id}/read` - Mark notification read
- `PUT /api/notifications/read-all` - Mark all notifications read

### Administrator Operations (`/api/admin`)
- `GET /api/admin/users` - View all registered users
- `PUT /api/admin/users/{id}/status` - Change user account or KYC status
- `PUT /api/admin/users/{id}/role` - Change user role
- `GET /api/admin/accounts` - View all bank accounts
- `PUT /api/admin/accounts/{id}/status` - Block or close accounts
- `POST /api/admin/billers` - Register new billers
- `GET /api/admin/audit-logs` - View system-wide security audit trails
- `GET /api/admin/transactions` - View all transactions

---

## 11. Concurrency and Financial Safety

Financial operations (transfers, bill payments, loan disbursements, and investment creations) are protected against race conditions using:
1. **Pessimistic Write Locking (`LockModeType.PESSIMISTIC_WRITE`)**: Ensures that concurrent debit requests on the same account are serialized at the database level (`SELECT ... FOR UPDATE`).
2. **Spring `@Transactional(isolation = Isolation.REPEATABLE_READ)`**: Guarantees atomic commit or rollback.
3. **Strict Balance Invariant Checks**: Negative balances are prevented at both the application and database check levels.
4. **All Monetary Amounts Use `BigDecimal`**: Avoids IEEE 754 floating-point rounding errors.

---

## 12. Testing

Run all unit and integration tests:

```bash
mvn test
```

### Test Coverage Summary:
- **Authentication**: Registration success, duplicate email validation, duplicate mobile validation, login success, invalid credentials handling.
- **Account Security**: Customer accessing own account, customer blocked from accessing other customer's account (403 Forbidden), admin privilege elevation.
- **Fund Transfers**: Successful internal transfer, atomic debit and credit, insufficient balance exception, negative amount rejection, non-owned beneficiary rejection, rollback behavior.
- **Loans**: Loan application, loan approval and immediate fund disbursement, loan rejection reason capture, mathematical verification of standard banking EMI formula.
- **Bills**: Dynamic bill fetching, transactional payment, insufficient balance rejection.
- **Integration**: Full MockMvc HTTP registration, JWT login, and 401 Unauthorized verification on protected routes.
