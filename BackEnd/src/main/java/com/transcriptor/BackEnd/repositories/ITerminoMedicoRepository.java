package com.transcriptor.BackEnd.repositories;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.transcriptor.BackEnd.Entities.TerminoMedico;

public interface ITerminoMedicoRepository extends MongoRepository<TerminoMedico, String>{
    
}