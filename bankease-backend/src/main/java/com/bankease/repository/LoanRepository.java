package com.bankease.repository;

import com.bankease.entity.Loan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LoanRepository extends JpaRepository<Loan, Long> {
    List<Loan> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<Loan> findByIdAndUserId(Long id, Long userId);
    Optional<Loan> findByLoanAccountNumber(String loanAccountNumber);
    boolean existsByLoanAccountNumber(String loanAccountNumber);
}
