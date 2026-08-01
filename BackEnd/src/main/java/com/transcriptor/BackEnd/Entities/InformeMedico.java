package com.transcriptor.BackEnd.Entities;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Document(collection = "informes")
public class InformeMedico {
    @Id
    private String id;
    private String nombrePaciente;
    private String apellidoPaciente;
    private String idMedico;

    private String tipoEstudio;
    private String textoCrudo;
    private String textoCorregido;
    private String feedback;

    private String estado;
    private LocalDateTime fechaCreacion;

    
}
