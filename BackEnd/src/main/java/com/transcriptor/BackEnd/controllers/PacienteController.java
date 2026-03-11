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

import com.transcriptor.BackEnd.Entities.Paciente;
import com.transcriptor.BackEnd.services.PacienteService;

@RestController
@RequestMapping("/api/paciente")
public class PacienteController {
    @Autowired
    private PacienteService pacienteService;

    @PostMapping("/crear")
    public Paciente crearPaciente(@RequestBody Paciente paciente){
       Paciente pacienteNuevo = pacienteService.pacienteNuevo(paciente);
        return pacienteNuevo;
    }

    @GetMapping("/listapacientes")
    public List<Paciente> listaDePaciente(){
       
        return  pacienteService.listaDePaciente();
    }

    @GetMapping("/traerpaciente/{id}")
    public Paciente traerPacientePorId(@PathVariable String id){
       return pacienteService.buscarPacienteId(id);
    }

    @PutMapping("/editar/{id}")
    public Paciente editarPaciente(@PathVariable String id, @RequestBody Paciente paciente){
      return  pacienteService.editarPaciente(id, paciente);
    }

    @DeleteMapping("/borrar/{id}")
    public String borrarPaciente(@PathVariable String id){
        pacienteService.borrarPaciente(id);
        return "Paciente borrado exitosamente";
    }
}
