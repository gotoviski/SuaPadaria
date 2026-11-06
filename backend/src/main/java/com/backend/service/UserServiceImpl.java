package com.backend.service;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.backend.dto.ForgotPasswordRequest;
import com.backend.dto.LoginRequest;
import com.backend.dto.RegisterRequest;
import com.backend.dto.ResetPasswordRequest;
import com.backend.dto.UpdateUserRequest;
import com.backend.dto.UserResponse;
import com.backend.entity.AccessProfile;
import com.backend.entity.PasswordResetToken;
import com.backend.entity.User;
import com.backend.repository.AccessProfileRepository;
import com.backend.repository.PasswordResetTokenRepository;
import com.backend.repository.UserRepository;

@Service
@Transactional
public class UserServiceImpl implements UserService {

	private static final Duration RESET_TOKEN_TTL = Duration.ofMinutes(10);

	private final UserRepository userRepository;
	private final PasswordResetTokenRepository tokenRepository;
	private final AccessProfileRepository profileRepository;
	private final PasswordEncoder passwordEncoder;
	private final SmsService smsService;
	private final SecureRandom random = new SecureRandom();

	public UserServiceImpl(UserRepository userRepository, PasswordResetTokenRepository tokenRepository,
			AccessProfileRepository profileRepository, PasswordEncoder passwordEncoder, SmsService smsService) {
		this.userRepository = userRepository;
		this.tokenRepository = tokenRepository;
		this.profileRepository = profileRepository;
		this.passwordEncoder = passwordEncoder;
		this.smsService = smsService;
	}

	@Override
	public UserResponse register(RegisterRequest request) {
		if (userRepository.existsByEmail(request.email())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "E-mail já cadastrado");
		}
		User user = new User();
		user.setName(request.name());
		user.setEmail(request.email());
		user.setPhone(request.phone());
		user.setPassword(passwordEncoder.encode(request.password()));
		return UserResponse.from(userRepository.save(user));
	}

	@Override
	public UserResponse login(LoginRequest request) {
		User user = userRepository.findByEmail(request.email())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciais inválidas"));
		if (!passwordEncoder.matches(request.password(), user.getPassword())) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciais inválidas");
		}
		return UserResponse.from(user);
	}

	@Override
	public void forgotPassword(ForgotPasswordRequest request) {
		userRepository.findByEmail(request.email()).ifPresent(user -> {
			tokenRepository.findByUserAndUsedFalse(user).forEach(t -> t.setUsed(true));
			String code = String.format("%06d", random.nextInt(1_000_000));
			PasswordResetToken token = new PasswordResetToken();
			token.setUser(user);
			token.setCode(code);
			token.setExpiresAt(Instant.now().plus(RESET_TOKEN_TTL));
			tokenRepository.save(token);
			smsService.send(user.getPhone(), "SuaPadaria: seu código de recuperação de senha é " + code);
		});
	}

	@Override
	public void resetPassword(ResetPasswordRequest request) {
		PasswordResetToken token = tokenRepository
				.findTopByUserEmailAndUsedFalseOrderByExpiresAtDesc(request.email())
				.filter(t -> t.isValid() && t.getCode().equals(request.code()))
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Código inválido ou expirado"));
		token.setUsed(true);
		User user = token.getUser();
		user.setPassword(passwordEncoder.encode(request.newPassword()));
		userRepository.save(user);
	}

	@Override
	@Transactional(readOnly = true)
	public List<UserResponse> findAll() {
		return userRepository.findAll().stream().map(UserResponse::from).toList();
	}

	@Override
	@Transactional(readOnly = true)
	public UserResponse findById(Long id) {
		return UserResponse.from(getUser(id));
	}

	@Override
	public UserResponse update(Long id, UpdateUserRequest request) {
		User user = getUser(id);
		if (request.name() != null && !request.name().isBlank()) {
			user.setName(request.name());
		}
		if (request.phone() != null && !request.phone().isBlank()) {
			user.setPhone(request.phone());
		}
		if (request.email() != null && !request.email().equals(user.getEmail())) {
			if (userRepository.existsByEmail(request.email())) {
				throw new ResponseStatusException(HttpStatus.CONFLICT, "E-mail já cadastrado");
			}
			user.setEmail(request.email());
		}
		if (request.password() != null && !request.password().isBlank()) {
			user.setPassword(passwordEncoder.encode(request.password()));
		}
		return UserResponse.from(userRepository.save(user));
	}

	@Override
	public UserResponse assignProfile(Long id, Long profileId) {
		User user = getUser(id);
		if (profileId == null) {
			user.setAccessProfile(null);
		} else {
			AccessProfile profile = profileRepository.findById(profileId)
					.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
							"Perfil de acesso não encontrado"));
			user.setAccessProfile(profile);
		}
		return UserResponse.from(userRepository.save(user));
	}

	@Override
	public void delete(Long id) {
		userRepository.delete(getUser(id));
	}

	private User getUser(Long id) {
		return userRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado"));
	}

}
