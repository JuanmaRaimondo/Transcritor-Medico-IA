package com.transcriptor.BackEnd.Entities;

import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Document(collection="plantillas")
public class Plantilla {
    @Id
    private String id;
    private String tipoEstudio;
    private String procedimiento;
    private List<String> opcionesCorte;
    private List<String> opcionesLateralidad;
    private List<String> bancoDeFrases;
 }
