package com.bankease.service;

import com.bankease.dto.auth.AuthResponse;
import com.bankease.dto.auth.LoginRequest;
import com.bankease.dto.auth.RegisterRequest;
import com.bankease.dto.auth.UserSummaryDto;
import com.bankease.entity.KycStatus;
import com.bankease.entity.Role;
import com.bankease.entity.User;
import com.bankease.entity.UserStatus;
import com.bankease.exception.DuplicateResourceException;
import com.bankease.repository.AccountRepository;
import com.bankease.repository.UserRepository;
import com.bankease.security.JwtTokenProvider;
import com.bankease.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtTokenProvider tokenProvider;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private AuthService authService;

    private RegisterRequest registerRequest;
    private LoginRequest loginRequest;
    private User testUser;

    @BeforeEach
    void setUp() {
        registerRequest = RegisterRequest.builder()
                .fullName("Alice Wonderland")
                .email("alice@example.com")
                .mobile("9123456789")
                .password("Password@123")
                .build();

        loginRequest = LoginRequest.builder()
                .email("alice@example.com")
                .password("Password@123")
                .build();

        testUser = User.builder()
                .id(1L)
                .fullName("Alice Wonderland")
                .email("alice@example.com")
                .mobile("9123456789")
                .passwordHash("encodedPassword")
                .role(Role.CUSTOMER)
                .kycStatus(KycStatus.VERIFIED)
                .accountStatus(UserStatus.ACTIVE)
                .build();
    }

    @Test
    void testRegistrationSuccess() {
        when(userRepository.existsByEmail("alice@example.com")).thenReturn(false);
        when(userRepository.existsByMobile("9123456789")).thenReturn(false);
        when(passwordEncoder.encode("Password@123")).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        UserSummaryDto result = authService.register(registerRequest, "127.0.0.1");

        assertNotNull(result);
        assertEquals("alice@example.com", result.getEmail());
        assertEquals("CUSTOMER", result.getRole());
        verify(userRepository, times(1)).save(any(User.class));
        verify(accountRepository, times(1)).save(any());
        verify(auditLogService, times(1)).log(any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void testRegistrationDuplicateEmailThrowsException() {
        when(userRepository.existsByEmail("alice@example.com")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> authService.register(registerRequest, "127.0.0.1"));
        verify(userRepository, never()).save(any());
    }

    @Test
    void testRegistrationDuplicateMobileThrowsException() {
        when(userRepository.existsByEmail("alice@example.com")).thenReturn(false);
        when(userRepository.existsByMobile("9123456789")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> authService.register(registerRequest, "127.0.0.1"));
        verify(userRepository, never()).save(any());
    }

    @Test
    void testLoginSuccess() {
        Authentication auth = mock(Authentication.class);
        UserPrincipal principal = UserPrincipal.create(testUser);
        when(auth.getPrincipal()).thenReturn(principal);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(auth);
        when(tokenProvider.generateToken(auth)).thenReturn("sample.jwt.token");
        when(tokenProvider.getExpirationMs()).thenReturn(86400000L);

        AuthResponse response = authService.login(loginRequest, "127.0.0.1");

        assertNotNull(response);
        assertEquals("sample.jwt.token", response.getAccessToken());
        assertEquals("Bearer", response.getTokenType());
        assertEquals("alice@example.com", response.getUser().getEmail());
        verify(auditLogService, times(1)).log(any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void testLoginInvalidCredentialsThrowsException() {
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        assertThrows(BadCredentialsException.class, () -> authService.login(loginRequest, "127.0.0.1"));
    }
}
