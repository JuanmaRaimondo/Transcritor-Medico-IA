package com.transcriptor.BackEnd.DTOs;

import java.util.Map;

public record CrearInformeDesdePlantillaDTO(
    String nombrePaciente,
    String apellidoPaciente,
    String tipoEstudio,
    Map<String, String> valoresPlaceholders, 
    String interpretacion
) {}