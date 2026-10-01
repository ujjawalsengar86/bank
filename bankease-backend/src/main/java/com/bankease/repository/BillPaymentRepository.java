package com.bankease.repository;

import com.bankease.entity.BillPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BillPaymentRepository extends JpaRepository<BillPayment, Long> {
    List<BillPayment> findByAccountUserIdOrderByPaymentDateDesc(Long userId);
    Optional<BillPayment> findByReceiptNumber(String receiptNumber);
}
