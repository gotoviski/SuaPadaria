package com.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.backend.entity.AccountReceivable;
import com.backend.entity.ReceivableStatus;

public interface AccountReceivableRepository extends JpaRepository<AccountReceivable, Long> {

	List<AccountReceivable> findAllByOrderByDueDateAsc();

	List<AccountReceivable> findByStatusOrderByDueDateAsc(ReceivableStatus status);

	List<AccountReceivable> findByCustomerIdOrderByDueDateAsc(Long customerId);

	List<AccountReceivable> findByStatusAndCustomerIdOrderByDueDateAsc(ReceivableStatus status, Long customerId);

}
