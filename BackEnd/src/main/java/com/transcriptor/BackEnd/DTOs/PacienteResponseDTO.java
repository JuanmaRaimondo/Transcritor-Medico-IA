package com.transcriptor.BackEnd.DTOs;

import java.time.LocalDate;

public record PacienteResponseDTO(String id, 
        String nombre, 
        String apellido, 
        String obraSocial, 
        LocalDate fechaNacimiento) {
    
}
