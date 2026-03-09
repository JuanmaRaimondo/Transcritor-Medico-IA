package com.transcriptor.BackEnd.Entities;

import java.time.LocalDate;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;


@Data
@Document(collection = "pacientes")
public class Paciente {
    @Id    
    private String id;
    private String nombre;
    private String apellido;
    private String obraSocial;
    private LocalDate fechaNacimiento;

    public Paciente(){}

    public Paciente(String id, String nombre, String apellido, String obraSocial, LocalDate fechaNacimiento) {
        this.id = id;
        this.nombre = nombre;
        this.apellido = apellido;
        this.obraSocial = obraSocial;
        this.fechaNacimiento = fechaNacimiento;
    }
    
}
