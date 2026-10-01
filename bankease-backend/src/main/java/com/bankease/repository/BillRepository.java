package com.bankease.repository;

import com.bankease.entity.Bill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BillRepository extends JpaRepository<Bill, Long> {
    Optional<Bill> findByBillerIdAndConsumerNumber(Long billerId, String consumerNumber);
    List<Bill> findByConsumerNumber(String consumerNumber);
}
