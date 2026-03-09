package com.transcriptor.BackEnd.Entities;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Data
@Document(collection = "informes")
public class InformeMedico {
    @Id
    private String id;
    private String idPaciente;
    private String idMedico;

    private String tipoEstudio;
    private String textoCrudo;
    private String textoCorregido;
    private String feedback;

    private String estado;
    private LocalDateTime fechaCreacion;

    public InformeMedico(){}

    public InformeMedico( String idPaciente, String idMedico, String tipoEstudio, String textoCrudo,
            String textoCorregido, String feedback, String estado, LocalDateTime fechaCreacion) {
        
        this.idPaciente = idPaciente;
        this.idMedico = idMedico;
        this.tipoEstudio = tipoEstudio;
        this.textoCrudo = textoCrudo;
        this.textoCorregido = textoCorregido;
        this.feedback = feedback;
        this.estado = estado;
        this.fechaCreacion = fechaCreacion;
    }
    
}
