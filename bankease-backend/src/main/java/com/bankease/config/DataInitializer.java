package com.bankease.config;

import com.bankease.entity.*;
import com.bankease.repository.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Configuration
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final BeneficiaryRepository beneficiaryRepository;
    private final LoanProductRepository loanProductRepository;
    private final BillerRepository billerRepository;
    private final BillRepository billRepository;
    private final InvestmentProductRepository investmentProductRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.count() > 0) {
            logger.info("Database already contains data, skipping seed runner.");
            return;
        }

        logger.info("Seeding development data for BankEase backend...");

        // 1. Seed Users
        User customer1 = User.builder()
                .fullName("John Doe")
                .email("customer@bankease.com")
                .mobile("9876543210")
                .passwordHash(passwordEncoder.encode("Customer@123"))
                .role(Role.CUSTOMER)
                .kycStatus(KycStatus.VERIFIED)
                .accountStatus(UserStatus.ACTIVE)
                .build();

        User customer2 = User.builder()
                .fullName("Sarah Jenkins")
                .email("sarah@bankease.com")
                .mobile("9876543211")
                .passwordHash(passwordEncoder.encode("Customer@123"))
                .role(Role.CUSTOMER)
                .kycStatus(KycStatus.VERIFIED)
                .accountStatus(UserStatus.ACTIVE)
                .build();

        User officer = User.builder()
                .fullName("Robert Vance")
                .email("officer@bankease.com")
                .mobile("9876543212")
                .passwordHash(passwordEncoder.encode("Officer@123"))
                .role(Role.BANK_OFFICER)
                .kycStatus(KycStatus.VERIFIED)
                .accountStatus(UserStatus.ACTIVE)
                .build();

        User admin = User.builder()
                .fullName("System Administrator")
                .email("admin@bankease.com")
                .mobile("9876543213")
                .passwordHash(passwordEncoder.encode("Admin@123"))
                .role(Role.ADMIN)
                .kycStatus(KycStatus.VERIFIED)
                .accountStatus(UserStatus.ACTIVE)
                .build();

        userRepository.saveAll(List.of(customer1, customer2, officer, admin));

        // 2. Seed Accounts
        Account johnSavings = Account.builder()
                .user(customer1)
                .accountNumber("100100123456")
                .accountType(AccountType.SAVINGS)
                .balance(new BigDecimal("75000.00"))
                .currency("INR")
                .status(AccountStatus.ACTIVE)
                .build();

        Account johnCurrent = Account.builder()
                .user(customer1)
                .accountNumber("100100123457")
                .accountType(AccountType.CURRENT)
                .balance(new BigDecimal("250000.00"))
                .currency("INR")
                .status(AccountStatus.ACTIVE)
                .build();

        Account sarahSavings = Account.builder()
                .user(customer2)
                .accountNumber("100200987654")
                .accountType(AccountType.SAVINGS)
                .balance(new BigDecimal("50000.00"))
                .currency("INR")
                .status(AccountStatus.ACTIVE)
                .build();

        Account officerSavings = Account.builder()
                .user(officer)
                .accountNumber("100300555666")
                .accountType(AccountType.SAVINGS)
                .balance(new BigDecimal("35000.00"))
                .currency("INR")
                .status(AccountStatus.ACTIVE)
                .build();

        accountRepository.saveAll(List.of(johnSavings, johnCurrent, sarahSavings, officerSavings));

        // 3. Seed Beneficiary for John pointing to Sarah
        Beneficiary sarahBeneficiary = Beneficiary.builder()
                .user(customer1)
                .name("Sarah Jenkins")
                .accountNumber("100200987654")
                .bankName("BankEase Bank")
                .ifscCode("BKES0001001")
                .status(BeneficiaryStatus.ACTIVE)
                .build();

        beneficiaryRepository.save(sarahBeneficiary);

        // 4. Seed Loan Products
        LoanProduct personalLoan = LoanProduct.builder()
                .name("Personal Loan")
                .loanType(LoanType.PERSONAL)
                .interestRate(new BigDecimal("10.50"))
                .minAmount(new BigDecimal("10000.00"))
                .maxAmount(new BigDecimal("1000000.00"))
                .minTenureMonths(6)
                .maxTenureMonths(60)
                .description("Instant personal loan for medical, travel, or emergency personal needs")
                .active(true)
                .build();

        LoanProduct homeLoan = LoanProduct.builder()
                .name("Home Loan")
                .loanType(LoanType.HOME)
                .interestRate(new BigDecimal("8.40"))
                .minAmount(new BigDecimal("500000.00"))
                .maxAmount(new BigDecimal("20000000.00"))
                .minTenureMonths(12)
                .maxTenureMonths(360)
                .description("Affordable home loans with low interest rates and flexible repayment")
                .active(true)
                .build();

        LoanProduct educationLoan = LoanProduct.builder()
                .name("Education Loan")
                .loanType(LoanType.EDUCATION)
                .interestRate(new BigDecimal("9.00"))
                .minAmount(new BigDecimal("50000.00"))
                .maxAmount(new BigDecimal("3000000.00"))
                .minTenureMonths(12)
                .maxTenureMonths(120)
                .description("Comprehensive funding for higher education in India and abroad")
                .active(true)
                .build();

        LoanProduct vehicleLoan = LoanProduct.builder()
                .name("Vehicle Loan")
                .loanType(LoanType.VEHICLE)
                .interestRate(new BigDecimal("9.50"))
                .minAmount(new BigDecimal("50000.00"))
                .maxAmount(new BigDecimal("2500000.00"))
                .minTenureMonths(12)
                .maxTenureMonths(84)
                .description("Drive your dream car or two-wheeler with quick financing")
                .active(true)
                .build();

        loanProductRepository.saveAll(List.of(personalLoan, homeLoan, educationLoan, vehicleLoan));

        // 5. Seed Billers
        Biller electricityBiller = Biller.builder()
                .name("Tata Power Mumbai")
                .category(BillerCategory.ELECTRICITY)
                .billerCode("TP-MUM")
                .description("Electricity distribution and utility services")
                .active(true)
                .build();

        Biller waterBiller = Biller.builder()
                .name("Municipal Water Supply Board")
                .category(BillerCategory.WATER)
                .billerCode("MC-WAT")
                .description("Municipal drinking and household water utility")
                .active(true)
                .build();

        Biller mobileBiller = Biller.builder()
                .name("Airtel Postpaid")
                .category(BillerCategory.MOBILE)
                .billerCode("AIR-MOB")
                .description("Cellular and 5G postpaid telecom connections")
                .active(true)
                .build();

        Biller internetBiller = Biller.builder()
                .name("JioFiber Broadband")
                .category(BillerCategory.INTERNET)
                .billerCode("JIO-NET")
                .description("High speed FTTH fiber broadband internet")
                .active(true)
                .build();

        billerRepository.saveAll(List.of(electricityBiller, waterBiller, mobileBiller, internetBiller));

        // 6. Seed Sample Unpaid Bills
        Bill electricBill = Bill.builder()
                .biller(electricityBiller)
                .consumerNumber("100827364")
                .consumerName("John Doe")
                .amount(new BigDecimal("2140.50"))
                .billDate(LocalDate.now().minusDays(10))
                .dueDate(LocalDate.now().plusDays(10))
                .status(BillStatus.UNPAID)
                .build();

        Bill waterBill = Bill.builder()
                .biller(waterBiller)
                .consumerNumber("WAT-99214")
                .consumerName("John Doe")
                .amount(new BigDecimal("480.00"))
                .billDate(LocalDate.now().minusDays(15))
                .dueDate(LocalDate.now().plusDays(5))
                .status(BillStatus.UNPAID)
                .build();

        billRepository.saveAll(List.of(electricBill, waterBill));

        // 7. Seed Investment Products
        InvestmentProduct fd = InvestmentProduct.builder()
                .name("BankEase Prime Fixed Deposit")
                .investmentType(InvestmentType.FIXED_DEPOSIT)
                .interestRate(new BigDecimal("7.25"))
                .minAmount(new BigDecimal("10000.00"))
                .minTenureMonths(6)
                .description("Guaranteed returns with quarterly compounding interest")
                .active(true)
                .build();

        InvestmentProduct rd = InvestmentProduct.builder()
                .name("BankEase Recurring Deposit")
                .investmentType(InvestmentType.RECURRING_DEPOSIT)
                .interestRate(new BigDecimal("6.85"))
                .minAmount(new BigDecimal("1000.00"))
                .minTenureMonths(12)
                .description("Systematic monthly savings with attractive interest rates")
                .active(true)
                .build();

        InvestmentProduct mf = InvestmentProduct.builder()
                .name("NextGen Bluechip Flexi Mutual Fund")
                .investmentType(InvestmentType.MUTUAL_FUND)
                .interestRate(new BigDecimal("12.50"))
                .minAmount(new BigDecimal("5000.00"))
                .minTenureMonths(12)
                .description("Diversified equity fund targeting consistent capital appreciation")
                .active(true)
                .build();

        investmentProductRepository.saveAll(List.of(fd, rd, mf));

        logger.info("Seed data successfully initialized!");
    }
}
