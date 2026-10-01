package com.bankease.repository;

import com.bankease.entity.Investment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvestmentRepository extends JpaRepository<Investment, Long> {
    List<Investment> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<Investment> findByIdAndUserId(Long id, Long userId);
    Optional<Investment> findByInvestmentNumber(String investmentNumber);
    boolean existsByInvestmentNumber(String investmentNumber);
}
