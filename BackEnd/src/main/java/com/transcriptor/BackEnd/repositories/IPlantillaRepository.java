package com.transcriptor.BackEnd.repositories;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.transcriptor.BackEnd.Entities.Plantilla;

public interface IPlantillaRepository extends MongoRepository<Plantilla ,String > {
    Optional<Plantilla> findBytipoEstudio(String tipoEstudio);
}
