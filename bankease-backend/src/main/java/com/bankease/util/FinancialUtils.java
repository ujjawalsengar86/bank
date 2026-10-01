package com.bankease.util;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.security.SecureRandom;

public final class FinancialUtils {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final MathContext MC = new MathContext(10, RoundingMode.HALF_UP);

    private FinancialUtils() {}

    /**
     * Calculates monthly Equated Monthly Installment (EMI) using the standard formula:
     * EMI = [P x r x (1+r)^n] / [(1+r)^n - 1]
     * where:
     * P = principal loan amount
     * r = monthly interest rate (annual rate / 12 / 100)
     * n = tenure in months
     */
    public static BigDecimal calculateEmi(BigDecimal principal, BigDecimal annualInterestRate, int tenureMonths) {
        if (principal == null || principal.compareTo(BigDecimal.ZERO) <= 0 || tenureMonths <= 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        if (annualInterestRate == null || annualInterestRate.compareTo(BigDecimal.ZERO) == 0) {
            return principal.divide(BigDecimal.valueOf(tenureMonths), 2, RoundingMode.HALF_UP);
        }

        double p = principal.doubleValue();
        double annualRate = annualInterestRate.doubleValue();
        double r = (annualRate / 100.0) / 12.0;
        int n = tenureMonths;

        double emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        return BigDecimal.valueOf(emi).setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Calculates estimated maturity amount for investments with monthly compounding:
     * A = P * (1 + r/12)^n
     */
    public static BigDecimal calculateInvestmentMaturity(BigDecimal principal, BigDecimal annualInterestRate, int tenureMonths) {
        if (principal == null || principal.compareTo(BigDecimal.ZERO) <= 0 || tenureMonths <= 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        if (annualInterestRate == null || annualInterestRate.compareTo(BigDecimal.ZERO) == 0) {
            return principal.setScale(2, RoundingMode.HALF_UP);
        }

        double p = principal.doubleValue();
        double annualRate = annualInterestRate.doubleValue();
        double r = (annualRate / 100.0) / 12.0;
        int n = tenureMonths;

        double maturity = p * Math.pow(1 + r, n);
        return BigDecimal.valueOf(maturity).setScale(2, RoundingMode.HALF_UP);
    }

    public static String generateAccountNumber() {
        // 12 digit account number starting with 100
        long rand = 100_000_000L + (long)(RANDOM.nextDouble() * 900_000_000L);
        return "100" + rand;
    }

    public static String generateTransactionReference() {
        return "TXN" + System.currentTimeMillis() + String.format("%04d", RANDOM.nextInt(10000));
    }

    public static String generateReceiptNumber() {
        return "RCP" + System.currentTimeMillis() + String.format("%04d", RANDOM.nextInt(10000));
    }

    public static String generateLoanAccountNumber() {
        return "LN" + System.currentTimeMillis() + String.format("%03d", RANDOM.nextInt(1000));
    }

    public static String generateInvestmentNumber() {
        return "INV" + System.currentTimeMillis() + String.format("%03d", RANDOM.nextInt(1000));
    }
}
