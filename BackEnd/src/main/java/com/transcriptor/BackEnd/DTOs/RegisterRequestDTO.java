package com.transcriptor.BackEnd.DTOs;

public record RegisterRequestDTO(
    String nombre, 
    String apellido, 
    String email, 
    String password
) {}