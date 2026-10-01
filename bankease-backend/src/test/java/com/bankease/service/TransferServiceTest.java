package com.bankease.service;

import com.bankease.dto.transfer.TransferRequestDto;
import com.bankease.dto.transfer.TransferResponseDto;
import com.bankease.entity.*;
import com.bankease.exception.BadRequestException;
import com.bankease.exception.ForbiddenException;
import com.bankease.exception.InsufficientBalanceException;
import com.bankease.repository.AccountRepository;
import com.bankease.repository.BeneficiaryRepository;
import com.bankease.repository.TransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TransferServiceTest {

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private BeneficiaryRepository beneficiaryRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private TransferService transferService;

    private User senderUser;
    private User receiverUser;
    private Account sourceAccount;
    private Account receiverAccount;
    private Beneficiary beneficiary;
    private TransferRequestDto transferRequest;

    @BeforeEach
    void setUp() {
        senderUser = User.builder().id(1L).fullName("Sender User").email("sender@bank.com").build();
        receiverUser = User.builder().id(2L).fullName("Receiver User").email("receiver@bank.com").build();

        sourceAccount = Account.builder()
                .id(10L)
                .user(senderUser)
                .accountNumber("100100123456")
                .balance(new BigDecimal("10000.00"))
                .status(AccountStatus.ACTIVE)
                .currency("INR")
                .build();

        receiverAccount = Account.builder()
                .id(20L)
                .user(receiverUser)
                .accountNumber("100200987654")
                .balance(new BigDecimal("2000.00"))
                .status(AccountStatus.ACTIVE)
                .currency("INR")
                .build();

        beneficiary = Beneficiary.builder()
                .id(5L)
                .user(senderUser)
                .name("Receiver User")
                .accountNumber("100200987654")
                .bankName("BankEase")
                .ifscCode("BKES0001001")
                .status(BeneficiaryStatus.ACTIVE)
                .build();

        transferRequest = TransferRequestDto.builder()
                .sourceAccountId(10L)
                .beneficiaryId(5L)
                .amount(new BigDecimal("1500.00"))
                .description("Monthly allowance")
                .build();
    }

    @Test
    void testSuccessfulFundTransfer() {
        when(accountRepository.findByIdWithLock(10L)).thenReturn(Optional.of(sourceAccount));
        when(beneficiaryRepository.findById(5L)).thenReturn(Optional.of(beneficiary));
        when(accountRepository.findByAccountNumberWithLock("100200987654")).thenReturn(Optional.of(receiverAccount));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> {
            Transaction t = invocation.getArgument(0);
            t.setId(100L);
            return t;
        });

        TransferResponseDto response = transferService.initiateTransfer(1L, transferRequest, "127.0.0.1");

        assertNotNull(response);
        assertEquals(new BigDecimal("1500.00"), response.getAmount());
        assertEquals("SUCCESS", response.getStatus());

        // Check sender balance debited
        assertEquals(new BigDecimal("8500.00"), sourceAccount.getBalance());
        // Check receiver balance credited
        assertEquals(new BigDecimal("3500.00"), receiverAccount.getBalance());

        verify(accountRepository, times(1)).save(sourceAccount);
        verify(accountRepository, times(1)).save(receiverAccount);
        verify(transactionRepository, times(1)).save(any(Transaction.class));
        verify(auditLogService, times(1)).log(any(), any(), any(), any(), any(), any(), any());
        verify(notificationService, times(2)).createNotification(any(), any(), any(), any());
    }

    @Test
    void testInsufficientBalanceThrowsException() {
        transferRequest.setAmount(new BigDecimal("50000.00")); // Balance is only 10,000
        when(accountRepository.findByIdWithLock(10L)).thenReturn(Optional.of(sourceAccount));
        when(beneficiaryRepository.findById(5L)).thenReturn(Optional.of(beneficiary));

        assertThrows(InsufficientBalanceException.class,
                () -> transferService.initiateTransfer(1L, transferRequest, "127.0.0.1"));

        // Source account balance untouched
        assertEquals(new BigDecimal("10000.00"), sourceAccount.getBalance());
        verify(transactionRepository, never()).save(any());
    }

    @Test
    void testZeroOrNegativeAmountThrowsException() {
        transferRequest.setAmount(BigDecimal.ZERO);

        assertThrows(BadRequestException.class,
                () -> transferService.initiateTransfer(1L, transferRequest, "127.0.0.1"));

        transferRequest.setAmount(new BigDecimal("-100.00"));
        assertThrows(BadRequestException.class,
                () -> transferService.initiateTransfer(1L, transferRequest, "127.0.0.1"));

        verify(accountRepository, never()).findByIdWithLock(any());
    }

    @Test
    void testSourceAccountNotBelongingToUserThrowsForbidden() {
        when(accountRepository.findByIdWithLock(10L)).thenReturn(Optional.of(sourceAccount));

        // Authenticated user ID is 99, but account belongs to user ID 1
        assertThrows(ForbiddenException.class,
                () -> transferService.initiateTransfer(99L, transferRequest, "127.0.0.1"));
    }

    @Test
    void testBeneficiaryNotBelongingToUserThrowsForbidden() {
        when(accountRepository.findByIdWithLock(10L)).thenReturn(Optional.of(sourceAccount));

        Beneficiary otherUserBeneficiary = Beneficiary.builder()
                .id(5L)
                .user(receiverUser) // belongs to receiverUser (ID 2), not senderUser (ID 1)
                .name("Hacker")
                .accountNumber("999999999")
                .status(BeneficiaryStatus.ACTIVE)
                .build();

        when(beneficiaryRepository.findById(5L)).thenReturn(Optional.of(otherUserBeneficiary));

        assertThrows(ForbiddenException.class,
                () -> transferService.initiateTransfer(1L, transferRequest, "127.0.0.1"));
    }
}
