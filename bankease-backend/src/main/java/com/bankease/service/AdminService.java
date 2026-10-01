package com.bankease.service;

import com.bankease.dto.account.AccountResponseDto;
import com.bankease.dto.admin.AdminAccountStatusUpdateDto;
import com.bankease.dto.admin.AdminUserRoleUpdateDto;
import com.bankease.dto.admin.AdminUserStatusUpdateDto;
import com.bankease.dto.audit.AuditLogResponseDto;
import com.bankease.dto.bill.BillerResponseDto;
import com.bankease.dto.common.PaginatedResponse;
import com.bankease.dto.transaction.TransactionResponseDto;
import com.bankease.dto.user.UserProfileDto;
import com.bankease.entity.Account;
import com.bankease.entity.AuditAction;
import com.bankease.entity.Biller;
import com.bankease.entity.User;
import com.bankease.exception.ResourceNotFoundException;
import com.bankease.mapper.DtoMapper;
import com.bankease.repository.AccountRepository;
import com.bankease.repository.BillerRepository;
import com.bankease.repository.TransactionRepository;
import com.bankease.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final BillerRepository billerRepository;
    private final TransactionRepository transactionRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<UserProfileDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(DtoMapper::toUserProfileDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserProfileDto updateUserStatus(Long userId, AdminUserStatusUpdateDto dto, Long adminId, String ipAddress) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        if (dto.getAccountStatus() != null) {
            user.setAccountStatus(dto.getAccountStatus());
        }
        if (dto.getKycStatus() != null) {
            user.setKycStatus(dto.getKycStatus());
        }

        User updated = userRepository.save(user);

        auditLogService.log(adminId, "admin", AuditAction.STATUS_CHANGE,
                "USER", userId.toString(), "Admin updated user status for " + user.getEmail(), ipAddress);

        return DtoMapper.toUserProfileDto(updated);
    }

    @Transactional
    public UserProfileDto updateUserRole(Long userId, AdminUserRoleUpdateDto dto, Long adminId, String ipAddress) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        user.setRole(dto.getRole());
        User updated = userRepository.save(user);

        auditLogService.log(adminId, "admin", AuditAction.STATUS_CHANGE,
                "USER", userId.toString(), "Admin updated role to " + dto.getRole() + " for " + user.getEmail(), ipAddress);

        return DtoMapper.toUserProfileDto(updated);
    }

    @Transactional(readOnly = true)
    public List<AccountResponseDto> getAllAccounts() {
        return accountRepository.findAll().stream()
                .map(DtoMapper::toAccountResponseDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public AccountResponseDto updateAccountStatus(Long accountId, AdminAccountStatusUpdateDto dto, Long adminId, String ipAddress) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with ID: " + accountId));

        account.setStatus(dto.getStatus());
        Account updated = accountRepository.save(account);

        auditLogService.log(adminId, "admin", AuditAction.STATUS_CHANGE,
                "ACCOUNT", accountId.toString(), "Admin changed account status to " + dto.getStatus(), ipAddress);

        return DtoMapper.toAccountResponseDto(updated);
    }

    @Transactional
    public BillerResponseDto createBiller(Biller biller, Long adminId, String ipAddress) {
        Biller saved = billerRepository.save(biller);

        auditLogService.log(adminId, "admin", AuditAction.STATUS_CHANGE,
                "BILLER", saved.getId().toString(), "Admin created biller " + saved.getName(), ipAddress);

        return DtoMapper.toBillerResponseDto(saved);
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<TransactionResponseDto> getAllTransactions(Pageable pageable) {
        Page<com.bankease.entity.Transaction> page = transactionRepository.findAll(pageable);
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
