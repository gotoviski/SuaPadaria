package com.backend.service;

import java.util.List;

import com.backend.dto.ForgotPasswordRequest;
import com.backend.dto.LoginRequest;
import com.backend.dto.RegisterRequest;
import com.backend.dto.ResetPasswordRequest;
import com.backend.dto.UpdateUserRequest;
import com.backend.dto.UserResponse;

public interface UserService {

	UserResponse register(RegisterRequest request);

	UserResponse login(LoginRequest request);

	void forgotPassword(ForgotPasswordRequest request);

	void resetPassword(ResetPasswordRequest request);

	List<UserResponse> findAll();

	UserResponse findById(Long id);

	UserResponse update(Long id, UpdateUserRequest request);

	void delete(Long id);

}
