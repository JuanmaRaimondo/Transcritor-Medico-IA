package com.transcriptor.BackEnd.DTOs;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;

public record PacienteRequestDTO( @NotBlank(message = "No puede estar el nombre en blanco") String nombre, @NotBlank String apellido, String obraSocial,@Past LocalDate fechaNacimiento) {
    
}
