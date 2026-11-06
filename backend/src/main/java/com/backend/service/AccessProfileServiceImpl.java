package com.backend.service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.backend.dto.AccessProfileRequest;
import com.backend.dto.AccessProfileResponse;
import com.backend.entity.AccessProfile;
import com.backend.entity.Permission;
import com.backend.repository.AccessProfileRepository;
import com.backend.repository.UserRepository;

@Service
@Transactional
public class AccessProfileServiceImpl implements AccessProfileService {

	private final AccessProfileRepository profileRepository;
	private final UserRepository userRepository;

	public AccessProfileServiceImpl(AccessProfileRepository profileRepository, UserRepository userRepository) {
		this.profileRepository = profileRepository;
		this.userRepository = userRepository;
	}

	@Override
	@Transactional(readOnly = true)
	public List<AccessProfileResponse> findAll() {
		return profileRepository.findAll(Sort.by("name")).stream().map(AccessProfileResponse::from).toList();
	}

	@Override
	@Transactional(readOnly = true)
	public AccessProfileResponse findById(Long id) {
		return AccessProfileResponse.from(getProfile(id));
	}

	@Override
	public AccessProfileResponse create(AccessProfileRequest request) {
		if (profileRepository.existsByName(request.name())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Nome de perfil já cadastrado");
		}
		AccessProfile profile = new AccessProfile();
		profile.setName(request.name());
		profile.setDescription(request.description());
		profile.setPermissions(request.permissions() == null ? new HashSet<>() : request.permissions());
		return AccessProfileResponse.from(profileRepository.save(profile));
	}

	@Override
	public AccessProfileResponse update(Long id, AccessProfileRequest request) {
		AccessProfile profile = getProfile(id);
		if (!request.name().equals(profile.getName()) && profileRepository.existsByName(request.name())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Nome de perfil já cadastrado");
		}
		profile.setName(request.name());
		profile.setDescription(request.description());
		profile.setPermissions(request.permissions() == null ? Set.of() : request.permissions());
		return AccessProfileResponse.from(profileRepository.save(profile));
	}

	@Override
	public void delete(Long id) {
		AccessProfile profile = getProfile(id);
		if (userRepository.existsByAccessProfile_Id(id)) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Perfil em uso por usuários");
		}
		profileRepository.delete(profile);
	}

	@Override
	public List<Permission> permissions() {
		return List.of(Permission.values());
	}

	private AccessProfile getProfile(Long id) {
		return profileRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Perfil não encontrado"));
	}

}
