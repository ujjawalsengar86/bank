package com.bankease.repository;

import com.bankease.entity.LoanPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LoanPaymentRepository extends JpaRepository<LoanPayment, Long> {
    List<LoanPayment> findByLoanIdOrderByPaymentDateDesc(Long loanId);
    List<LoanPayment> findByLoanUserIdOrderByPaymentDateDesc(Long userId);
    Optional<LoanPayment> findByReceiptNumber(String receiptNumber);
}
