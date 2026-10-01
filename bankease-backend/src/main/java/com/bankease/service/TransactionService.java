package com.bankease.service;

import com.bankease.dto.common.PaginatedResponse;
import com.bankease.dto.transaction.TransactionResponseDto;
import com.bankease.entity.Account;
import com.bankease.entity.Transaction;
import com.bankease.entity.TransactionStatus;
import com.bankease.entity.TransactionType;
import com.bankease.exception.ForbiddenException;
import com.bankease.exception.ResourceNotFoundException;
import com.bankease.mapper.DtoMapper;
import com.bankease.repository.AccountRepository;
import com.bankease.repository.TransactionRepository;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;

    @Transactional(readOnly = true)
    public PaginatedResponse<TransactionResponseDto> getUserTransactions(
            Long userId,
            Long accountId,
            TransactionType transactionType,
            TransactionStatus status,
            LocalDate startDate,
            LocalDate endDate,
            Pageable pageable,
            boolean isAdmin) {

        Specification<Transaction> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // User filtering: if not admin, must be involved as sender or receiver
            if (!isAdmin) {
                Join<Transaction, Account> senderJoin = root.join("senderAccount", JoinType.LEFT);
                Join<Transaction, Account> receiverJoin = root.join("receiverAccount", JoinType.LEFT);
                Predicate isSender = cb.equal(senderJoin.get("user").get("id"), userId);
                Predicate isReceiver = cb.equal(receiverJoin.get("user").get("id"), userId);
                predicates.add(cb.or(isSender, isReceiver));
            }

            // Account filtering
            if (accountId != null) {
                Predicate senderAcc = cb.equal(root.get("senderAccount").get("id"), accountId);
                Predicate receiverAcc = cb.equal(root.get("receiverAccount").get("id"), accountId);
                predicates.add(cb.or(senderAcc, receiverAcc));
            }

            // Transaction Type filtering
            if (transactionType != null) {
                predicates.add(cb.equal(root.get("transactionType"), transactionType));
            }

            // Status filtering
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            // Date range filtering
            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startDate.atStartOfDay()));
            }
            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), endDate.atTime(LocalTime.MAX)));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Transaction> page = transactionRepository.findAll(spec, pageable);

        return PaginatedResponse.<TransactionResponseDto>builder()
                .content(page.getContent().stream().map(DtoMapper::toTransactionResponseDto).collect(Collectors.toList()))
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public TransactionResponseDto getTransactionById(Long id, Long userId, boolean isAdmin) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with ID: " + id));

        if (!isAdmin) {
            boolean isSender = transaction.getSenderAccount() != null && transaction.getSenderAccount().getUser().getId().equals(userId);
            boolean isReceiver = transaction.getReceiverAccount() != null && transaction.getReceiverAccount().getUser().getId().equals(userId);
            if (!isSender && !isReceiver) {
                throw new ForbiddenException("You do not have permission to view this transaction");
            }
        }

        return DtoMapper.toTransactionResponseDto(transaction);
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<TransactionResponseDto> getAccountTransactions(Long accountId, Long userId, Pageable pageable, boolean isAdmin) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with ID: " + accountId));

        if (!isAdmin && !account.getUser().getId().equals(userId)) {
            throw new ForbiddenException("You do not have permission to view transactions for this account");
        }

        Page<Transaction> page = transactionRepository.findByAccountId(accountId, pageable);

        return PaginatedResponse.<TransactionResponseDto>builder()
                .content(page.getContent().stream().map(DtoMapper::toTransactionResponseDto).collect(Collectors.toList()))
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }
}
