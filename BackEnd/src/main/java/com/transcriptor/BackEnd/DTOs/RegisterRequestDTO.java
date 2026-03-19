package com.transcriptor.BackEnd.DTOs;

public record RegisterRequestDTO(
    String nombre, 
    String especialidad, 
    String email, 
    String password
) {}