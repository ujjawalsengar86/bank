package com.bankease.service;

import com.bankease.dto.bill.*;
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
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BillService {

    private final BillerRepository billerRepository;
    private final BillRepository billRepository;
    private final BillPaymentRepository billPaymentRepository;
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<BillerResponseDto> getAllBillers() {
        return billerRepository.findByActiveTrue()
                .stream()
                .map(DtoMapper::toBillerResponseDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public BillResponseDto fetchBill(BillFetchRequestDto request) {
        Biller biller = billerRepository.findById(request.getBillerId())
                .orElseThrow(() -> new ResourceNotFoundException("Biller not found with ID: " + request.getBillerId()));

        return billRepository.findByBillerIdAndConsumerNumber(request.getBillerId(), request.getConsumerNumber().trim())
                .map(DtoMapper::toBillResponseDto)
                .orElseGet(() -> {
                    // Simulate bill generation for real testing if not found in db
                    Bill newBill = Bill.builder()
                            .biller(biller)
                            .consumerNumber(request.getConsumerNumber().trim())
                            .consumerName("Customer " + request.getConsumerNumber())
                            .amount(new BigDecimal("1250.00"))
                            .billDate(LocalDate.now().minusDays(5))
                            .dueDate(LocalDate.now().plusDays(15))
                            .status(BillStatus.UNPAID)
                            .build();
                    Bill saved = billRepository.save(newBill);
                    return DtoMapper.toBillResponseDto(saved);
                });
    }

    @Transactional(isolation = Isolation.REPEATABLE_READ, rollbackFor = Exception.class)
    public BillPaymentResponseDto payBill(Long userId, BillPayRequestDto request, String ipAddress) {
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Payment amount must be greater than zero");
        }

        // Lock source account
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
                    "Insufficient account balance. Available: ₹%s, Required: ₹%s",
                    account.getBalance(), request.getAmount()));
        }

        // Fetch or locate bill
        Bill bill;
        if (request.getBillId() != null) {
            bill = billRepository.findById(request.getBillId())
                    .orElseThrow(() -> new ResourceNotFoundException("Bill not found with ID: " + request.getBillId()));
        } else if (request.getBillerId() != null && request.getConsumerNumber() != null) {
            Biller biller = billerRepository.findById(request.getBillerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Biller not found with ID: " + request.getBillerId()));
            bill = billRepository.findByBillerIdAndConsumerNumber(request.getBillerId(), request.getConsumerNumber().trim())
                    .orElseGet(() -> billRepository.save(Bill.builder()
                            .biller(biller)
                            .consumerNumber(request.getConsumerNumber().trim())
                            .consumerName("Consumer " + request.getConsumerNumber())
                            .amount(request.getAmount())
                            .billDate(LocalDate.now().minusDays(3))
                            .dueDate(LocalDate.now().plusDays(10))
                            .status(BillStatus.UNPAID)
                            .build()));
        } else {
            throw new BadRequestException("Either billId or billerId with consumerNumber must be provided");
        }

        if (bill.getStatus() == BillStatus.PAID) {
            throw new BadRequestException("This bill has already been paid");
        }

        // Debit account
        account.setBalance(account.getBalance().subtract(request.getAmount()));
        accountRepository.save(account);

        // Mark bill paid
        bill.setStatus(BillStatus.PAID);
        billRepository.save(bill);

        // Create transaction
        String refNumber = FinancialUtils.generateTransactionReference();
        Transaction transaction = Transaction.builder()
                .referenceNumber(refNumber)
                .senderAccount(account)
                .receiverAccount(null)
                .transactionType(TransactionType.BILL_PAYMENT)
                .amount(request.getAmount())
                .status(TransactionStatus.SUCCESS)
                .description("Bill payment to " + bill.getBiller().getName() + " for " + bill.getConsumerNumber())
                .build();
        Transaction savedTxn = transactionRepository.save(transaction);

        // Create bill payment record
        String receiptNumber = FinancialUtils.generateReceiptNumber();
        BillPayment billPayment = BillPayment.builder()
                .bill(bill)
                .account(account)
                .transaction(savedTxn)
                .amount(request.getAmount())
                .receiptNumber(receiptNumber)
                .build();
        BillPayment savedPayment = billPaymentRepository.save(billPayment);

        // Audit log
        auditLogService.log(userId, account.getUser().getEmail(), AuditAction.BILL_PAYMENT,
                "BILL_PAYMENT", savedPayment.getId().toString(),
                String.format("Paid ₹%s to %s for consumer %s. Receipt: %s",
                        request.getAmount(), bill.getBiller().getName(), bill.getConsumerNumber(), receiptNumber),
                ipAddress);

        // Notification
        notificationService.createNotification(userId, "Bill Paid Successfully",
                String.format("₹%s paid to %s for %s. Receipt: %s",
                        request.getAmount(), bill.getBiller().getName(), bill.getConsumerNumber(), receiptNumber),
                NotificationType.BILL);

        return DtoMapper.toBillPaymentResponseDto(savedPayment);
    }

    @Transactional(readOnly = true)
    public List<BillPaymentResponseDto> getBillPaymentHistory(Long userId) {
        return billPaymentRepository.findByAccountUserIdOrderByPaymentDateDesc(userId)
                .stream()
                .map(DtoMapper::toBillPaymentResponseDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BillResponseDto getBillById(Long billId) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found with ID: " + billId));
        return DtoMapper.toBillResponseDto(bill);
    }
}
