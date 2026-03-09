package com.transcriptor.BackEnd.repositories;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.transcriptor.BackEnd.Entities.InformeMedico;

@Repository
public interface IInformeMedicoRepository extends MongoRepository<InformeMedico, String>{
     List<InformeMedico> findByIdPaciente(String idPaciente);
}
