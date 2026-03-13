package com.transcriptor.BackEnd.Entities;

import java.time.LocalDate;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import lombok.Data;


@Data
@Document(collection = "pacientes")
public class Paciente {
    @Id    
    private String id;
    @NotBlank(message = "El nombre del paciente es obligatorio")
    private String nombre;
    @NotBlank(message = "El apellido del paciente es obligatorio")
    private String apellido;
    @NotBlank(message = "La obra social del paciente es obligatorio")
    private String obraSocial;
    @NotNull
    @Past(message = "Tiene que ser una fecha pasada")
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
