package com.transcriptor.BackEnd.repositories;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.transcriptor.BackEnd.Entities.Paciente;


@Repository
public interface IPacienteRepository extends MongoRepository<Paciente, String> {
    
}
