package com.bankease.service;

import com.bankease.dto.transfer.TransferRequestDto;
import com.bankease.dto.transfer.TransferResponseDto;
import com.bankease.entity.*;
import com.bankease.exception.BadRequestException;
import com.bankease.exception.ForbiddenException;
import com.bankease.exception.InsufficientBalanceException;
import com.bankease.exception.ResourceNotFoundException;
import com.bankease.mapper.DtoMapper;
import com.bankease.repository.AccountRepository;
import com.bankease.repository.BeneficiaryRepository;
import com.bankease.repository.TransactionRepository;
import com.bankease.util.FinancialUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransferService {

    private final AccountRepository accountRepository;
    private final BeneficiaryRepository beneficiaryRepository;
    private final TransactionRepository transactionRepository;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    @Transactional(isolation = Isolation.REPEATABLE_READ, rollbackFor = Exception.class)
    public TransferResponseDto initiateTransfer(Long userId, TransferRequestDto request, String ipAddress) {
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Transfer amount must be strictly positive");
        }

        // Lock sender account using pessimistic lock to prevent concurrent double-spending
        Account sourceAccount = accountRepository.findByIdWithLock(request.getSourceAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Source account not found with ID: " + request.getSourceAccountId()));

        // Verify account ownership
        if (!sourceAccount.getUser().getId().equals(userId)) {
            throw new ForbiddenException("Source account does not belong to the authenticated user");
        }

        // Verify account status
        if (sourceAccount.getStatus() != AccountStatus.ACTIVE) {
            throw new BadRequestException("Source account is not active. Current status: " + sourceAccount.getStatus());
        }

        // Verify beneficiary ownership
        Beneficiary beneficiary = beneficiaryRepository.findById(request.getBeneficiaryId())
                .orElseThrow(() -> new ResourceNotFoundException("Beneficiary not found with ID: " + request.getBeneficiaryId()));

        if (!beneficiary.getUser().getId().equals(userId)) {
            throw new ForbiddenException("Beneficiary does not belong to the authenticated user");
        }

        if (beneficiary.getStatus() != BeneficiaryStatus.ACTIVE) {
            throw new BadRequestException("Beneficiary is inactive");
        }

        // Prevent transfer to identical account
        if (sourceAccount.getAccountNumber().equals(beneficiary.getAccountNumber())) {
            throw new BadRequestException("Cannot transfer funds to the same source account");
        }

        // Check sufficient balance
        if (sourceAccount.getBalance().compareTo(request.getAmount()) < 0) {
            throw new InsufficientBalanceException(String.format(
                    "Insufficient account balance. Available: ₹%s, Required: ₹%s",
                    sourceAccount.getBalance(), request.getAmount()));
        }

        // Perform debit
        sourceAccount.setBalance(sourceAccount.getBalance().subtract(request.getAmount()));
        accountRepository.save(sourceAccount);

        // Check if beneficiary is an internal BankEase account
        Optional<Account> internalReceiverOpt = accountRepository.findByAccountNumberWithLock(beneficiary.getAccountNumber());
        Account receiverAccount = null;

        if (internalReceiverOpt.isPresent()) {
            receiverAccount = internalReceiverOpt.get();
            receiverAccount.setBalance(receiverAccount.getBalance().add(request.getAmount()));
            accountRepository.save(receiverAccount);
        }

        // Record transaction
        String refNumber = FinancialUtils.generateTransactionReference();
        String desc = request.getDescription() != null && !request.getDescription().isBlank()
                ? request.getDescription()
                : "Transfer to " + beneficiary.getName() + " (" + beneficiary.getAccountNumber() + ")";

        Transaction transaction = Transaction.builder()
                .referenceNumber(refNumber)
                .senderAccount(sourceAccount)
                .receiverAccount(receiverAccount)
                .transactionType(TransactionType.FUND_TRANSFER)
                .amount(request.getAmount())
                .status(TransactionStatus.SUCCESS)
                .description(desc)
                .build();

        Transaction savedTxn = transactionRepository.save(transaction);

        // Audit log
        auditLogService.log(userId, sourceAccount.getUser().getEmail(), AuditAction.FUND_TRANSFER,
                "TRANSACTION", savedTxn.getId().toString(),
                String.format("Transferred ₹%s from account %s to %s. Ref: %s",
                        request.getAmount(), sourceAccount.getAccountNumber(), beneficiary.getAccountNumber(), refNumber),
                ipAddress);

        // Notify sender
        notificationService.createNotification(userId, "Transfer Successful",
                String.format("Transferred ₹%s to %s successfully. Ref: %s",
                        request.getAmount(), beneficiary.getName(), refNumber),
                NotificationType.TRANSFER);

        // Notify receiver if internal
        if (receiverAccount != null) {
            notificationService.createNotification(receiverAccount.getUser().getId(), "Money Received",
                    String.format("₹%s received in your account %s from %s. Ref: %s",
                            request.getAmount(), receiverAccount.getAccountNumber(), sourceAccount.getUser().getFullName(), refNumber),
                    NotificationType.TRANSFER);
        }

        return DtoMapper.toTransferResponseDto(savedTxn, sourceAccount, beneficiary);
    }

    @Transactional(readOnly = true)
    public List<TransferResponseDto> getUserTransfers(Long userId) {
        return transactionRepository.findByUserId(userId, org.springframework.data.domain.PageRequest.of(0, 50))
                .getContent()
                .stream()
                .filter(t -> t.getTransactionType() == TransactionType.FUND_TRANSFER)
                .map(t -> {
                    Beneficiary dummyBeneficiary = Beneficiary.builder()
                            .name(t.getReceiverAccount() != null ? t.getReceiverAccount().getUser().getFullName() : "External Beneficiary")
                            .accountNumber(t.getReceiverAccount() != null ? t.getReceiverAccount().getAccountNumber() : "External")
                            .build();
                    return DtoMapper.toTransferResponseDto(t, t.getSenderAccount() != null ? t.getSenderAccount() : new Account(), dummyBeneficiary);
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TransferResponseDto getTransferById(Long id, Long userId) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with ID: " + id));

        boolean isSender = transaction.getSenderAccount() != null && transaction.getSenderAccount().getUser().getId().equals(userId);
        boolean isReceiver = transaction.getReceiverAccount() != null && transaction.getReceiverAccount().getUser().getId().equals(userId);

        if (!isSender && !isReceiver) {
            throw new ForbiddenException("You do not have permission to view this transfer");
        }

        Beneficiary dummyBeneficiary = Beneficiary.builder()
                .name(transaction.getReceiverAccount() != null ? transaction.getReceiverAccount().getUser().getFullName() : "External Beneficiary")
                .accountNumber(transaction.getReceiverAccount() != null ? transaction.getReceiverAccount().getAccountNumber() : "External")
                .build();

        return DtoMapper.toTransferResponseDto(transaction, transaction.getSenderAccount(), dummyBeneficiary);
    }
}
