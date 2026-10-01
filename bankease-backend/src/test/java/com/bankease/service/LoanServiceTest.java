package com.bankease.service;

import com.bankease.dto.loan.LoanApplicationRequestDto;
import com.bankease.dto.loan.LoanApplicationResponseDto;
import com.bankease.dto.loan.LoanApprovalRequestDto;
import com.bankease.dto.loan.LoanResponseDto;
import com.bankease.entity.*;
import com.bankease.exception.BadRequestException;
import com.bankease.repository.*;
import com.bankease.util.FinancialUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LoanServiceTest {

    @Mock
    private LoanProductRepository loanProductRepository;

    @Mock
    private LoanApplicationRepository loanApplicationRepository;

    @Mock
    private LoanRepository loanRepository;

    @Mock
    private LoanPaymentRepository loanPaymentRepository;

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private LoanService loanService;

    private User customer;
    private User officer;
    private Account customerAccount;
    private LoanProduct personalLoanProduct;
    private LoanApplication pendingApplication;

    @BeforeEach
    void setUp() {
        customer = User.builder().id(1L).fullName("Customer One").email("customer@bank.com").build();
        officer = User.builder().id(2L).fullName("Officer One").email("officer@bank.com").role(Role.BANK_OFFICER).build();

        customerAccount = Account.builder()
                .id(10L)
                .user(customer)
                .accountNumber("100100123456")
                .balance(new BigDecimal("10000.00"))
                .status(AccountStatus.ACTIVE)
                .build();

        personalLoanProduct = LoanProduct.builder()
                .id(1L)
                .name("Personal Loan")
                .loanType(LoanType.PERSONAL)
                .interestRate(new BigDecimal("12.00"))
                .minAmount(new BigDecimal("10000.00"))
                .maxAmount(new BigDecimal("1000000.00"))
                .minTenureMonths(6)
                .maxTenureMonths(60)
                .active(true)
                .build();

        pendingApplication = LoanApplication.builder()
                .id(100L)
                .user(customer)
                .loanProduct(personalLoanProduct)
                .requestedAmount(new BigDecimal("100000.00"))
                .tenureMonths(12)
                .annualIncome(new BigDecimal("600000.00"))
                .purpose("Home renovation")
                .status(ApplicationStatus.PENDING)
                .build();
    }

    @Test
    void testEmiCalculationFormula() {
        // Principal = 100,000, Annual Rate = 12%, Tenure = 12 months
        // Monthly rate = 0.01. EMI = 100000 * 0.01 * (1.01^12) / ((1.01^12) - 1) = 8884.88
        BigDecimal emi = FinancialUtils.calculateEmi(new BigDecimal("100000.00"), new BigDecimal("12.00"), 12);
        assertNotNull(emi);
        assertEquals(new BigDecimal("8884.88"), emi);
    }

    @Test
    void testLoanApplicationSuccess() {
        LoanApplicationRequestDto request = LoanApplicationRequestDto.builder()
                .loanProductId(1L)
                .requestedAmount(new BigDecimal("50000.00"))
                .tenureMonths(12)
                .annualIncome(new BigDecimal("500000.00"))
                .purpose("Medical expenses")
                .disbursementAccountId(10L)
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(loanProductRepository.findById(1L)).thenReturn(Optional.of(personalLoanProduct));
        when(accountRepository.findById(10L)).thenReturn(Optional.of(customerAccount));
        when(loanApplicationRepository.save(any(LoanApplication.class))).thenAnswer(i -> {
            LoanApplication app = i.getArgument(0);
            app.setId(101L);
            return app;
        });

        LoanApplicationResponseDto response = loanService.applyLoan(1L, request, "127.0.0.1");

        assertNotNull(response);
        assertEquals("PENDING", response.getStatus());
        assertEquals(new BigDecimal("50000.00"), response.getRequestedAmount());
        verify(auditLogService, times(1)).log(any(), any(), any(), any(), any(), any(), any());
        verify(notificationService, times(1)).createNotification(any(), any(), any(), any());
    }

    @Test
    void testLoanApprovalAndDisbursement() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(officer));
        when(loanApplicationRepository.findById(100L)).thenReturn(Optional.of(pendingApplication));
        when(accountRepository.findByUserId(1L)).thenReturn(List.of(customerAccount));
        when(loanRepository.save(any(Loan.class))).thenAnswer(i -> {
            Loan l = i.getArgument(0);
            l.setId(500L);
            return l;
        });

        LoanResponseDto response = loanService.approveLoan(100L, 2L, "127.0.0.1");

        assertNotNull(response);
        assertEquals("ACTIVE", response.getStatus());
        assertEquals(new BigDecimal("100000.00"), response.getPrincipalAmount());
        // Customer balance should have received 100,000 disbursement: 10,000 + 100,000 = 110,000
        assertEquals(new BigDecimal("110000.00"), customerAccount.getBalance());

        verify(accountRepository, times(1)).save(customerAccount);
        verify(transactionRepository, times(1)).save(any(Transaction.class));
        verify(loanRepository, times(1)).save(any(Loan.class));
        verify(auditLogService, times(1)).log(any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void testLoanRejection() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(officer));
        when(loanApplicationRepository.findById(100L)).thenReturn(Optional.of(pendingApplication));
        when(loanApplicationRepository.save(any(LoanApplication.class))).thenReturn(pendingApplication);

        LoanApprovalRequestDto request = new LoanApprovalRequestDto("Low credit score");
        LoanApplicationResponseDto response = loanService.rejectLoan(100L, 2L, request, "127.0.0.1");

        assertNotNull(response);
        assertEquals("REJECTED", response.getStatus());
        assertEquals("Low credit score", response.getRejectionReason());
        verify(auditLogService, times(1)).log(any(), any(), any(), any(), any(), any(), any());
    }
}
