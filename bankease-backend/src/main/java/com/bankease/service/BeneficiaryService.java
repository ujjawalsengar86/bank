package com.bankease.service;

import com.bankease.dto.beneficiary.BeneficiaryRequestDto;
import com.bankease.dto.beneficiary.BeneficiaryResponseDto;
import com.bankease.entity.*;
import com.bankease.exception.BadRequestException;
import com.bankease.exception.DuplicateResourceException;
import com.bankease.exception.ForbiddenException;
import com.bankease.exception.ResourceNotFoundException;
import com.bankease.mapper.DtoMapper;
import com.bankease.repository.AccountRepository;
import com.bankease.repository.BeneficiaryRepository;
import com.bankease.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BeneficiaryService {

    private final BeneficiaryRepository beneficiaryRepository;
    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<BeneficiaryResponseDto> getUserBeneficiaries(Long userId) {
        return beneficiaryRepository.findByUserId(userId)
                .stream()
                .map(DtoMapper::toBeneficiaryResponseDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BeneficiaryResponseDto getBeneficiaryById(Long id, Long userId) {
        Beneficiary beneficiary = beneficiaryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Beneficiary not found with ID: " + id));

        if (!beneficiary.getUser().getId().equals(userId)) {
            throw new ForbiddenException("You do not have permission to access this beneficiary");
        }

        return DtoMapper.toBeneficiaryResponseDto(beneficiary);
    }

    @Transactional
    public BeneficiaryResponseDto addBeneficiary(Long userId, BeneficiaryRequestDto request, String ipAddress) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        // Verify customer is not adding their own account as beneficiary
        accountRepository.findByAccountNumber(request.getAccountNumber()).ifPresent(acc -> {
            if (acc.getUser().getId().equals(userId)) {
                throw new BadRequestException("You cannot add your own account as a beneficiary");
            }
        });

        if (beneficiaryRepository.existsByUserIdAndAccountNumber(userId, request.getAccountNumber())) {
            throw new DuplicateResourceException("Beneficiary with account number " + request.getAccountNumber() + " already exists");
        }

        Beneficiary beneficiary = Beneficiary.builder()
                .user(user)
                .name(request.getName().trim())
                .accountNumber(request.getAccountNumber().trim())
                .bankName(request.getBankName().trim())
                .ifscCode(request.getIfscCode().trim().toUpperCase())
                .status(BeneficiaryStatus.ACTIVE)
                .build();

        Beneficiary saved = beneficiaryRepository.save(beneficiary);

        auditLogService.log(userId, user.getEmail(), AuditAction.ADD_BENEFICIARY,
                "BENEFICIARY", saved.getId().toString(), "Added beneficiary: " + saved.getName(), ipAddress);

        notificationService.createNotification(userId, "Beneficiary Added",
                "Beneficiary " + saved.getName() + " (" + saved.getAccountNumber() + ") has been added successfully.",
                NotificationType.ACCOUNT);

        return DtoMapper.toBeneficiaryResponseDto(saved);
    }

    @Transactional
    public BeneficiaryResponseDto updateBeneficiary(Long id, Long userId, BeneficiaryRequestDto request, String ipAddress) {
        Beneficiary beneficiary = beneficiaryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Beneficiary not found with ID: " + id));

        if (!beneficiary.getUser().getId().equals(userId)) {
            throw new ForbiddenException("You do not have permission to modify this beneficiary");
        }

        // Verify customer is not adding their own account
        accountRepository.findByAccountNumber(request.getAccountNumber()).ifPresent(acc -> {
            if (acc.getUser().getId().equals(userId)) {
                throw new BadRequestException("You cannot add your own account as a beneficiary");
            }
        });

        beneficiary.setName(request.getName().trim());
        beneficiary.setAccountNumber(request.getAccountNumber().trim());
        beneficiary.setBankName(request.getBankName().trim());
        beneficiary.setIfscCode(request.getIfscCode().trim().toUpperCase());

        Beneficiary updated = beneficiaryRepository.save(beneficiary);

        auditLogService.log(userId, beneficiary.getUser().getEmail(), AuditAction.UPDATE_BENEFICIARY,
                "BENEFICIARY", updated.getId().toString(), "Updated beneficiary: " + updated.getName(), ipAddress);

        return DtoMapper.toBeneficiaryResponseDto(updated);
    }

    @Transactional
    public void deleteBeneficiary(Long id, Long userId, String ipAddress) {
        Beneficiary beneficiary = beneficiaryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Beneficiary not found with ID: " + id));

        if (!beneficiary.getUser().getId().equals(userId)) {
            throw new ForbiddenException("You do not have permission to delete this beneficiary");
        }

        beneficiaryRepository.delete(beneficiary);

        auditLogService.log(userId, beneficiary.getUser().getEmail(), AuditAction.DELETE_BENEFICIARY,
                "BENEFICIARY", id.toString(), "Deleted beneficiary: " + beneficiary.getName(), ipAddress);
    }
}
