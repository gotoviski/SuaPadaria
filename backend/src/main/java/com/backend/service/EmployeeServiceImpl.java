package com.backend.service;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.backend.dto.EmployeeRequest;
import com.backend.dto.EmployeeResponse;
import com.backend.entity.Employee;
import com.backend.repository.EmployeeRepository;

@Service
@Transactional
public class EmployeeServiceImpl implements EmployeeService {

	private final EmployeeRepository employeeRepository;

	public EmployeeServiceImpl(EmployeeRepository employeeRepository) {
		this.employeeRepository = employeeRepository;
	}

	@Override
	@Transactional(readOnly = true)
	public List<EmployeeResponse> findAll(String search) {
		List<Employee> employees = search == null || search.isBlank()
				? employeeRepository.findAll(Sort.by("name"))
				: employeeRepository.findByNameContainingIgnoreCaseOrRoleContainingIgnoreCaseOrPhoneContainingOrderByName(
						search, search, search);
		return employees.stream().map(EmployeeResponse::from).toList();
	}

	@Override
	@Transactional(readOnly = true)
	public EmployeeResponse findById(Long id) {
		return EmployeeResponse.from(getEmployee(id));
	}

	@Override
	public EmployeeResponse create(EmployeeRequest request) {
		if (request.cpf() != null && employeeRepository.existsByCpf(request.cpf())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "CPF já cadastrado");
		}
		Employee employee = new Employee();
		employee.setActive(request.active() == null || request.active());
		apply(employee, request);
		return EmployeeResponse.from(employeeRepository.save(employee));
	}

	@Override
	public EmployeeResponse update(Long id, EmployeeRequest request) {
		Employee employee = getEmployee(id);
		if (request.cpf() != null && !request.cpf().equals(employee.getCpf())
				&& employeeRepository.existsByCpf(request.cpf())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "CPF já cadastrado");
		}
		apply(employee, request);
		employee.setActive(request.active() == null || request.active());
		return EmployeeResponse.from(employeeRepository.save(employee));
	}

	@Override
	public void delete(Long id) {
		employeeRepository.delete(getEmployee(id));
	}

	private void apply(Employee employee, EmployeeRequest request) {
		employee.setName(request.name());
		employee.setCpf(request.cpf());
		employee.setPhone(request.phone());
		employee.setEmail(request.email());
		employee.setBirthDate(request.birthDate());
		employee.setRole(request.role());
		employee.setShift(request.shift());
		employee.setSalary(request.salary());
		employee.setHireDate(request.hireDate());
		employee.setZipCode(request.zipCode());
		employee.setStreet(request.street());
		employee.setNumber(request.number());
		employee.setComplement(request.complement());
		employee.setDistrict(request.district());
		employee.setCity(request.city());
		employee.setState(request.state());
		employee.setNotes(request.notes());
	}

	private Employee getEmployee(Long id) {
		return employeeRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Funcionário não encontrado"));
	}

}
