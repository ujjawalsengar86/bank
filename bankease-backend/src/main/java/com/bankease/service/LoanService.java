package com.bankease.service;

import com.bankease.dto.common.PaginatedResponse;
import com.bankease.dto.loan.*;
import com.bankease.entity.*;
import com.bankease.exception.BadRequestException;
import com.bankease.exception.ForbiddenException;
import com.bankease.exception.InsufficientBalanceException;
import com.bankease.exception.ResourceNotFoundException;
import com.bankease.mapper.DtoMapper;
import com.bankease.repository.*;
import com.bankease.util.FinancialUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LoanService {

    private final LoanProductRepository loanProductRepository;
    private final LoanApplicationRepository loanApplicationRepository;
    private final LoanRepository loanRepository;
    private final LoanPaymentRepository loanPaymentRepository;
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<LoanProductDto> getLoanProducts() {
        return loanProductRepository.findByActiveTrue()
                .stream()
                .map(DtoMapper::toLoanProductDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public LoanApplicationResponseDto applyLoan(Long userId, LoanApplicationRequestDto request, String ipAddress) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        LoanProduct product = loanProductRepository.findById(request.getLoanProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Loan product not found with ID: " + request.getLoanProductId()));

        if (!product.isActive()) {
            throw new BadRequestException("Loan product is currently inactive");
        }

        if (request.getRequestedAmount().compareTo(product.getMinAmount()) < 0 ||
                request.getRequestedAmount().compareTo(product.getMaxAmount()) > 0) {
            throw new BadRequestException(String.format("Requested amount must be between ₹%s and ₹%s",
                    product.getMinAmount(), product.getMaxAmount()));
        }

        if (request.getTenureMonths() < product.getMinTenureMonths() ||
                request.getTenureMonths() > product.getMaxTenureMonths()) {
            throw new BadRequestException(String.format("Tenure must be between %d and %d months",
                    product.getMinTenureMonths(), product.getMaxTenureMonths()));
        }

        Account disbursementAccount = accountRepository.findById(request.getDisbursementAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Disbursement account not found with ID: " + request.getDisbursementAccountId()));

        if (!disbursementAccount.getUser().getId().equals(userId)) {
            throw new ForbiddenException("Disbursement account does not belong to the applicant");
        }

        if (disbursementAccount.getStatus() != AccountStatus.ACTIVE) {
            throw new BadRequestException("Disbursement account is not active");
        }

        LoanApplication application = LoanApplication.builder()
                .user(user)
                .loanProduct(product)
                .requestedAmount(request.getRequestedAmount())
                .tenureMonths(request.getTenureMonths())
                .annualIncome(request.getAnnualIncome())
                .purpose(request.getPurpose().trim())
                .status(ApplicationStatus.PENDING)
                .build();

        LoanApplication savedApp = loanApplicationRepository.save(application);

        BigDecimal estimatedEmi = FinancialUtils.calculateEmi(request.getRequestedAmount(), product.getInterestRate(), request.getTenureMonths());

        auditLogService.log(userId, user.getEmail(), AuditAction.LOAN_APPLICATION,
                "LOAN_APPLICATION", savedApp.getId().toString(),
                String.format("Applied for %s of ₹%s for %d months", product.getName(), request.getRequestedAmount(), request.getTenureMonths()),
                ipAddress);

        notificationService.createNotification(userId, "Loan Application Submitted",
                String.format("Your application for %s (₹%s) has been submitted for review.", product.getName(), request.getRequestedAmount()),
                NotificationType.LOAN);

        return DtoMapper.toLoanApplicationResponseDto(savedApp, estimatedEmi);
    }

    @Transactional(readOnly = true)
    public List<LoanApplicationResponseDto> getMyApplications(Long userId) {
        return loanApplicationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(app -> {
                    BigDecimal emi = FinancialUtils.calculateEmi(app.getRequestedAmount(), app.getLoanProduct().getInterestRate(), app.getTenureMonths());
                    return DtoMapper.toLoanApplicationResponseDto(app, emi);
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<LoanApplicationResponseDto> getAllApplications(Pageable pageable) {
        Page<LoanApplication> page = loanApplicationRepository.findAllByOrderByCreatedAtDesc(pageable);
        return PaginatedResponse.<LoanApplicationResponseDto>builder()
                .content(page.getContent().stream()
                        .map(app -> {
                            BigDecimal emi = FinancialUtils.calculateEmi(app.getRequestedAmount(), app.getLoanProduct().getInterestRate(), app.getTenureMonths());
                            return DtoMapper.toLoanApplicationResponseDto(app, emi);
                        })
                        .collect(Collectors.toList()))
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public LoanApplicationResponseDto getApplicationById(Long applicationId, Long userId, boolean isOfficerOrAdmin) {
        LoanApplication application = loanApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan application not found with ID: " + applicationId));

        if (!isOfficerOrAdmin && !application.getUser().getId().equals(userId)) {
            throw new ForbiddenException("You do not have permission to view this loan application");
        }

        BigDecimal emi = FinancialUtils.calculateEmi(application.getRequestedAmount(), application.getLoanProduct().getInterestRate(), application.getTenureMonths());
        return DtoMapper.toLoanApplicationResponseDto(application, emi);
    }

    @Transactional(isolation = Isolation.REPEATABLE_READ, rollbackFor = Exception.class)
    public LoanResponseDto approveLoan(Long applicationId, Long officerUserId, String ipAddress) {
        User officer = userRepository.findById(officerUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Officer user not found with ID: " + officerUserId));

        LoanApplication application = loanApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan application not found with ID: " + applicationId));

        if (application.getStatus() != ApplicationStatus.PENDING && application.getStatus() != ApplicationStatus.UNDER_REVIEW) {
            throw new BadRequestException("Application cannot be approved from current status: " + application.getStatus());
        }

        application.setStatus(ApplicationStatus.APPROVED);
        application.setReviewedBy(officer);
        loanApplicationRepository.save(application);

        // Fetch customer's primary active account for disbursement
        List<Account> userAccounts = accountRepository.findByUserId(application.getUser().getId());
        Account targetAccount = userAccounts.stream()
                .filter(a -> a.getStatus() == AccountStatus.ACTIVE)
                .findFirst()
                .orElseThrow(() -> new BadRequestException("Customer has no active bank account for loan disbursement"));

        // Calculate EMI and total payable
        BigDecimal principal = application.getRequestedAmount();
        BigDecimal annualRate = application.getLoanProduct().getInterestRate();
        int tenure = application.getTenureMonths();
        BigDecimal emi = FinancialUtils.calculateEmi(principal, annualRate, tenure);
        BigDecimal totalPayable = emi.multiply(BigDecimal.valueOf(tenure)).setScale(2, RoundingMode.HALF_UP);

        LocalDate startDate = LocalDate.now();
        LocalDate endDate = startDate.plusMonths(tenure);

        // Disburse amount to target account
        targetAccount.setBalance(targetAccount.getBalance().add(principal));
        accountRepository.save(targetAccount);

        // Record disbursement transaction
        String txnRef = FinancialUtils.generateTransactionReference();
        Transaction disbursementTxn = Transaction.builder()
                .referenceNumber(txnRef)
                .senderAccount(null)
                .receiverAccount(targetAccount)
                .transactionType(TransactionType.DEPOSIT)
                .amount(principal)
                .status(TransactionStatus.SUCCESS)
                .description("Loan disbursement for " + application.getLoanProduct().getName())
                .build();
        transactionRepository.save(disbursementTxn);

        // Create active Loan entity
        String loanAccNum = FinancialUtils.generateLoanAccountNumber();
        Loan loan = Loan.builder()
                .user(application.getUser())
                .application(application)
                .loanProduct(application.getLoanProduct())
                .disbursedAccount(targetAccount)
                .loanAccountNumber(loanAccNum)
                .principalAmount(principal)
                .interestRate(annualRate)
                .tenureMonths(tenure)
                .emiAmount(emi)
                .totalPayable(totalPayable)
                .remainingBalance(totalPayable)
                .status(LoanStatus.ACTIVE)
                .startDate(startDate)
                .endDate(endDate)
                .build();

        Loan savedLoan = loanRepository.save(loan);

        // Audit log
        auditLogService.log(officerUserId, officer.getEmail(), AuditAction.LOAN_APPROVAL,
                "LOAN", savedLoan.getId().toString(),
                String.format("Approved loan application #%d. Disbursed ₹%s to account %s",
                        applicationId, principal, targetAccount.getAccountNumber()),
                ipAddress);

        // Notify customer
        notificationService.createNotification(application.getUser().getId(), "Loan Approved & Disbursed!",
                String.format("Your %s application #%d has been approved. ₹%s has been credited to your account %s. Monthly EMI: ₹%s.",
                        application.getLoanProduct().getName(), applicationId, principal, targetAccount.getAccountNumber(), emi),
                NotificationType.LOAN);

        return DtoMapper.toLoanResponseDto(savedLoan);
    }

    @Transactional
    public LoanApplicationResponseDto rejectLoan(Long applicationId, Long officerUserId, LoanApprovalRequestDto request, String ipAddress) {
        User officer = userRepository.findById(officerUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Officer user not found with ID: " + officerUserId));

        LoanApplication application = loanApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan application not found with ID: " + applicationId));

        if (application.getStatus() != ApplicationStatus.PENDING && application.getStatus() != ApplicationStatus.UNDER_REVIEW) {
            throw new BadRequestException("Application cannot be rejected from status: " + application.getStatus());
        }

        String reason = (request != null && request.getRejectionReason() != null && !request.getRejectionReason().isBlank())
                ? request.getRejectionReason()
                : "Criteria not met";

        application.setStatus(ApplicationStatus.REJECTED);
        application.setReviewedBy(officer);
        application.setRejectionReason(reason);
        LoanApplication saved = loanApplicationRepository.save(application);

        // Audit log
        auditLogService.log(officerUserId, officer.getEmail(), AuditAction.LOAN_REJECTION,
                "LOAN_APPLICATION", applicationId.toString(), "Rejected loan application: " + reason, ipAddress);

        // Notify customer
        notificationService.createNotification(application.getUser().getId(), "Loan Application Status",
                String.format("Your loan application #%d was rejected. Reason: %s", applicationId, reason),
                NotificationType.LOAN);

        BigDecimal emi = FinancialUtils.calculateEmi(saved.getRequestedAmount(), saved.getLoanProduct().getInterestRate(), saved.getTenureMonths());
        return DtoMapper.toLoanApplicationResponseDto(saved, emi);
    }

    @Transactional(readOnly = true)
    public List<LoanResponseDto> getMyLoans(Long userId) {
        return loanRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(DtoMapper::toLoanResponseDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public LoanResponseDto getLoanById(Long loanId, Long userId) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found with ID: " + loanId));

        if (!loan.getUser().getId().equals(userId)) {
            throw new ForbiddenException("You do not have permission to view this loan");
        }

        return DtoMapper.toLoanResponseDto(loan);
    }

    @Transactional(isolation = Isolation.REPEATABLE_READ, rollbackFor = Exception.class)
    public LoanPaymentResponseDto payLoan(Long loanId, Long userId, LoanPaymentRequestDto request, String ipAddress) {
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Repayment amount must be greater than zero");
        }

        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found with ID: " + loanId));

        if (!loan.getUser().getId().equals(userId)) {
            throw new ForbiddenException("You do not have permission to repay this loan");
        }

        if (loan.getStatus() != LoanStatus.ACTIVE) {
            throw new BadRequestException("Loan is not active. Status: " + loan.getStatus());
        }

        Account account = accountRepository.findByIdWithLock(request.getSourceAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with ID: " + request.getSourceAccountId()));

        if (!account.getUser().getId().equals(userId)) {
            throw new ForbiddenException("Account does not belong to authenticated user");
        }

        if (account.getStatus() != AccountStatus.ACTIVE) {
            throw new BadRequestException("Source account is not active");
        }

        if (account.getBalance().compareTo(request.getAmount()) < 0) {
            throw new InsufficientBalanceException(String.format(
                    "Insufficient balance. Available: ₹%s, Required: ₹%s",
                    account.getBalance(), request.getAmount()));
        }

        // Debit customer account
        account.setBalance(account.getBalance().subtract(request.getAmount()));
        accountRepository.save(account);

        // Update loan balance
        BigDecimal paymentAmount = request.getAmount();
        BigDecimal newRemaining = loan.getRemainingBalance().subtract(paymentAmount);
        if (newRemaining.compareTo(BigDecimal.ZERO) <= 0) {
            loan.setRemainingBalance(BigDecimal.ZERO);
            loan.setStatus(LoanStatus.CLOSED);
        } else {
            loan.setRemainingBalance(newRemaining);
        }
        loanRepository.save(loan);

        // Record transaction
        String refNumber = FinancialUtils.generateTransactionReference();
        Transaction transaction = Transaction.builder()
                .referenceNumber(refNumber)
                .senderAccount(account)
                .receiverAccount(null)
                .transactionType(TransactionType.LOAN_PAYMENT)
                .amount(paymentAmount)
                .status(TransactionStatus.SUCCESS)
                .description("Repayment for loan " + loan.getLoanAccountNumber())
                .build();
        Transaction savedTxn = transactionRepository.save(transaction);

        // Principal and interest portion estimation
        int totalPaidCount = loanPaymentRepository.findByLoanIdOrderByPaymentDateDesc(loanId).size();
        BigDecimal interestPortion = loan.getRemainingBalance().multiply(loan.getInterestRate())
                .divide(BigDecimal.valueOf(1200), 2, RoundingMode.HALF_UP);
        if (interestPortion.compareTo(paymentAmount) > 0) {
            interestPortion = paymentAmount;
        }
        BigDecimal principalPortion = paymentAmount.subtract(interestPortion);

        String receiptNumber = FinancialUtils.generateReceiptNumber();
        LoanPayment payment = LoanPayment.builder()
                .loan(loan)
                .account(account)
                .transaction(savedTxn)
                .amount(paymentAmount)
                .principalPortion(principalPortion)
                .interestPortion(interestPortion)
                .installmentNumber(totalPaidCount + 1)
                .receiptNumber(receiptNumber)
                .build();
        LoanPayment savedPayment = loanPaymentRepository.save(payment);

        // Audit log
        auditLogService.log(userId, account.getUser().getEmail(), AuditAction.LOAN_PAYMENT,
                "LOAN_PAYMENT", savedPayment.getId().toString(),
                String.format("Repaid ₹%s for loan %s. Remaining: ₹%s",
                        paymentAmount, loan.getLoanAccountNumber(), loan.getRemainingBalance()),
                ipAddress);

        // Notification
        notificationService.createNotification(userId, "Loan Payment Successful",
                String.format("₹%s paid towards loan %s. Remaining balance: ₹%s.",
                        paymentAmount, loan.getLoanAccountNumber(), loan.getRemainingBalance()),
                NotificationType.LOAN);

        return DtoMapper.toLoanPaymentResponseDto(savedPayment);
    }

    @Transactional(readOnly = true)
    public List<LoanPaymentResponseDto> getLoanPayments(Long loanId, Long userId) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found with ID: " + loanId));

        if (!loan.getUser().getId().equals(userId)) {
            throw new ForbiddenException("You do not have permission to view payments for this loan");
        }

        return loanPaymentRepository.findByLoanIdOrderByPaymentDateDesc(loanId)
                .stream()
                .map(DtoMapper::toLoanPaymentResponseDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<RepaymentScheduleItemDto> getRepaymentSchedule(Long loanId, Long userId) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found with ID: " + loanId));

        if (!loan.getUser().getId().equals(userId)) {
            throw new ForbiddenException("You do not have permission to view schedule for this loan");
        }

        List<RepaymentScheduleItemDto> schedule = new ArrayList<>();
        BigDecimal balance = loan.getPrincipalAmount();
        BigDecimal monthlyRate = loan.getInterestRate().divide(BigDecimal.valueOf(1200), 10, RoundingMode.HALF_UP);
        BigDecimal emi = loan.getEmiAmount();
        LocalDate dueDate = loan.getStartDate();

        for (int i = 1; i <= loan.getTenureMonths(); i++) {
            dueDate = dueDate.plusMonths(1);
            BigDecimal interest = balance.multiply(monthlyRate).setScale(2, RoundingMode.HALF_UP);
            BigDecimal principal = emi.subtract(interest).setScale(2, RoundingMode.HALF_UP);
            balance = balance.subtract(principal).setScale(2, RoundingMode.HALF_UP);
            if (balance.compareTo(BigDecimal.ZERO) < 0 || i == loan.getTenureMonths()) {
                balance = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
            }

            schedule.add(RepaymentScheduleItemDto.builder()
                    .installmentNumber(i)
                    .dueDate(dueDate)
                    .emiAmount(emi)
                    .principalPortion(principal)
                    .interestPortion(interest)
                    .balanceAfterPayment(balance)
                    .build());
        }

        return schedule;
    }
}
