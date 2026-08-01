package com.transcriptor.BackEnd.controllers;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.transcriptor.BackEnd.Entities.TipoEstudio;

@RestController
@RequestMapping("/api/tipo-estudio")
public class TipoEstudioController {

    @GetMapping("/listar")
    public List<String> listarTipos() {
        return Arrays.stream(TipoEstudio.values())
                .map(TipoEstudio::getLabel)
                .collect(Collectors.toList());
    }
}