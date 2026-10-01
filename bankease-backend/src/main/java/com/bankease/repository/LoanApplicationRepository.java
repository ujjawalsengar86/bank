package com.bankease.repository;

import com.bankease.entity.LoanApplication;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LoanApplicationRepository extends JpaRepository<LoanApplication, Long> {
    List<LoanApplication> findByUserIdOrderByCreatedAtDesc(Long userId);
    Page<LoanApplication> findAllByOrderByCreatedAtDesc(Pageable pageable);
    Optional<LoanApplication> findByIdAndUserId(Long id, Long userId);
}
