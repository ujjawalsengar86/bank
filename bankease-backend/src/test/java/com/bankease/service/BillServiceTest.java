package com.bankease.service;

import com.bankease.dto.bill.BillFetchRequestDto;
import com.bankease.dto.bill.BillPayRequestDto;
import com.bankease.dto.bill.BillPaymentResponseDto;
import com.bankease.dto.bill.BillResponseDto;
import com.bankease.entity.*;
import com.bankease.exception.InsufficientBalanceException;
import com.bankease.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BillServiceTest {

    @Mock
    private BillerRepository billerRepository;

    @Mock
    private BillRepository billRepository;

    @Mock
    private BillPaymentRepository billPaymentRepository;

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private BillService billService;

    private User customer;
    private Account customerAccount;
    private Biller electricityBiller;
    private Bill unpaidBill;

    @BeforeEach
    void setUp() {
        customer = User.builder().id(1L).fullName("Customer One").email("customer@bank.com").build();

        customerAccount = Account.builder()
                .id(10L)
                .user(customer)
                .accountNumber("100100123456")
                .balance(new BigDecimal("5000.00"))
                .status(AccountStatus.ACTIVE)
                .build();

        electricityBiller = Biller.builder()
                .id(1L)
                .name("Tata Power")
                .category(BillerCategory.ELECTRICITY)
                .billerCode("TP-MUM")
                .active(true)
                .build();

        unpaidBill = Bill.builder()
                .id(50L)
                .biller(electricityBiller)
                .consumerNumber("100827364")
                .consumerName("Customer One")
                .amount(new BigDecimal("1200.00"))
                .billDate(LocalDate.now().minusDays(5))
                .dueDate(LocalDate.now().plusDays(10))
                .status(BillStatus.UNPAID)
                .build();
    }

    @Test
    void testBillFetchSuccess() {
        BillFetchRequestDto request = new BillFetchRequestDto(1L, "100827364");
        when(billerRepository.findById(1L)).thenReturn(Optional.of(electricityBiller));
        when(billRepository.findByBillerIdAndConsumerNumber(1L, "100827364")).thenReturn(Optional.of(unpaidBill));

        BillResponseDto response = billService.fetchBill(request);

        assertNotNull(response);
        assertEquals("100827364", response.getConsumerNumber());
        assertEquals(new BigDecimal("1200.00"), response.getAmount());
        assertEquals("UNPAID", response.getStatus());
    }

    @Test
    void testBillPaymentSuccess() {
        BillPayRequestDto request = BillPayRequestDto.builder()
                .billId(50L)
                .sourceAccountId(10L)
                .amount(new BigDecimal("1200.00"))
                .build();

        when(accountRepository.findByIdWithLock(10L)).thenReturn(Optional.of(customerAccount));
        when(billRepository.findById(50L)).thenReturn(Optional.of(unpaidBill));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(i -> {
            Transaction t = i.getArgument(0);
            t.setId(300L);
            return t;
        });
        when(billPaymentRepository.save(any(BillPayment.class))).thenAnswer(i -> {
            BillPayment bp = i.getArgument(0);
            bp.setId(400L);
            return bp;
        });

        BillPaymentResponseDto receipt = billService.payBill(1L, request, "127.0.0.1");

        assertNotNull(receipt);
        assertEquals(new BigDecimal("1200.00"), receipt.getAmount());
        assertEquals("SUCCESS", receipt.getStatus());

        // Account balance debited: 5000 - 1200 = 3800
        assertEquals(new BigDecimal("3800.00"), customerAccount.getBalance());
        // Bill marked PAID
        assertEquals(BillStatus.PAID, unpaidBill.getStatus());

        verify(accountRepository, times(1)).save(customerAccount);
        verify(billRepository, times(1)).save(unpaidBill);
        verify(auditLogService, times(1)).log(any(), any(), any(), any(), any(), any(), any());
        verify(notificationService, times(1)).createNotification(any(), any(), any(), any());
    }

    @Test
    void testBillPaymentInsufficientBalanceThrowsException() {
        BillPayRequestDto request = BillPayRequestDto.builder()
                .billId(50L)
                .sourceAccountId(10L)
                .amount(new BigDecimal("8000.00")) // Account balance is only 5000
                .build();

        when(accountRepository.findByIdWithLock(10L)).thenReturn(Optional.of(customerAccount));

        assertThrows(InsufficientBalanceException.class, () -> billService.payBill(1L, request, "127.0.0.1"));
        assertEquals(new BigDecimal("5000.00"), customerAccount.getBalance());
        verify(billPaymentRepository, never()).save(any());
    }
}
