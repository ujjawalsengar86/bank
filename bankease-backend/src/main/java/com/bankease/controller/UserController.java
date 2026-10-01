package com.bankease.controller;

import com.bankease.dto.common.ApiResponse;
import com.bankease.dto.user.ChangePasswordRequest;
import com.bankease.dto.user.UserProfileDto;
import com.bankease.dto.user.UserUpdateRequest;
import com.bankease.security.SecurityUtils;
import com.bankease.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "User Profile", description = "Endpoints for managing user profile and credentials")
@SecurityRequirement(name = "BearerAuth")
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    @Operation(summary = "Get currently authenticated user's profile")
    public ResponseEntity<ApiResponse<UserProfileDto>> getMyProfile() {
        Long userId = SecurityUtils.getCurrentUserId();
        UserProfileDto profile = userService.getProfile(userId);
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @PutMapping("/me")
    @Operation(summary = "Update authenticated user's profile details")
    public ResponseEntity<ApiResponse<UserProfileDto>> updateMyProfile(
            @Valid @RequestBody UserUpdateRequest request,
            HttpServletRequest servletRequest) {
        Long userId = SecurityUtils.getCurrentUserId();
        UserProfileDto profile = userService.updateProfile(userId, request, servletRequest.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", profile));
    }

    @PutMapping("/me/password")
    @Operation(summary = "Change password for the authenticated user")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            HttpServletRequest servletRequest) {
        Long userId = SecurityUtils.getCurrentUserId();
        userService.changePassword(userId, request, servletRequest.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully", null));
    }
}
