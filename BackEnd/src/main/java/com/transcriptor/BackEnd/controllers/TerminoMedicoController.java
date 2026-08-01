package com.transcriptor.BackEnd.controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.transcriptor.BackEnd.Entities.TerminoMedico;
import com.transcriptor.BackEnd.services.TerminoMedicoService;

@RestController
@RequestMapping("/api/diccionario")
public class TerminoMedicoController {

    @Autowired
    private TerminoMedicoService terminoService;

    @PostMapping("/crear")
    public TerminoMedico crearTermino(@RequestBody TerminoMedico termino){
        return terminoService.crearTermino(termino);
    }

    @GetMapping("/listar")
    public List<TerminoMedico> listarTerminos(){
        return terminoService.listarTerminos();
    }

    @DeleteMapping("/borrar/{id}")
    public String borrarTermino(@PathVariable String id){
        return terminoService.borrarTermino(id);
    }
}