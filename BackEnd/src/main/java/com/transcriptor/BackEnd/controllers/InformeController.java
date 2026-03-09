package com.transcriptor.BackEnd.controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.transcriptor.BackEnd.Entities.InformeMedico;
import com.transcriptor.BackEnd.services.InformeService;

@RestController
@RequestMapping("/api/informe")
public class InformeController {
    @Autowired
    private InformeService informeService;
    
    @PostMapping("/crear")
    public InformeMedico crearInforme(@RequestBody InformeMedico informe){
       InformeMedico informeNuevo = informeService.crearInforme(informe);
       return informeNuevo;
    }

    @GetMapping("/traerlistaInformes/{idPaciente}")
    public List<InformeMedico> traerInformesxPaciente(@PathVariable String idPaciente){
        return informeService.traerInformesPorPaciente(idPaciente);
    }

    @PutMapping("/editar/{idInforme}")
    public InformeMedico editarInforme(@PathVariable String idInforme, @RequestBody InformeMedico informe){
       InformeMedico informeAEditar = informeService.editarInforme(idInforme, informe);
       return informeAEditar;
    }

    @DeleteMapping("/borrar/{idInforme}")
    public String borrarInforme(@PathVariable String idInforme){
       String mensaje = informeService.borrarInforme(idInforme);
        return mensaje;
        
    }
}
