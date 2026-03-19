package com.transcriptor.BackEnd.DTOs;

public record AuthResponseDTO(String token, String nombre,
    String email,
    String especialidad) {
    
}
