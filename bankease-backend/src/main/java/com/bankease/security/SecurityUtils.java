package com.bankease.security;

import com.bankease.entity.Role;
import com.bankease.exception.UnauthorizedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityUtils {

    private SecurityUtils() {
    }

    public static UserPrincipal getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || !(authentication.getPrincipal() instanceof UserPrincipal)) {
            throw new UnauthorizedException("User is not authenticated");
        }
        return (UserPrincipal) authentication.getPrincipal();
    }

    public static Long getCurrentUserId() {
        return getCurrentUser().getId();
    }

    public static String getCurrentUserEmail() {
        return getCurrentUser().getUsername();
    }

    public static Role getCurrentUserRole() {
        return getCurrentUser().getRole();
    }

    public static boolean hasRole(Role role) {
        try {
            return getCurrentUser().getRole() == role;
        } catch (UnauthorizedException ex) {
            return false;
        }
    }

    public static boolean isCustomer() {
        return hasRole(Role.CUSTOMER);
    }

    public static boolean isBankOfficer() {
        return hasRole(Role.BANK_OFFICER);
    }

    public static boolean isAdmin() {
        return hasRole(Role.ADMIN);
    }
}
