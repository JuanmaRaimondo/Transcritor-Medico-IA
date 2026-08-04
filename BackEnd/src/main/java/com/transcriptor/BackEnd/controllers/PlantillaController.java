package com.transcriptor.BackEnd.controllers;


import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.transcriptor.BackEnd.Entities.Plantilla;
import com.transcriptor.BackEnd.services.PlantillaService;

@RestController
@RequestMapping("api/plantilla")
public class PlantillaController {
    @Autowired
    private PlantillaService plantillaService;

    @PostMapping("/crear")
    public Plantilla crearPlantilla(@RequestBody Plantilla plantilla){
        return plantillaService.crearPlantilla(plantilla);
    }

    @GetMapping("/listar")
    public List<Plantilla> listarPlantillas(){
        return plantillaService.listarPlantillas();
    }

    @GetMapping("/buscar")
    public Plantilla buscarPorTipoEstudio(@RequestParam String tipoEstudio){
        return plantillaService.buscarPorTipoEstudio(tipoEstudio);
    }

    @DeleteMapping("/borrar/{id}")
    public String borrarPlantilla(@PathVariable String id){
        return plantillaService.borrarPlantilla(id);
    }
}
