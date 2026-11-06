package com.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.backend.entity.PasswordResetToken;
import com.backend.entity.User;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

	Optional<PasswordResetToken> findTopByUserEmailAndUsedFalseOrderByExpiresAtDesc(String email);

	List<PasswordResetToken> findByUserAndUsedFalse(User user);

}
