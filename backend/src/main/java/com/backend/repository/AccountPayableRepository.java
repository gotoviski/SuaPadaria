package com.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.backend.entity.AccountPayable;
import com.backend.entity.PayableStatus;

public interface AccountPayableRepository extends JpaRepository<AccountPayable, Long> {

	List<AccountPayable> findAllByOrderByDueDateAsc();

	List<AccountPayable> findByStatusOrderByDueDateAsc(PayableStatus status);

	List<AccountPayable> findBySupplierIdOrderByDueDateAsc(Long supplierId);

	List<AccountPayable> findByStatusAndSupplierIdOrderByDueDateAsc(PayableStatus status, Long supplierId);

}
