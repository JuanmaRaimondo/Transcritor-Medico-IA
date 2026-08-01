package com.transcriptor.BackEnd.Entities;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Data
@Document(collection = "diccionario")
public class TerminoMedico {
    @Id
    private String id;
    private String termino;
    private String categoria;
    public TerminoMedico(){}
    
    public TerminoMedico(String termino, String categoria){
        this.termino = termino;
        this.categoria = categoria;
    }
}