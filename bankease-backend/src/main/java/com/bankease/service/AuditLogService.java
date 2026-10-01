package com.bankease.service;

import com.bankease.dto.audit.AuditLogResponseDto;
import com.bankease.dto.common.PaginatedResponse;
import com.bankease.entity.AuditAction;
import com.bankease.entity.AuditLog;
import com.bankease.mapper.DtoMapper;
import com.bankease.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(Long userId, String userEmail, AuditAction action, String entityType, String entityId, String description, String ipAddress) {
        AuditLog auditLog = AuditLog.builder()
                .userId(userId)
                .userEmail(userEmail)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .description(description)
                .ipAddress(ipAddress)
                .build();
        auditLogRepository.save(auditLog);
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<AuditLogResponseDto> getAllLogs(Pageable pageable) {
        Page<AuditLog> page = auditLogRepository.findAllByOrderByCreatedAtDesc(pageable);
        return PaginatedResponse.<AuditLogResponseDto>builder()
                .content(page.getContent().stream().map(DtoMapper::toAuditLogResponseDto).collect(Collectors.toList()))
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponseDto> getUserLogs(Long userId) {
        return auditLogRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(DtoMapper::toAuditLogResponseDto)
                .collect(Collectors.toList());
    }
}
