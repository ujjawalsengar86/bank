package com.bankease.service;

import com.bankease.dto.account.AccountResponseDto;
import com.bankease.entity.Account;
import com.bankease.entity.AccountStatus;
import com.bankease.entity.AccountType;
import com.bankease.entity.User;
import com.bankease.exception.ForbiddenException;
import com.bankease.repository.AccountRepository;
import com.bankease.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AccountServiceTest {

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AccountService accountService;

    private User owner;
    private User otherUser;
    private Account account;

    @BeforeEach
    void setUp() {
        owner = User.builder().id(1L).fullName("Owner User").email("owner@bank.com").build();
        otherUser = User.builder().id(2L).fullName("Other User").email("other@bank.com").build();

        account = Account.builder()
                .id(10L)
                .user(owner)
                .accountNumber("100100123456")
                .accountType(AccountType.SAVINGS)
                .balance(new BigDecimal("5000.00"))
                .currency("INR")
                .status(AccountStatus.ACTIVE)
                .build();
    }

    @Test
    void testCustomerCanAccessOwnAccount() {
        when(accountRepository.findById(10L)).thenReturn(Optional.of(account));

        AccountResponseDto result = accountService.getAccountById(10L, 1L, false);

        assertNotNull(result);
        assertEquals("100100123456", result.getAccountNumber());
        assertEquals(new BigDecimal("5000.00"), result.getBalance());
    }

    @Test
    void testCustomerCannotAccessAnotherCustomerAccount() {
        when(accountRepository.findById(10L)).thenReturn(Optional.of(account));

        // User ID 2 attempting to view Account belonging to User ID 1 without admin/officer rights
        assertThrows(ForbiddenException.class, () -> accountService.getAccountById(10L, 2L, false));
    }

    @Test
    void testAdminCanAccessAnyCustomerAccount() {
        when(accountRepository.findById(10L)).thenReturn(Optional.of(account));

        AccountResponseDto result = accountService.getAccountById(10L, 2L, true);

        assertNotNull(result);
        assertEquals("100100123456", result.getAccountNumber());
    }
}
