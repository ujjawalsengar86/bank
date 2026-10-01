package com.bankease.service;

import com.bankease.dto.auth.AuthResponse;
import com.bankease.dto.auth.LoginRequest;
import com.bankease.dto.auth.RegisterRequest;
import com.bankease.dto.auth.UserSummaryDto;
import com.bankease.entity.*;
import com.bankease.exception.DuplicateResourceException;
import com.bankease.mapper.DtoMapper;
import com.bankease.repository.AccountRepository;
import com.bankease.repository.UserRepository;
import com.bankease.security.JwtTokenProvider;
import com.bankease.security.UserPrincipal;
import com.bankease.util.FinancialUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    @Transactional
    public UserSummaryDto register(RegisterRequest request, String ipAddress) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email is already registered: " + request.getEmail());
        }
        if (userRepository.existsByMobile(request.getMobile())) {
            throw new DuplicateResourceException("Mobile number is already registered: " + request.getMobile());
        }

        User user = User.builder()
                .fullName(request.getFullName().trim())
                .email(request.getEmail().trim().toLowerCase())
                .mobile(request.getMobile().trim())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(Role.CUSTOMER)
                .kycStatus(KycStatus.VERIFIED)
                .accountStatus(UserStatus.ACTIVE)
                .build();

        User savedUser = userRepository.save(user);

        // Automatically create initial Savings account with welcome bonus balance
        Account initialAccount = Account.builder()
                .user(savedUser)
                .accountNumber(FinancialUtils.generateAccountNumber())
                .accountType(AccountType.SAVINGS)
                .balance(new BigDecimal("10000.00"))
                .currency("INR")
                .status(AccountStatus.ACTIVE)
                .build();
        accountRepository.save(initialAccount);

        auditLogService.log(savedUser.getId(), savedUser.getEmail(), AuditAction.REGISTER,
                "USER", savedUser.getId().toString(), "User registered successfully", ipAddress);

        notificationService.createNotification(savedUser.getId(), "Welcome to BankEase!",
                "Your net banking account has been created. A savings account with ₹10,000 opening balance is ready.",
                NotificationType.ACCOUNT);

        return DtoMapper.toUserSummaryDto(savedUser);
    }

    @Transactional
    public AuthResponse login(LoginRequest request, String ipAddress) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail().trim().toLowerCase(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();

        auditLogService.log(principal.getId(), principal.getUsername(), AuditAction.LOGIN,
                "USER", principal.getId().toString(), "User logged in successfully", ipAddress);

        notificationService.createNotification(principal.getId(), "Login Notification",
                "You have successfully logged in to BankEase.", NotificationType.SECURITY);

        UserSummaryDto userSummary = UserSummaryDto.builder()
                .id(principal.getId())
                .fullName(principal.getFullName())
                .email(principal.getUsername())
                .role(principal.getRole().name())
                .accountStatus(principal.getAccountStatus().name())
                .build();

        return AuthResponse.builder()
                .accessToken(jwt)
                .tokenType("Bearer")
                .expiresIn(tokenProvider.getExpirationMs() / 1000)
                .user(userSummary)
                .build();
    }
}
