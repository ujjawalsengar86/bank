package com.bankease.service;

import com.bankease.dto.investment.*;
import com.bankease.entity.*;
import com.bankease.exception.BadRequestException;
import com.bankease.exception.ForbiddenException;
import com.bankease.exception.InsufficientBalanceException;
import com.bankease.exception.ResourceNotFoundException;
import com.bankease.mapper.DtoMapper;
import com.bankease.repository.*;
import com.bankease.util.FinancialUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InvestmentService {

    private final InvestmentProductRepository investmentProductRepository;
    private final InvestmentRepository investmentRepository;
    private final InvestmentTransactionRepository investmentTransactionRepository;
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<InvestmentProductDto> getInvestmentProducts() {
        return investmentProductRepository.findByActiveTrue()
                .stream()
                .map(DtoMapper::toInvestmentProductDto)
                .collect(Collectors.toList());
    }

    @Transactional(isolation = Isolation.REPEATABLE_READ, rollbackFor = Exception.class)
    public InvestmentResponseDto createInvestment(Long userId, InvestmentCreateRequestDto request, String ipAddress) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        InvestmentProduct product = investmentProductRepository.findById(request.getInvestmentProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Investment product not found with ID: " + request.getInvestmentProductId()));

        if (!product.isActive()) {
            throw new BadRequestException("Investment product is not active");
        }

        if (request.getAmount().compareTo(product.getMinAmount()) < 0) {
            throw new BadRequestException("Investment amount must be at least ₹" + product.getMinAmount());
        }

        if (request.getTenureMonths() < product.getMinTenureMonths()) {
            throw new BadRequestException("Tenure must be at least " + product.getMinTenureMonths() + " months");
        }

        Account account = accountRepository.findByIdWithLock(request.getSourceAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Source account not found with ID: " + request.getSourceAccountId()));

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

        // Debit account
        account.setBalance(account.getBalance().subtract(request.getAmount()));
        accountRepository.save(account);

        // Calculate maturity details
        BigDecimal expectedMaturity = FinancialUtils.calculateInvestmentMaturity(
                request.getAmount(), product.getInterestRate(), request.getTenureMonths());

        LocalDate startDate = LocalDate.now();
        LocalDate maturityDate = startDate.plusMonths(request.getTenureMonths());
        String invNumber = FinancialUtils.generateInvestmentNumber();

        Investment investment = Investment.builder()
                .user(user)
                .investmentProduct(product)
                .sourceAccount(account)
                .investmentNumber(invNumber)
                .investedAmount(request.getAmount())
                .interestRate(product.getInterestRate())
                .tenureMonths(request.getTenureMonths())
                .expectedMaturityAmount(expectedMaturity)
                .currentValue(request.getAmount())
                .status(InvestmentStatus.ACTIVE)
                .startDate(startDate)
                .maturityDate(maturityDate)
                .build();

        Investment savedInv = investmentRepository.save(investment);

        // Create transaction
        String refNumber = FinancialUtils.generateTransactionReference();
        Transaction transaction = Transaction.builder()
                .referenceNumber(refNumber)
                .senderAccount(account)
                .receiverAccount(null)
                .transactionType(TransactionType.INVESTMENT)
                .amount(request.getAmount())
                .status(TransactionStatus.SUCCESS)
                .description("Created investment " + invNumber + " in " + product.getName())
                .build();
        Transaction savedTxn = transactionRepository.save(transaction);

        // Create investment transaction
        InvestmentTransaction invTxn = InvestmentTransaction.builder()
                .investment(savedInv)
                .transaction(savedTxn)
                .type("INVEST")
                .amount(request.getAmount())
                .build();
        investmentTransactionRepository.save(invTxn);

        // Audit log
        auditLogService.log(userId, user.getEmail(), AuditAction.INVESTMENT_CREATION,
                "INVESTMENT", savedInv.getId().toString(),
                String.format("Invested ₹%s in %s. Expected maturity: ₹%s",
                        request.getAmount(), product.getName(), expectedMaturity),
                ipAddress);

        // Notification
        notificationService.createNotification(userId, "Investment Started",
                String.format("You invested ₹%s in %s (%s). Maturity: %s",
                        request.getAmount(), product.getName(), invNumber, maturityDate),
                NotificationType.INVESTMENT);

        return DtoMapper.toInvestmentResponseDto(savedInv);
    }

    @Transactional(readOnly = true)
    public List<InvestmentResponseDto> getUserInvestments(Long userId) {
        return investmentRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(DtoMapper::toInvestmentResponseDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public InvestmentResponseDto getInvestmentById(Long id, Long userId) {
        Investment investment = investmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Investment not found with ID: " + id));

        if (!investment.getUser().getId().equals(userId)) {
            throw new ForbiddenException("You do not have permission to view this investment");
        }

        return DtoMapper.toInvestmentResponseDto(investment);
    }

    @Transactional(readOnly = true)
    public PortfolioSummaryDto getPortfolioSummary(Long userId) {
        List<Investment> list = investmentRepository.findByUserIdOrderByCreatedAtDesc(userId);

        BigDecimal totalInvested = BigDecimal.ZERO;
        BigDecimal currentValue = BigDecimal.ZERO;
        Map<String, BigDecimal> breakdown = new HashMap<>();

        for (Investment inv : list) {
            if (inv.getStatus() == InvestmentStatus.ACTIVE) {
                totalInvested = totalInvested.add(inv.getInvestedAmount());
                currentValue = currentValue.add(inv.getCurrentValue() != null ? inv.getCurrentValue() : inv.getInvestedAmount());

                String typeKey = inv.getInvestmentProduct().getInvestmentType().name();
                breakdown.put(typeKey, breakdown.getOrDefault(typeKey, BigDecimal.ZERO).add(inv.getInvestedAmount()));
            }
        }

        BigDecimal totalReturns = currentValue.subtract(totalInvested);

        return PortfolioSummaryDto.builder()
                .totalInvested(totalInvested)
                .currentValue(currentValue)
                .totalReturns(totalReturns)
                .totalInvestments(list.size())
                .breakdownByType(breakdown)
                .build();
    }

    @Transactional(isolation = Isolation.REPEATABLE_READ, rollbackFor = Exception.class)
    public InvestmentResponseDto withdrawInvestment(Long investmentId, Long userId, WithdrawRequestDto request, String ipAddress) {
        Investment investment = investmentRepository.findById(investmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Investment not found with ID: " + investmentId));

        if (!investment.getUser().getId().equals(userId)) {
            throw new ForbiddenException("You do not have permission to withdraw this investment");
        }

        if (investment.getStatus() != InvestmentStatus.ACTIVE) {
            throw new BadRequestException("Investment is already " + investment.getStatus());
        }

        Account destAccount = accountRepository.findByIdWithLock(request.getDestinationAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Destination account not found with ID: " + request.getDestinationAccountId()));

        if (!destAccount.getUser().getId().equals(userId)) {
            throw new ForbiddenException("Destination account does not belong to authenticated user");
        }

        if (destAccount.getStatus() != AccountStatus.ACTIVE) {
            throw new BadRequestException("Destination account is not active");
        }

        BigDecimal payoutAmount = investment.getCurrentValue();
        destAccount.setBalance(destAccount.getBalance().add(payoutAmount));
        accountRepository.save(destAccount);

        investment.setStatus(InvestmentStatus.CLOSED);
        Investment updated = investmentRepository.save(investment);

        // Record transaction
        String refNumber = FinancialUtils.generateTransactionReference();
        Transaction transaction = Transaction.builder()
                .referenceNumber(refNumber)
                .senderAccount(null)
                .receiverAccount(destAccount)
                .transactionType(TransactionType.DEPOSIT)
                .amount(payoutAmount)
                .status(TransactionStatus.SUCCESS)
                .description("Withdrawal from investment " + investment.getInvestmentNumber())
                .build();
        Transaction savedTxn = transactionRepository.save(transaction);

        // Record investment transaction
        InvestmentTransaction invTxn = InvestmentTransaction.builder()
                .investment(updated)
                .transaction(savedTxn)
                .type("WITHDRAW")
                .amount(payoutAmount)
                .build();
        investmentTransactionRepository.save(invTxn);

        // Audit log
        auditLogService.log(userId, investment.getUser().getEmail(), AuditAction.INVESTMENT_WITHDRAWAL,
                "INVESTMENT", updated.getId().toString(),
                String.format("Withdrew ₹%s from investment %s to account %s",
                        payoutAmount, updated.getInvestmentNumber(), destAccount.getAccountNumber()),
                ipAddress);

        // Notification
        notificationService.createNotification(userId, "Investment Withdrawn",
                String.format("₹%s from investment %s has been deposited into your account %s.",
                        payoutAmount, updated.getInvestmentNumber(), destAccount.getAccountNumber()),
                NotificationType.INVESTMENT);

        return DtoMapper.toInvestmentResponseDto(updated);
    }
}
