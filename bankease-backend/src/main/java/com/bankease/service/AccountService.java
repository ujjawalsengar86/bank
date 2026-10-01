package com.bankease.service;

import com.bankease.dto.account.AccountCreateRequest;
import com.bankease.dto.account.AccountResponseDto;
import com.bankease.dto.account.BalanceResponseDto;
import com.bankease.entity.*;
import com.bankease.exception.ForbiddenException;
import com.bankease.exception.ResourceNotFoundException;
import com.bankease.mapper.DtoMapper;
import com.bankease.repository.AccountRepository;
import com.bankease.repository.UserRepository;
import com.bankease.util.FinancialUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<AccountResponseDto> getUserAccounts(Long userId) {
        return accountRepository.findByUserId(userId)
                .stream()
                .map(DtoMapper::toAccountResponseDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AccountResponseDto getAccountById(Long accountId, Long userId, boolean isAdminOrOfficer) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with ID: " + accountId));

        if (!isAdminOrOfficer && !account.getUser().getId().equals(userId)) {
            throw new ForbiddenException("You do not have permission to access this account");
        }

        return DtoMapper.toAccountResponseDto(account);
    }

    @Transactional(readOnly = true)
    public BalanceResponseDto getAccountBalance(Long accountId, Long userId, boolean isAdminOrOfficer) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with ID: " + accountId));

        if (!isAdminOrOfficer && !account.getUser().getId().equals(userId)) {
            throw new ForbiddenException("You do not have permission to access this account");
        }

        return DtoMapper.toBalanceResponseDto(account);
    }

    @Transactional
    public AccountResponseDto createAccount(Long targetUserId, AccountCreateRequest request) {
        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + targetUserId));

        Account account = Account.builder()
                .user(user)
                .accountNumber(FinancialUtils.generateAccountNumber())
                .accountType(request.getAccountType())
                .balance(request.getInitialDeposit() != null ? request.getInitialDeposit() : java.math.BigDecimal.ZERO)
                .currency("INR")
                .status(AccountStatus.ACTIVE)
                .build();

        Account saved = accountRepository.save(account);
        return DtoMapper.toAccountResponseDto(saved);
    }

    @Transactional(readOnly = true)
    public Account getAccountEntityAndVerifyOwnership(Long accountId, Long userId) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with ID: " + accountId));
        if (!account.getUser().getId().equals(userId)) {
            throw new ForbiddenException("You do not have permission to access this account");
        }
        return account;
    }
}
