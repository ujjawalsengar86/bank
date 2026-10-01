package com.bankease.repository;

import com.bankease.entity.Biller;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BillerRepository extends JpaRepository<Biller, Long> {
    List<Biller> findByActiveTrue();
    Optional<Biller> findByBillerCode(String billerCode);
}
