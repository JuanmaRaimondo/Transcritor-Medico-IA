package com.transcriptor.BackEnd.Entities;

import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.Data;

@Data
@Document(collection = "usuarios")
public class Usuario {
    @Id
    private Long id;
    private String nombre;
    private String apellido;
    private String email;
    private List<String> preferenciasIA;

    public Usuario(){}

    public Usuario(Long id, String nombre, String apellido, String email, List<String> preferenciasIA) {
        this.id = id;
        this.nombre = nombre;
        this.apellido = apellido;
        this.email = email;
        this.preferenciasIA = preferenciasIA;
    }
    
}
