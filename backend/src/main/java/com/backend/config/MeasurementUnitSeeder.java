package com.backend.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.backend.entity.MeasurementUnit;
import com.backend.repository.MeasurementUnitRepository;

@Configuration
public class MeasurementUnitSeeder {

	@Bean
	CommandLineRunner seedMeasurementUnits(MeasurementUnitRepository repository) {
		return args -> {
			seed(repository, "Grama", "g");
			seed(repository, "Litro", "L");
			seed(repository, "Quilograma", "kg");
			seed(repository, "Unidade", "un");
		};
	}

	private void seed(MeasurementUnitRepository repository, String name, String abbreviation) {
		if (repository.existsByNameIgnoreCase(name) || repository.existsByAbbreviationIgnoreCase(abbreviation)) {
			return;
		}
		MeasurementUnit unit = new MeasurementUnit();
		unit.setName(name);
		unit.setAbbreviation(abbreviation);
		repository.save(unit);
	}

}
