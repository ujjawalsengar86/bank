package com.bankease.service;

import com.bankease.dto.user.ChangePasswordRequest;
import com.bankease.dto.user.UserProfileDto;
import com.bankease.dto.user.UserUpdateRequest;
import com.bankease.entity.AuditAction;
import com.bankease.entity.NotificationType;
import com.bankease.entity.User;
import com.bankease.exception.BadRequestException;
import com.bankease.exception.DuplicateResourceException;
import com.bankease.exception.ResourceNotFoundException;
import com.bankease.mapper.DtoMapper;
import com.bankease.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public UserProfileDto getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
        return DtoMapper.toUserProfileDto(user);
    }

    @Transactional
    public UserProfileDto updateProfile(Long userId, UserUpdateRequest request, String ipAddress) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        if (!user.getMobile().equals(request.getMobile())) {
            if (userRepository.existsByMobile(request.getMobile())) {
                throw new DuplicateResourceException("Mobile number is already registered: " + request.getMobile());
            }
            user.setMobile(request.getMobile().trim());
        }

        user.setFullName(request.getFullName().trim());
        User updated = userRepository.save(user);

        auditLogService.log(userId, updated.getEmail(), AuditAction.PROFILE_UPDATE,
                "USER", userId.toString(), "User updated profile details", ipAddress);

        return DtoMapper.toUserProfileDto(updated);
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request, String ipAddress) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Current password does not match");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        auditLogService.log(userId, user.getEmail(), AuditAction.PASSWORD_CHANGE,
                "USER", userId.toString(), "User changed account password", ipAddress);

        notificationService.createNotification(userId, "Password Changed",
                "Your account password was updated successfully. If this wasn't you, contact support immediately.",
                NotificationType.SECURITY);
    }
}
