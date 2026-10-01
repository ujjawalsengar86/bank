package com.bankease.mapper;

import com.bankease.dto.account.AccountResponseDto;
import com.bankease.dto.account.BalanceResponseDto;
import com.bankease.dto.admin.AdminUserStatusUpdateDto;
import com.bankease.dto.audit.AuditLogResponseDto;
import com.bankease.dto.auth.UserSummaryDto;
import com.bankease.dto.beneficiary.BeneficiaryResponseDto;
import com.bankease.dto.bill.BillPaymentResponseDto;
import com.bankease.dto.bill.BillResponseDto;
import com.bankease.dto.bill.BillerResponseDto;
import com.bankease.dto.investment.InvestmentProductDto;
import com.bankease.dto.investment.InvestmentResponseDto;
import com.bankease.dto.loan.LoanApplicationResponseDto;
import com.bankease.dto.loan.LoanPaymentResponseDto;
import com.bankease.dto.loan.LoanProductDto;
import com.bankease.dto.loan.LoanResponseDto;
import com.bankease.dto.notification.NotificationResponseDto;
import com.bankease.dto.transaction.TransactionResponseDto;
import com.bankease.dto.transfer.TransferResponseDto;
import com.bankease.dto.user.UserProfileDto;
import com.bankease.entity.*;

public final class DtoMapper {

    private DtoMapper() {}

    public static UserSummaryDto toUserSummaryDto(User user) {
        if (user == null) return null;
        return UserSummaryDto.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .mobile(user.getMobile())
                .role(user.getRole() != null ? user.getRole().name() : null)
                .kycStatus(user.getKycStatus() != null ? user.getKycStatus().name() : null)
                .accountStatus(user.getAccountStatus() != null ? user.getAccountStatus().name() : null)
                .build();
    }

    public static UserProfileDto toUserProfileDto(User user) {
        if (user == null) return null;
        return UserProfileDto.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .mobile(user.getMobile())
                .role(user.getRole() != null ? user.getRole().name() : null)
                .kycStatus(user.getKycStatus() != null ? user.getKycStatus().name() : null)
                .accountStatus(user.getAccountStatus() != null ? user.getAccountStatus().name() : null)
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    public static AccountResponseDto toAccountResponseDto(Account account) {
        if (account == null) return null;
        return AccountResponseDto.builder()
                .id(account.getId())
                .userId(account.getUser() != null ? account.getUser().getId() : null)
                .accountHolderName(account.getUser() != null ? account.getUser().getFullName() : null)
                .accountNumber(account.getAccountNumber())
                .accountType(account.getAccountType().name())
                .balance(account.getBalance())
                .currency(account.getCurrency())
                .status(account.getStatus().name())
                .createdAt(account.getCreatedAt())
                .build();
    }

    public static BalanceResponseDto toBalanceResponseDto(Account account) {
        if (account == null) return null;
        return BalanceResponseDto.builder()
                .accountId(account.getId())
                .accountNumber(account.getAccountNumber())
                .balance(account.getBalance())
                .currency(account.getCurrency())
                .build();
    }

    public static BeneficiaryResponseDto toBeneficiaryResponseDto(Beneficiary b) {
        if (b == null) return null;
        return BeneficiaryResponseDto.builder()
                .id(b.getId())
                .name(b.getName())
                .accountNumber(b.getAccountNumber())
                .bankName(b.getBankName())
                .ifscCode(b.getIfscCode())
                .status(b.getStatus().name())
                .createdAt(b.getCreatedAt())
                .build();
    }

    public static TransactionResponseDto toTransactionResponseDto(Transaction t) {
        if (t == null) return null;
        return TransactionResponseDto.builder()
                .id(t.getId())
                .referenceNumber(t.getReferenceNumber())
                .senderAccountId(t.getSenderAccount() != null ? t.getSenderAccount().getId() : null)
                .senderAccountNumber(t.getSenderAccount() != null ? t.getSenderAccount().getAccountNumber() : "EXTERNAL")
                .receiverAccountId(t.getReceiverAccount() != null ? t.getReceiverAccount().getId() : null)
                .receiverAccountNumber(t.getReceiverAccount() != null ? t.getReceiverAccount().getAccountNumber() : "EXTERNAL")
                .transactionType(t.getTransactionType().name())
                .amount(t.getAmount())
                .status(t.getStatus().name())
                .description(t.getDescription())
                .createdAt(t.getCreatedAt())
                .build();
    }

    public static TransferResponseDto toTransferResponseDto(Transaction t, Account sourceAccount, Beneficiary beneficiary) {
        return TransferResponseDto.builder()
                .referenceNumber(t.getReferenceNumber())
                .sourceAccountId(sourceAccount.getId())
                .sourceAccountNumber(sourceAccount.getAccountNumber())
                .beneficiaryName(beneficiary.getName())
                .beneficiaryAccountNumber(beneficiary.getAccountNumber())
                .amount(t.getAmount())
                .status(t.getStatus().name())
                .description(t.getDescription())
                .timestamp(t.getCreatedAt())
                .build();
    }

    public static BillerResponseDto toBillerResponseDto(Biller b) {
        if (b == null) return null;
        return BillerResponseDto.builder()
                .id(b.getId())
                .name(b.getName())
                .category(b.getCategory().name())
                .billerCode(b.getBillerCode())
                .description(b.getDescription())
                .active(b.isActive())
                .build();
    }

    public static BillResponseDto toBillResponseDto(Bill bill) {
        if (bill == null) return null;
        return BillResponseDto.builder()
                .id(bill.getId())
                .billerId(bill.getBiller().getId())
                .billerName(bill.getBiller().getName())
                .billerCategory(bill.getBiller().getCategory().name())
                .consumerNumber(bill.getConsumerNumber())
                .consumerName(bill.getConsumerName())
                .amount(bill.getAmount())
                .billDate(bill.getBillDate())
                .dueDate(bill.getDueDate())
                .status(bill.getStatus().name())
                .build();
    }

    public static BillPaymentResponseDto toBillPaymentResponseDto(BillPayment bp) {
        if (bp == null) return null;
        return BillPaymentResponseDto.builder()
                .receiptNumber(bp.getReceiptNumber())
                .billId(bp.getBill() != null ? bp.getBill().getId() : null)
                .billerName(bp.getBill() != null ? bp.getBill().getBiller().getName() : null)
                .consumerNumber(bp.getBill() != null ? bp.getBill().getConsumerNumber() : null)
                .amount(bp.getAmount())
                .paymentDate(bp.getPaymentDate())
                .sourceAccountNumber(bp.getAccount() != null ? bp.getAccount().getAccountNumber() : null)
                .transactionReference(bp.getTransaction() != null ? bp.getTransaction().getReferenceNumber() : null)
                .status("SUCCESS")
                .build();
    }

    public static LoanProductDto toLoanProductDto(LoanProduct lp) {
        if (lp == null) return null;
        return LoanProductDto.builder()
                .id(lp.getId())
                .name(lp.getName())
                .loanType(lp.getLoanType().name())
                .interestRate(lp.getInterestRate())
                .minAmount(lp.getMinAmount())
                .maxAmount(lp.getMaxAmount())
                .minTenureMonths(lp.getMinTenureMonths())
                .maxTenureMonths(lp.getMaxTenureMonths())
                .description(lp.getDescription())
                .active(lp.isActive())
                .build();
    }

    public static LoanApplicationResponseDto toLoanApplicationResponseDto(LoanApplication la, java.math.BigDecimal estimatedEmi) {
        if (la == null) return null;
        return LoanApplicationResponseDto.builder()
                .id(la.getId())
                .userId(la.getUser() != null ? la.getUser().getId() : null)
                .customerName(la.getUser() != null ? la.getUser().getFullName() : null)
                .loanProductId(la.getLoanProduct() != null ? la.getLoanProduct().getId() : null)
                .loanProductName(la.getLoanProduct() != null ? la.getLoanProduct().getName() : null)
                .loanType(la.getLoanProduct() != null ? la.getLoanProduct().getLoanType().name() : null)
                .requestedAmount(la.getRequestedAmount())
                .tenureMonths(la.getTenureMonths())
                .annualIncome(la.getAnnualIncome())
                .purpose(la.getPurpose())
                .status(la.getStatus().name())
                .rejectionReason(la.getRejectionReason())
                .estimatedEmi(estimatedEmi)
                .createdAt(la.getCreatedAt())
                .build();
    }

    public static LoanResponseDto toLoanResponseDto(Loan loan) {
        if (loan == null) return null;
        return LoanResponseDto.builder()
                .id(loan.getId())
                .loanAccountNumber(loan.getLoanAccountNumber())
                .loanProductId(loan.getLoanProduct() != null ? loan.getLoanProduct().getId() : null)
                .loanProductName(loan.getLoanProduct() != null ? loan.getLoanProduct().getName() : null)
                .loanType(loan.getLoanProduct() != null ? loan.getLoanProduct().getLoanType().name() : null)
                .principalAmount(loan.getPrincipalAmount())
                .interestRate(loan.getInterestRate())
                .tenureMonths(loan.getTenureMonths())
                .emiAmount(loan.getEmiAmount())
                .totalPayable(loan.getTotalPayable())
                .remainingBalance(loan.getRemainingBalance())
                .status(loan.getStatus().name())
                .startDate(loan.getStartDate())
                .endDate(loan.getEndDate())
                .disbursedAccountNumber(loan.getDisbursedAccount() != null ? loan.getDisbursedAccount().getAccountNumber() : null)
                .build();
    }

    public static LoanPaymentResponseDto toLoanPaymentResponseDto(LoanPayment lp) {
        if (lp == null) return null;
        return LoanPaymentResponseDto.builder()
                .receiptNumber(lp.getReceiptNumber())
                .loanId(lp.getLoan() != null ? lp.getLoan().getId() : null)
                .loanAccountNumber(lp.getLoan() != null ? lp.getLoan().getLoanAccountNumber() : null)
                .amount(lp.getAmount())
                .principalPortion(lp.getPrincipalPortion())
                .interestPortion(lp.getInterestPortion())
                .remainingBalance(lp.getLoan() != null ? lp.getLoan().getRemainingBalance() : null)
                .installmentNumber(lp.getInstallmentNumber())
                .paymentDate(lp.getPaymentDate())
                .transactionReference(lp.getTransaction() != null ? lp.getTransaction().getReferenceNumber() : null)
                .build();
    }

    public static InvestmentProductDto toInvestmentProductDto(InvestmentProduct ip) {
        if (ip == null) return null;
        return InvestmentProductDto.builder()
                .id(ip.getId())
                .name(ip.getName())
                .investmentType(ip.getInvestmentType().name())
                .interestRate(ip.getInterestRate())
                .minAmount(ip.getMinAmount())
                .minTenureMonths(ip.getMinTenureMonths())
                .description(ip.getDescription())
                .active(ip.isActive())
                .build();
    }

    public static InvestmentResponseDto toInvestmentResponseDto(Investment inv) {
        if (inv == null) return null;
        return InvestmentResponseDto.builder()
                .id(inv.getId())
                .investmentNumber(inv.getInvestmentNumber())
                .investmentProductId(inv.getInvestmentProduct() != null ? inv.getInvestmentProduct().getId() : null)
                .investmentProductName(inv.getInvestmentProduct() != null ? inv.getInvestmentProduct().getName() : null)
                .investmentType(inv.getInvestmentProduct() != null ? inv.getInvestmentProduct().getInvestmentType().name() : null)
                .investedAmount(inv.getInvestedAmount())
                .interestRate(inv.getInterestRate())
                .tenureMonths(inv.getTenureMonths())
                .expectedMaturityAmount(inv.getExpectedMaturityAmount())
                .currentValue(inv.getCurrentValue())
                .status(inv.getStatus().name())
                .startDate(inv.getStartDate())
                .maturityDate(inv.getMaturityDate())
                .sourceAccountNumber(inv.getSourceAccount() != null ? inv.getSourceAccount().getAccountNumber() : null)
                .createdAt(inv.getCreatedAt())
                .build();
    }

    public static NotificationResponseDto toNotificationResponseDto(Notification n) {
        if (n == null) return null;
        return NotificationResponseDto.builder()
                .id(n.getId())
                .title(n.getTitle())
                .message(n.getMessage())
                .type(n.getType().name())
                .read(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }

    public static AuditLogResponseDto toAuditLogResponseDto(AuditLog al) {
        if (al == null) return null;
        return AuditLogResponseDto.builder()
                .id(al.getId())
                .userId(al.getUserId())
                .userEmail(al.getUserEmail())
                .action(al.getAction().name())
                .entityType(al.getEntityType())
                .entityId(al.getEntityId())
                .description(al.getDescription())
                .ipAddress(al.getIpAddress())
                .createdAt(al.getCreatedAt())
                .build();
    }
}
