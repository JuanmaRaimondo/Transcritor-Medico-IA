package com.transcriptor.BackEnd.repositories;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.transcriptor.BackEnd.Entities.Usuario;

@Repository
public interface IUsuarioRepository extends MongoRepository<Usuario, String>{
    Optional<Usuario> findByEmail(String email);
}
